// Canned TMDB-shaped data so the lab page can be judged without a TMDB key (lab.html?mock=1).
// Images may not load in mock mode; the card shows placeholders instead.
const parasite = {
  id: 496243, title: "Parasite", year: "2019", releaseDate: "2019-05-30",
  tagline: "Act like you own the place.",
  overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
  runtime: 133, genres: ["Comedy", "Thriller", "Drama"], certification: "R", rating: 8.5, votes: 18000,
  poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdrop: null,
  director: ["Bong Joon Ho"],
  cast: [
    { name: "Song Kang-ho", character: "Kim Ki-taek", photo: null },
    { name: "Lee Sun-kyun", character: "Park Dong-ik", photo: null },
    { name: "Cho Yeo-jeong", character: "Park Yeon-kyo", photo: null },
    { name: "Choi Woo-shik", character: "Kim Ki-woo", photo: null },
    { name: "Park So-dam", character: "Kim Ki-jeong", photo: null },
  ],
  trailerUrl: "https://www.youtube.com/watch?v=5xH0HfJHsaY",
  where: { link: "https://www.themoviedb.org/movie/496243/watch", stream: ["Hulu"], rent: ["Apple TV", "Amazon Video"], buy: ["Apple TV"] },
  tmdbUrl: "https://www.themoviedb.org/movie/496243", imdbId: "tt6751668",
};
const cinema = {
  id: 424, title: "Schindler's List", year: "1993", releaseDate: "1993-12-15", tagline: "The list is life.",
  overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory during World War II.",
  runtime: 195, genres: ["Drama", "History", "War"], certification: "R", rating: 8.6, votes: 16000,
  poster: null, backdrop: null, director: ["Steven Spielberg"],
  cast: [{ name: "Liam Neeson", character: "Oskar Schindler", photo: null }, { name: "Ben Kingsley", character: "Itzhak Stern", photo: null }],
  trailerUrl: null, where: { link: null, stream: [], rent: ["Amazon Video"], buy: [] },
  tmdbUrl: "https://www.themoviedb.org/movie/424", imdbId: "tt0108052",
};
const all = [parasite, cinema];

export function mockCall(params) {
  // Pretend Overseerr: Parasite is on Plex, anything else was never requested.
  if (params.action === "plex") return params.id === "496243" ? { status: "available", plexUrl: null } : { status: "not_requested", plexUrl: null };
  if (params.action === "search") {
    const q = (params.q ?? "").toLowerCase();
    const hits = all.filter((m) => m.title.toLowerCase().includes(q) || q.length < 2);
    return { results: hits.map((m) => ({ id: m.id, title: m.title, year: m.year, poster: m.poster, rating: m.rating, overview: m.overview.slice(0, 160) })) };
  }
  return { movie: all.find((m) => String(m.id) === params.id) };
}
