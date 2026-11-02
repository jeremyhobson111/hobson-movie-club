# hobson-movie-club: project brief
<!-- Always loaded into every session. Keep under ~60 lines. Facts, not history. -->

## What it is
A website that manages our family movie club. v1 starts with a survey to find out what the family wants the club to be, then adds rating/reviewing watched movies and movie poster/info lookup.

## Users and goals
Family members only (small group, not public). Each person logs in with email so their answers, ratings and reviews are theirs.

## Stack
- Front end: plain HTML, CSS and JavaScript. No framework, no build step.
- Data and login: Supabase (Postgres + email login).
- Hosting: GitHub Pages (static files).
- Poster/info lookup: outside movie database, provider not chosen yet (see ROADMAP).

## Commands
- Install: none (no dependencies yet)
- Run locally: `python -m http.server 8000` from the repo root, then open http://localhost:8000 (TBD once the site exists)
- Test: none yet (add when there is logic worth testing)
- Lint/format: none yet
- Build: none (static files)

## Areas
(none yet; add docs/areas/<area>.md as the site grows, e.g. survey, reviews)

## Environments
- Local: static server as above, pointed at the Supabase project
- Preview: none (GitHub Pages has no previews; test locally)
- Production: GitHub Pages site for this repo, only changed on release

## Standing preferences specific to this project
- Family-only. Keep it simple and friendly; no payments, no public sign-up.
- Supabase keys in the browser must be the public "anon" key only, with row-level security on every table. Never the service key.
- The survey questions are still to come from the owner. Do not invent them.