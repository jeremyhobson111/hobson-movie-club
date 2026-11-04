# Area: movies (TMDB lookup, movie card, reviews)

**Status:** test only. `lab.html` is an unlisted test page (noindex) to try designs before the club's rules are decided.

## Files
- `supabase/functions/tmdb/index.ts`: the Edge Function (search + movie details). Secret `TMDB_READ_TOKEN`. See DEC-004.
- `lab.html`, `js/lab.js`, `css/lab.css`: search, movie card, review section. `js/lab-mock.js` + `lab.html?mock=1` shows it with sample data and no login or key.
- `js/supabase.js` `callTmdb`: calls the function as the signed-in person. `js/dom.js`: shared element builder.

## Notes
- Reviews on the lab page are stored only in the browser (localStorage key `hmc-lab-reviews`); the "everyone's reviews" list is made-up sample data to preview the weekly reveal. A real design needs a `reviews` table (RLS, one row per person per movie, star rating 1-5 + text); that is a remote migration, so ask first.
- TMDB attribution text must stay in the page footer.
- TMDB's streaming data (JustWatch) lists services and rent/buy, not Plex.
- Poster/backdrop images load straight from image.tmdb.org.
