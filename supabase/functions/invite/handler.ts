// Invites a family member on behalf of an admin: sends the branded invite email AND marks the account
// confirmed straight away. A normal invite leaves the account unconfirmed until the link is clicked, and an
// unconfirmed account cannot use the sign-in box (Supabase says "Signups not allowed"), so a link that
// expired or was opened by a mail app locked people out. Confirmed from the start, they can always sign in.
// It imports nothing from Deno or npm, so tests/invite.check.mjs can run it under Node with a fake database.
//
//   POST { email } -> { ok: true, email }
const ALLOWED_ORIGINS = [
  "https://hobsonmovieclub.com",
  "https://www.hobsonmovieclub.com",
  "https://jeremyhobson111.github.io",
  "http://localhost:8000",
];
const SITE = "https://hobsonmovieclub.com/";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Deps = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
};

// The signed-in person's id, from their login token (Supabase has already checked the signature
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
      "Cache-Control": "no-store",
    };
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return reply({ error: "Use POST." }, 405);
    if (!callerId(req)) return reply({ error: "Please sign in." }, 401);

    const url = deps.env("SUPABASE_URL");
    const service = deps.env("SUPABASE_SERVICE_ROLE_KEY");
    const anon = deps.env("SUPABASE_ANON_KEY");
    if (!url || !service || !anon) return reply({ error: "The server is not set up." }, 500);

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
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (email.length > 254 || !EMAIL.test(email)) return reply({ error: "That doesn't look like an email address." }, 400);

    const auth = (path: string, init: RequestInit = {}) =>
      deps.fetch(`${url}/auth/v1/${path}`, {
        ...init,
        headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
      });

    // Step 1: create the account and send the invite email.
    const inviteRes = await auth(`invite?redirect_to=${encodeURIComponent(SITE)}`, { method: "POST", body: JSON.stringify({ email }) });
    if (inviteRes.status === 422 || inviteRes.status === 409) return reply({ error: "That email is already a member." }, 409);
    if (!inviteRes.ok) return reply({ error: "Couldn't send the invite." }, 502);
    const id = (await inviteRes.json())?.id;
    if (typeof id !== "string") return reply({ error: "Couldn't send the invite." }, 502);

    // Step 2: confirm the account now, so signing in works even if the emailed link is never used.
    const confirmRes = await auth(`admin/users/${id}`, { method: "PUT", body: JSON.stringify({ email_confirm: true }) });
    if (!confirmRes.ok) return reply({ error: "The invite was sent, but the account could not be confirmed. Ask them to use the link in the email." }, 502);

    return reply({ ok: true, email });
  };
}
