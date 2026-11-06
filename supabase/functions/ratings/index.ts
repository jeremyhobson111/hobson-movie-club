// IMDb and Rotten Tomatoes (critics and audience) scores for a movie, via MDBList. Read-only.
// The MDBList API key lives here as the Supabase secret MDBLIST_API_KEY and never reaches the
// browser. Only logged-in people may call it.
//   GET ?id=<tmdb id> -> { imdb, rtCritic, rtAudience, sources }
// imdb is out of 10; the two Rotten Tomatoes scores are percentages. Any of them may be null.
// sources lists every rating name MDBList sent back, so a wrong guess about a name is easy to spot.
const ALLOWED_ORIGINS = [
  "https://hobsonmovieclub.com",
  "https://www.hobsonmovieclub.com",
  "https://jeremyhobson111.github.io",
  "http://localhost:8000",
];

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

// MDBList sends { ratings: [{ source: "imdb" | "tomatoes" | "tomatoesaudience" | ..., value, score, ... }] }.
// The audience score has gone by more than one name, so each score lists the names to try.
// If `value` is empty it falls back to `score`.
function pick(ratings: any[], names: string[]): number | null {
  for (const name of names) {
    const r = ratings.find((x) => x?.source === name);
    for (const v of [r?.value, r?.score]) {
      const n = v == null || v === "" ? NaN : Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
    "Content-Type": "application/json",
    // Scores barely move, and the free plan has a daily limit, so let browsers keep them for a day.
    "Cache-Control": "private, max-age=86400",
  };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (jwtRole(req) !== "authenticated") return reply({ error: "Please sign in." }, 401);

  const key = Deno.env.get("MDBLIST_API_KEY");
  if (!key) return reply({ error: "MDBList has not been set up yet." }, 500);

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d{1,9}$/.test(id)) return reply({ error: "Bad movie id." }, 400);

  try {
    const res = await fetch(`https://api.mdblist.com/tmdb/movie/${id}?${new URLSearchParams({ apikey: key })}`, { headers: { accept: "application/json" } });
    if (res.status === 404) return reply({ error: "MDBList doesn't know this movie." }, 404);
    if (res.status === 429) return reply({ error: "MDBList daily limit reached." }, 429);
    if (!res.ok) return reply({ error: `MDBList error (${res.status}).` }, 502);
    const ratings = (await res.json())?.ratings;
    const list = Array.isArray(ratings) ? ratings : [];
    return reply({
      imdb: pick(list, ["imdb"]),
      rtCritic: pick(list, ["tomatoes"]),
      rtAudience: pick(list, ["tomatoesaudience", "popcorn", "audience"]),
      sources: list.map((r) => r?.source).filter((s) => typeof s === "string"),
    });
  } catch {
    return reply({ error: "Couldn't reach MDBList." }, 502);
  }
});
