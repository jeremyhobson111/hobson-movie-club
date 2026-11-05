// Asks the owner's Overseerr whether a movie is already on Plex. Read-only: it never requests
// anything. The Overseerr address and API key live here as Supabase secrets (OVERSEERR_URL,
// OVERSEERR_API_KEY) and never reach the browser. Only logged-in people may call it.
//   GET ?id=<tmdb id> -> { status, plexUrl }
// status is one of: available | partial | processing | requested | not_requested
const ALLOWED_ORIGINS = [
  "https://hobsonmovieclub.com",
  "https://www.hobsonmovieclub.com",
  "https://jeremyhobson111.github.io",
  "http://localhost:8000",
];

// Overseerr's media status numbers (mediaInfo.status). No mediaInfo at all means nobody asked yet.
const STATUS: Record<number, string> = { 2: "requested", 3: "processing", 4: "partial", 5: "available" };

// Supabase has already checked the token's signature (verify_jwt). The public anon key is also
// a valid token, so additionally require a real signed-in person.
function jwtRole(req: Request): string | null {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "");
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
    "Content-Type": "application/json",
    // Short cache: availability changes when a download finishes.
    "Cache-Control": "private, max-age=60",
  };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (jwtRole(req) !== "authenticated") return reply({ error: "Please sign in." }, 401);

  const base = (Deno.env.get("OVERSEERR_URL") ?? "").replace(/\/+$/, "");
  const key = Deno.env.get("OVERSEERR_API_KEY");
  if (!base || !key) return reply({ error: "Overseerr has not been set up yet." }, 500);

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d{1,9}$/.test(id)) return reply({ error: "Bad movie id." }, 400);

  try {
    const res = await fetch(`${base}/api/v1/movie/${id}`, { headers: { "X-Api-Key": key, accept: "application/json" } });
    if (res.status === 404) return reply({ error: "Overseerr doesn't know this movie." }, 404);
    if (!res.ok) return reply({ error: `Overseerr error (${res.status}).` }, 502);
    const info = (await res.json())?.mediaInfo;
    const plexUrl = typeof info?.plexUrl === "string" && /^https?:\/\//.test(info.plexUrl) ? info.plexUrl : null;
    return reply({ status: STATUS[info?.status] ?? "not_requested", plexUrl });
  } catch {
    // Network failure: the owner's server is probably off or unreachable.
    return reply({ error: "Couldn't reach Overseerr." }, 502);
  }
});
