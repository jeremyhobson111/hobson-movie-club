// Lab page: try TMDB search, a movie card, and a review section. Test only; reviews live in this
// browser (localStorage), not the database, until the club's rules are decided.
import { h } from "./dom.js";
import * as api from "./supabase.js";
import { mockCall } from "./lab-mock.js";

const app = document.getElementById("app");
const mock = new URLSearchParams(location.search).has("mock");
let session = null;

async function tmdb(params) {
  if (mock) return mockCall(params);
  const r = await api.callFunction(session, "tmdb", { params });
  session = r.session;
  return r.data;
}

// Is the movie on the club's Plex? (Asks Seerr through our function; read-only.)
async function plexStatus(id) {
  if (mock) return mockCall({ action: "plex", id: String(id) });
  const r = await api.callFunction(session, "seerr", { params: { id: String(id) } });
  session = r.session;
  return r.data;
}

const PLEX_TEXT = {
  available: "On Plex, ready to watch.",
  partial: "Only partly on Plex so far.",
  processing: "Requested and downloading now.",
  requested: "Requested, waiting for approval or download.",
  not_requested: "Not on Plex yet, and nobody has requested it.",
};

// ---------- reviews (this browser only) ----------
const KEY = "hmc-lab-reviews";
function readReviews() { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } }
function writeReview(id, review) {
  const all = readReviews();
  if (review) all[id] = review; else delete all[id];
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* private mode: review just isn't kept */ }
}

// Made-up reviews, only to preview what the end-of-week reveal could look like.
const SAMPLE = [
  { name: "Dave", stars: 4, text: "Great pacing. Didn't see the second half coming." },
  { name: "Sam", stars: 5, text: "Instant favorite. Already want to rewatch." },
  { name: "Alex", stars: 3, text: "Good, but I thought it dragged in the middle." },
];

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

// ---------- search ----------
function showSearch(prefill = "") {
  const input = h("input", { type: "search", placeholder: "Search for a movie…", value: prefill, autocomplete: "off", "aria-label": "Search for a movie" });
  const results = h("div", { className: "results" });
  let timer, latest = 0;

  async function run() {
    const q = input.value.trim();
    const mine = ++latest;
    if (q.length < 2) { results.replaceChildren(); return; }
    results.replaceChildren(h("p", { className: "muted", textContent: "Searching…" }));
    try {
      const { results: list } = await tmdb({ action: "search", q });
      if (mine !== latest) return; // a newer search already replaced this one
      results.replaceChildren(...(list.length ? list.map((m) => resultTile(m, q)) : [h("p", { className: "muted", textContent: "No movies found." })]));
    } catch (e) {
      results.replaceChildren(h("p", { className: "error", textContent: e.message }));
    }
  }
  input.oninput = () => { clearTimeout(timer); timer = setTimeout(run, 350); };
  app.replaceChildren(
    h("h2", { textContent: "Movie lookup" }),
    // replaceChildren turns null into the text "null", so only pass real nodes.
    ...(mock ? [h("p", { className: "hint", textContent: "Mock mode: sample data only. Try searching “parasite” or “schindler”." })] : []),
    input, results);
  if (prefill) run(); else input.focus();
}

function posterImg(src, title, cls) {
  const fallback = () => h("div", { className: `${cls} placeholder`, textContent: title });
  if (!src) return fallback();
  const img = h("img", { src, alt: `${title} poster`, className: cls, loading: "lazy" });
  img.onerror = () => img.replaceWith(fallback());
  return img;
}

function resultTile(m, q) {
  const b = h("button", { type: "button", className: "tile" },
    posterImg(m.poster, m.title, "tile-poster"),
    h("span", { className: "tile-title", textContent: m.title }),
    h("span", { className: "tile-meta muted", textContent: [m.year, m.rating ? `★ ${m.rating}` : null].filter(Boolean).join(" · ") }));
  b.onclick = () => showMovie(m.id, q);
  return b;
}

// ---------- movie card ----------
async function showMovie(id, backQuery) {
  app.replaceChildren(h("p", { className: "muted", textContent: "Loading movie…" }));
  try {
    const { movie } = await tmdb({ action: "movie", id: String(id) });
    renderMovie(movie, backQuery);
  } catch (e) {
    app.replaceChildren(h("p", { className: "error", textContent: e.message }), backButton(backQuery));
  }
}

function backButton(q) {
  const b = h("button", { type: "button", className: "ghost", textContent: "← Back to search" });
  b.onclick = () => showSearch(q);
  return b;
}

const chip = (t) => h("span", { className: "chip", textContent: t });
const hours = (min) => (min ? `${Math.floor(min / 60)}h ${min % 60}m` : null);
const ext = (href, textContent) => h("a", { href, target: "_blank", rel: "noopener", textContent });

