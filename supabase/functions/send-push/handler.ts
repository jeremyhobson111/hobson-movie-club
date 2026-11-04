// Sends TEST push notifications on behalf of an admin. The automatic notifications (finished-watching,
// reminders) will reuse this sending code later. It imports nothing from Deno or npm, so the tests
// (tests/send-push.check.mjs) can run it under Node with a fake sender and a fake database.
//
//   POST { user_ids?: string[], everyone?: boolean, kind, title, body, url? }
//   -> { results: [{ user_id, sent, failed, removed }], skipped: [user_id, ...] }

export const KINDS = ["test", "review_prompt", "reminder_2d", "reminder_1d", "pick_turn", "reviews_revealed"];
const ALLOWED_ORIGINS = [
  "https://hobsonmovieclub.com",
  "https://www.hobsonmovieclub.com",
  "https://jeremyhobson111.github.io",
  "http://localhost:8000",
];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PEOPLE = 50;

export type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
export type Deps = {
  env: (name: string) => string | undefined;
  send: (sub: Subscription, payload: string, opts: { TTL: number }) => Promise<unknown>;
  fetch: typeof fetch;
};

// The signed-in person's id, taken from their login token (Supabase has already checked the signature
// because this function runs with verify_jwt on). The public anon key is also a valid token, so require a real person.
function callerId(req: Request): string | null {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "");
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "authenticated" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function makeHandler(deps: Deps) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get("origin") ?? "";
    const headers = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Content-Type": "application/json",
    };
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return reply({ error: "Use POST." }, 405);
    if (!callerId(req)) return reply({ error: "Please sign in." }, 401);

    const url = deps.env("SUPABASE_URL");
    const service = deps.env("SUPABASE_SERVICE_ROLE_KEY");
    const anon = deps.env("SUPABASE_ANON_KEY");
    if (!url || !service || !anon) return reply({ error: "The server is not set up." }, 500);
    if (!deps.env("VAPID_PUBLIC_KEY") || !deps.env("VAPID_PRIVATE_KEY") || !deps.env("VAPID_SUBJECT")) {
      return reply({ error: "The push keys have not been set up yet." }, 500);
    }

    // Admins only: ask the database as the caller. The admins table shows a person only their own row.
    const adminRes = await deps.fetch(`${url}/rest/v1/admins?select=user_id`, {
      headers: { apikey: anon, Authorization: req.headers.get("authorization") ?? "" },
    });
    const admins = adminRes.ok ? await adminRes.json() : [];
    if (!Array.isArray(admins) || admins.length === 0) return reply({ error: "Admins only." }, 403);

    let input: any;
    try {
      input = await req.json();
    } catch {
      return reply({ error: "Bad request." }, 400);
    }
    const kind = String(input?.kind ?? "");
    const title = String(input?.title ?? "").trim();
    const body = String(input?.body ?? "").trim();
    const link = typeof input?.url === "string" && input.url.length <= 200 ? input.url : "./";
    const ids: string[] = Array.isArray(input?.user_ids) ? input.user_ids : [];
    if (!KINDS.includes(kind)) return reply({ error: "Unknown kind of notification." }, 400);
    if (title.length < 1 || title.length > 80) return reply({ error: "The title must be 1 to 80 characters." }, 400);
    if (body.length < 1 || body.length > 200) return reply({ error: "The message must be 1 to 200 characters." }, 400);
    if (!input?.everyone && (ids.length === 0 || ids.length > MAX_PEOPLE || !ids.every((i) => UUID.test(i)))) {
      return reply({ error: `Pick 1 to ${MAX_PEOPLE} people, or everyone.` }, 400);
    }

    const db = (path: string, init: RequestInit = {}) =>
      deps.fetch(`${url}/rest/v1/${path}`, {
        ...init,
        headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      });

    const filter = input?.everyone ? "" : `&user_id=in.(${ids.join(",")})`;
    const subsRes = await db(`push_subscriptions?select=id,user_id,endpoint,p256dh,auth${filter}&limit=500`);
    if (!subsRes.ok) return reply({ error: "Could not read the devices." }, 500);
    const subs: { id: number; user_id: string; endpoint: string; p256dh: string; auth: string }[] = await subsRes.json();

    // Always marked as a test, so nobody mistakes it for the real thing.
    const shownTitle = `Test: ${title}`;
    const payload = JSON.stringify({ title: shownTitle, body, url: link, tag: kind });

    const byUser = new Map<string, { sent: number; failed: number; removed: number }>();
    for (const s of subs) {
      const r = byUser.get(s.user_id) ?? { sent: 0, failed: 0, removed: 0 };
      try {
        await deps.send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
        r.sent += 1;
      } catch (e) {
        r.failed += 1;
        // 404/410 mean the device is gone for good (app uninstalled, permission removed): forget it.
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await db(`push_subscriptions?id=eq.${s.id}`, { method: "DELETE" });
          r.removed += 1;
        }
      }
      byUser.set(s.user_id, r);
    }

    const results = [...byUser].map(([user_id, r]) => ({ user_id, ...r }));
    if (results.length) {
      const rows = results.map((r) => ({
        user_id: r.user_id, kind, title: shownTitle, body, is_test: true, devices_sent: r.sent, devices_failed: r.failed,
      }));
      const logRes = await db("notification_log", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rows) });
      if (!logRes.ok) console.log(JSON.stringify({ logged: false, status: logRes.status, error: (await logRes.text()).slice(0, 300) }));
    }
    const skipped = input?.everyone ? [] : ids.filter((i) => !byUser.has(i));
    return reply({ results, skipped });
  };
}
