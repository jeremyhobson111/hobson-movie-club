// Movie lookups for the club site, via TMDB. The TMDB token lives here as a Supabase
// secret (TMDB_READ_TOKEN) and never reaches the browser. Only logged-in people may call it.
//   GET ?action=search&q=<text>   -> short list of matching movies
//   GET ?action=movie&id=<tmdb id> -> everything the movie card needs
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
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

async function tmdb(path: string, params: Record<string, string>, token: string) {
  const res = await fetch(`${TMDB}${path}?${new URLSearchParams({ language: "en-US", ...params })}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (res.status === 404) throw new HttpError(404, "Movie not found.");
  if (!res.ok) throw new HttpError(502, `TMDB error (${res.status}).`);
  return res.json();
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const img = (path: string | null, size: string) => (path ? `${IMG}/${size}${path}` : null);
const year = (date?: string) => (date ? date.slice(0, 4) : null);

// TMDB sorts by text match, so obscure films with a similar name can crowd out the famous one.
// We look at two pages, then order by how many people rated each film (a good "is it well known?"
// signal), with a boost when the title starts with what was typed. Films nobody rated sink.
function rank(results: any[], q: string) {
  const typed = q.trim().toLowerCase();
  const seen = new Set<number>();
  const score = (m: any) => (1 + (m.vote_count ?? 0)) * ((m.title ?? "").toLowerCase().startsWith(typed) ? 3 : 1);
  return results
    .filter((m) => !seen.has(m.id) && seen.add(m.id))
    .sort((a, b) => score(b) - score(a));
}

function shapeSearch(results: any[]) {
  return results.slice(0, 12).map((m: any) => ({
    id: m.id,
    title: m.title,
    year: year(m.release_date),
    poster: img(m.poster_path, "w185"),
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
    overview: (m.overview ?? "").slice(0, 160),
  }));
}

function shapeMovie(d: any) {
  const us = d.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US");
  const certification = us?.release_dates?.find((x: any) => x.certification)?.certification ?? null;
  const trailer = d.videos?.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
  const providers = d["watch/providers"]?.results?.US ?? {};
  const names = (list?: any[]) => (list ?? []).map((p) => p.provider_name);
  return {
    id: d.id,
    title: d.title,
    year: year(d.release_date),
    releaseDate: d.release_date || null,
    tagline: d.tagline || null,
    overview: d.overview || null,
    runtime: d.runtime || null,
    genres: (d.genres ?? []).map((g: any) => g.name),
    certification,
    rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    votes: d.vote_count ?? 0,
    poster: img(d.poster_path, "w500"),
    backdrop: img(d.backdrop_path, "w780"),
    director: (d.credits?.crew ?? []).filter((c: any) => c.job === "Director").map((c: any) => c.name),
    cast: (d.credits?.cast ?? []).slice(0, 8).map((c: any) => ({
      name: c.name,
      character: c.character,
      photo: img(c.profile_path, "w185"),
    })),
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    where: { link: providers.link ?? null, stream: names(providers.flatrate), rent: names(providers.rent), buy: names(providers.buy) },
    tmdbUrl: `https://www.themoviedb.org/movie/${d.id}`,
    imdbId: d.external_ids?.imdb_id ?? null,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const headers = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "private, max-age=300",
  };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (jwtRole(req) !== "authenticated") return reply({ error: "Please sign in." }, 401);

  const token = Deno.env.get("TMDB_READ_TOKEN");
  if (!token) return reply({ error: "The TMDB token has not been set up yet." }, 500);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (action === "search") {
      const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
      if (q.length < 2) return reply({ results: [] });
      const ask = (page: number) => tmdb("/search/movie", { query: q, include_adult: "false", page: String(page) }, token);
      // The second page is a bonus: if it fails, the first page still answers.
      const pages = await Promise.all([ask(1), ask(2).catch(() => ({ results: [] }))]);
      return reply({ results: shapeSearch(rank(pages.flatMap((p) => p.results ?? []), q)) });
    }
    if (action === "movie") {
      const id = url.searchParams.get("id") ?? "";
      if (!/^\d{1,9}$/.test(id)) return reply({ error: "Bad movie id." }, 400);
      const data = await tmdb(`/movie/${id}`, { append_to_response: "credits,videos,release_dates,watch/providers,external_ids" }, token);
      return reply({ movie: shapeMovie(data) });
    }
    return reply({ error: "Unknown action." }, 400);
  } catch (e) {
    if (e instanceof HttpError) return reply({ error: e.message }, e.status);
    return reply({ error: "Something went wrong." }, 500);
  }
});