function renderMovie(m, backQuery) {
  const meta = [m.year, m.certification, hours(m.runtime)].filter(Boolean).join(" · ");
  const links = [
    m.trailerUrl ? ext(m.trailerUrl, "▶ Trailer") : null,
    ext(m.tmdbUrl, "TMDB"),
    m.imdbId ? ext(`https://www.imdb.com/title/${m.imdbId}/`, "IMDb") : null,
  ];
  const where = [["Stream", m.where.stream], ["Rent", m.where.rent], ["Buy", m.where.buy]].filter(([, l]) => l.length);

  // Filled in after the card is shown; a failure here must never break the card itself.
  const plexBox = h("div", {}, h("h3", { textContent: "On our Plex?" }), h("p", { className: "muted", textContent: "Checking…" }));
  const plexLine = (node) => plexBox.lastChild.replaceWith(node);
  plexStatus(m.id).then(({ status, plexUrl }) => {
    plexLine(h("p", {}, PLEX_TEXT[status] ?? "Unknown.", plexUrl ? [" ", ext(plexUrl, "Open in Plex")] : null));
  }).catch((e) => plexLine(h("p", { className: "muted", textContent: `Couldn't check Plex: ${e.message}` })));

  const card = h("article", { className: "movie card" },
    m.backdrop ? h("img", { className: "backdrop", src: m.backdrop, alt: "" }) : null,
    h("div", { className: "movie-top" },
      posterImg(m.poster, m.title, "movie-poster"),
      h("div", { className: "movie-head" },
        h("h2", { textContent: m.title }),
        h("p", { className: "muted", textContent: meta }),
        m.tagline ? h("p", { className: "tagline", textContent: `“${m.tagline}”` }) : null,
        h("div", { className: "chips" }, m.genres.map(chip)),
        m.rating ? h("p", { className: "score" },
          h("strong", { textContent: m.rating.toFixed(1) }), " / 10 on TMDB ",
          h("span", { className: "muted", textContent: `(${(m.rating / 2).toFixed(1)} of 5 · ${m.votes.toLocaleString()} votes)` })) : null,
        m.director.length ? h("p", {}, h("span", { className: "muted", textContent: "Directed by " }), m.director.join(", ")) : null,
        h("p", { className: "links" }, links))),
    m.overview ? h("p", { className: "overview", textContent: m.overview }) : null,
    m.cast.length ? h("div", {}, h("h3", { textContent: "Cast" }),
      h("div", { className: "cast" }, m.cast.map((c) => h("div", { className: "cast-member" },
        c.photo ? h("img", { src: c.photo, alt: "", loading: "lazy" }) : h("div", { className: "cast-photo placeholder", textContent: c.name[0] }),
        h("strong", { textContent: c.name }),
        h("span", { className: "muted", textContent: c.character }))))) : null,
    plexBox,
    h("div", {}, h("h3", { textContent: "Where to watch (US)" }),
      where.length ? where.map(([label, list]) => h("p", {}, h("span", { className: "muted", textContent: `${label}: ` }), list.join(", ")))
        : h("p", { className: "muted", textContent: "Not listed in TMDB's streaming data. (The club plan is Plex, which TMDB doesn't know about.)" })));

  app.replaceChildren(backButton(backQuery), card, reviewSection(m));
}

// ---------- reviews ----------
function reviewSection(m) {
  const box = h("section", { className: "card reviews" });
  const draw = () => {
    const mine = readReviews()[m.id];
    const everyone = [...(mine ? [{ name: "You", ...mine }] : []), ...SAMPLE];
    const avg = everyone.reduce((s, r) => s + r.stars, 0) / everyone.length;

    let picked = mine?.stars ?? 0;
    const text = h("textarea", { placeholder: "What did you think? (optional)", maxLength: 600, value: mine?.text ?? "" });
    const row = h("div", { className: "star-row", role: "radiogroup", "aria-label": "Your rating out of 5" });
    const paint = () => [...row.children].forEach((b, i) => {
      b.textContent = i < picked ? "★" : "☆";
      b.className = i < picked ? "star on" : "star";
      b.setAttribute("aria-checked", String(i + 1 === picked));
    });
    for (let i = 1; i <= 5; i++) {
      const b = h("button", { type: "button", role: "radio", ariaLabel: `${i} star${i > 1 ? "s" : ""}` });
      b.onclick = () => { picked = i; paint(); };
      row.append(b);
    }
    paint();
    const save = h("button", { type: "button", textContent: mine ? "Update my review" : "Save my review" });
    const msg = h("span", { className: "muted" });
    save.onclick = () => {
      if (!picked) { msg.textContent = "Pick a star rating first."; return; }
      writeReview(m.id, { stars: picked, text: text.value.trim(), at: new Date().toISOString() });
      draw();
    };
    const remove = mine ? h("button", { type: "button", className: "ghost", textContent: "Delete mine" }) : null;
    if (remove) remove.onclick = () => { writeReview(m.id, null); draw(); };

    box.replaceChildren(
      h("h3", { textContent: "Your review" }), row, text, h("div", { className: "actions" }, save, remove, msg),
      h("h3", { textContent: "Everyone's reviews" }),
      h("p", { className: "hint", textContent: "Sample people and sample reviews, to preview the weekly reveal. Yours is real but only saved in this browser." }),
      h("p", { className: "avg" }, h("strong", { textContent: avg.toFixed(1) }), ` / 5 average from ${everyone.length}`),
      ...everyone.map((r) => h("div", { className: "review" },
        h("div", {}, h("strong", { textContent: r.name }), " ", h("span", { className: "stars", textContent: stars(r.stars) })),
        r.text ? h("p", { textContent: r.text }) : null)));
  };
  draw();
  return box;
}

// ---------- start ----------
(async () => {
  if (mock) return showSearch();
  try { session = (await api.sessionFromLink()) ?? api.loadSession(); } catch { session = null; }
  if (!session) {
    app.replaceChildren(h("div", { className: "card" }, h("p", { textContent: "Please sign in first, then come back to this page." }), h("a", { href: "./", textContent: "Go to sign in" })));
    return;
  }
  showSearch();
})();
