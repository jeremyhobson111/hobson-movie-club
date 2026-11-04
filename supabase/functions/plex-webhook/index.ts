// Catches Plex webhooks ("someone started/finished a movie") and logs them in plex_events.
// Phase 1 only RECORDS what Plex sends; no notifications yet (see docs/areas/plex.md).
//
// Plex cannot send a login token, so this function is public (verify_jwt off) and instead
// requires a secret in the web address: .../plex-webhook?key=<PLEX_WEBHOOK_SECRET>.
// It writes with the service-role key, which stays inside Supabase and never reaches the browser.

const LOGGED_EVENTS = new Set(["media.play", "media.scrobble"]); // scrobble = watched past ~90%

// Compare secrets without stopping at the first wrong character.
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
const int = (v: unknown) => (typeof v === "number" && Number.isSafeInteger(v) ? v : null);

// Plex sends multipart/form-data with the JSON in a field called "payload" (plus an optional poster image).
async function readPayload(req: Request): Promise<any> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const raw = (await req.formData()).get("payload");
    return typeof raw === "string" ? JSON.parse(raw) : null;
  }
  return JSON.parse(await req.text());
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("PLEX_WEBHOOK_SECRET") ?? "";
  const given = new URL(req.url).searchParams.get("key") ?? "";
  if (!secret || !sameSecret(secret, given)) return new Response("Unauthorized", { status: 401 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let p: any;
  try {
    p = await readPayload(req);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  // Ignore everything except movie plays/finishes: acknowledge so Plex doesn't retry.
  if (!p || !LOGGED_EVENTS.has(p.event) || p.Metadata?.type !== "movie") return new Response("ignored");

  const guids: string[] = Array.isArray(p.Metadata?.Guid) ? p.Metadata.Guid.map((g: any) => String(g?.id ?? "")) : [];
  const tmdb = guids.find((g) => g.startsWith("tmdb://"))?.slice(7);

  const row = {
    event: p.event,
    plex_account_id: int(p.Account?.id),
    plex_account_title: text(p.Account?.title, 100),
    plex_account_thumb: text(p.Account?.thumb, 300),
    media_title: text(p.Metadata?.title, 200),
    tmdb_id: tmdb && /^\d{1,9}$/.test(tmdb) ? Number(tmdb) : null,
    plex_rating_key: text(String(p.Metadata?.ratingKey ?? ""), 40),
  };

  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/plex_events`, {
    method: "POST",
    headers: {
      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  // A non-200 makes Plex retry, which is what we want if the database hiccuped.
  // Say why in the function logs (the database's error text only: no key, no payload).
  if (!res.ok) console.log(JSON.stringify({ stored: false, status: res.status, error: (await res.text()).slice(0, 300) }));
  return new Response(res.ok ? "ok" : "database error", { status: res.ok ? 200 : 500 });
});
