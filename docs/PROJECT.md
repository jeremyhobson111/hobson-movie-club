# hobson-movie-club: project brief
<!-- Always loaded into every session. Keep under ~60 lines. Facts, not history. -->

## What it is
A website that manages our family movie club. v1 starts with a survey to find out what the family wants the club to be, then adds rating/reviewing watched movies and movie poster/info lookup.

## Users and goals
Family members only (small group, not public). Each person logs in with email so their answers, ratings and reviews are theirs.

## Stack
- Front end: plain HTML, CSS and JavaScript. No framework, no build step.
- Data and login: Supabase (Postgres + email login). Project "Hobson Movie Club", ref `bfpjetztwfcwzcjfxakx`, URL https://bfpjetztwfcwzcjfxakx.supabase.co (us-west-1). Auto-expose and auto-RLS settings chosen at creation: expose off, RLS on.
- Hosting: GitHub Pages (static files).
- Poster/info lookup: outside movie database, provider not chosen yet (see ROADMAP).

## Commands
- Install: none (no dependencies yet)
- Run locally: `python -m http.server 8000` from the repo root, then open http://localhost:8000
- Test: `node --test tests/*.test.mjs`, plus `node --experimental-strip-types --no-warnings tests/plex-webhook.check.mjs` `.../tests/send-push.check.mjs` `.../tests/seerr.check.mjs` and `.../tests/ratings.check.mjs` and `.../tests/tmdb-search.check.mjs` (Node 22). All run in CI.
- Lint/format: none yet
- Build: none (static files)

## Areas
- survey: docs/areas/survey.md (the 19 survey questions)

## Environments
- Local: static server as above, pointed at the Supabase project
- Preview: none (GitHub Pages has no previews; test locally)
- Production: GitHub Pages site for this repo. Every merge to `main` publishes it (DEC-003). Planned custom domain: hobsonmovieclub.com

## Standing preferences specific to this project
- Family-only. Keep it simple and friendly; no payments, no public sign-up.
- Supabase keys in the browser must be the public "anon" key only, with row-level security on every table. Never the service key.
- Survey questions are in docs/areas/survey.md. Movies must be available on Plex (no Plex integration planned).