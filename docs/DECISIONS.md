# Decision log
<!-- Append-only. Not auto-loaded. One entry per meaningful choice. -->

## DEC-001: Plain HTML/JS + Supabase + GitHub Pages
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** A small family-only movie club site. Needs saved data and per-person login, but nothing complex.
- **Decision:** Plain HTML/CSS/JS with no build step, Supabase for database and email login, GitHub Pages for hosting. Family-only, not for sale or handoff (handoff paperwork skipped). No payments.
- **Alternatives considered:** Vite + React (more structure, but adds a build step and dependencies); Netlify hosting (rejected: free credits matter and Pages is enough for static files).
- **Consequences:** No build tools to maintain. Everything runs in the browser, so security depends on Supabase row-level security, not hidden code. The Netlify rule file (80-deploy-netlify-supabase.md) and netlify.toml.example do not apply; they can be removed with approval. GitHub Pages has no deploy previews, so test locally.
## DEC-002: Remove Netlify files, add GitHub Pages deploy rule
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** DEC-001 chose GitHub Pages, so the Netlify rule file and config example were dead weight.
- **Decision:** Deleted `80-deploy-netlify-supabase.md` and `netlify.toml.example`; added a short `80-deploy-github-pages.md` (do not auto-publish on merge). Also removed the Netlify lines from `.claude/settings.json`.
- **Visibility:** GitHub Pages on the free plan needs a public repo, so the owner made this repo public on 2026-11-01. Nothing secret is stored in it (the Supabase anon key is public by design). Pages sites are public on the internet, so survey/review data stays in Supabase behind login.

## DEC-003: Publish to GitHub Pages on every merge to main
- **Date:** 2026-11-02
- **Status:** accepted
- **Context:** All work already goes through branches, PRs and a CI check. Pages is free and the site is family-only with no payments. A separate manual publish step added effort for little safety.
- **Decision:** `.github/workflows/pages.yml` deploys the repo to GitHub Pages on every push to `main`. This replaces the DEC-002 rule "do not auto-publish on merge", and the old rule that nothing is released until the owner asks (tags/releases are now optional milestone markers).
- **Alternatives considered:** Manual "Publish" button (workflow_dispatch): safer but extra clicks; separate publish branch: more moving parts.
- **Consequences:** A merge is live within a couple of minutes, so only ready work is merged and login/saving is tested locally first. No previews. Roll back with a revert PR. Also decided: the survey switched to the shorter v2 questions before the first publish.

## DEC-004: TMDB lookups go through a Supabase Edge Function
- **Date:** 2026-11-04
- **Status:** accepted. Deployed 2026-11-04 (function `tmdb`, version 1, verify_jwt on) with the owner's approval. Redeploy after any change to supabase/functions/tmdb/index.ts (ask first).
- **Context:** Movie search, posters and details come from TMDB. Its token must not be in browser code on a public site.
- **Decision:** One Edge Function, `supabase/functions/tmdb`, holds the token as the Supabase secret `TMDB_READ_TOKEN`. The browser calls it with the person's login token; it only serves signed-in users, only allows our site origins, and returns a trimmed result (search list, or one movie with cast, trailer, US streaming, rating). The site shows the TMDB attribution notice.
- **Alternatives considered:** Token in the browser (rejected: public); a separate server (rejected: a third service).
- **Consequences:** Needs a deploy of the function and the secret. Free tier limits apply. Non-commercial use only under TMDB terms (fine for a family club; revisit if it is ever sold). TMDB does not know about Plex, so "available on Plex" is a separate question.
