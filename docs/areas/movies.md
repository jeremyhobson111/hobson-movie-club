# Area: movies (TMDB lookup, movie card, reviews)

**Status:** test only. `lab.html` is an unlisted test page (noindex) to try designs before the club's rules are decided.

## Files
- `supabase/functions/tmdb/index.ts`: the Edge Function (search + movie details). Secret `TMDB_READ_TOKEN`. See DEC-004.
- `supabase/functions/overseerr/index.ts`: read-only "is it on Plex?" check against the owner's Overseerr. Secrets `OVERSEERR_URL`, `OVERSEERR_API_KEY`. See DEC-011. Check it with `node --experimental-strip-types --no-warnings tests/overseerr.check.mjs`.
- `lab.html`, `js/lab.js`, `css/lab.css`: search, movie card, review section. `js/lab-mock.js` + `lab.html?mock=1` shows it with sample data and no login or key.
- `js/supabase.js` `callFunction`: calls one of our Supabase functions (TMDB, test notifications) as the signed-in person. `js/dom.js`: shared element builder.

## Notes
- Reviews on the lab page are stored only in the browser (localStorage key `hmc-lab-reviews`); the "everyone's reviews" list is made-up sample data to preview the weekly reveal. A real design needs a `reviews` table (RLS, one row per person per movie, star rating 1-5 + text); that is a remote migration, so ask first.
- TMDB attribution text must stay in the page footer.
- TMDB's streaming data (JustWatch) lists services and rent/buy, not Plex.
- Poster/backdrop images load straight from image.tmdb.org.
- The movie card's "On our Plex?" line comes from the `overseerr` function. In `lab.html?mock=1`, Parasite shows as on Plex and anything else as not requested.
- Overseerr statuses: none = not requested, 2 requested, 3 processing, 4 partial, 5 available. `plexUrl` only appears if Overseerr is linked to Plex.
