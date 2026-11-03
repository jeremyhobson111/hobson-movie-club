# Current state
**Last updated:** 2026-11-02
**Current focus:** Turn on GitHub Pages, then connect hobsonmovieclub.com and invite the family.

## Done this session
- Survey page built, restyled (navy/gold like spotle.movie), renamed Hobson Movie Club, and switched to the shorter v2 survey (13 questions). Real login works locally.
- DEC-003: every merge to `main` now publishes to GitHub Pages. Rules (CLAUDE.md, 10-autonomy, 50-git, 80-deploy) updated; workflow `.github/workflows/pages.yml` added.
- Tests: `node --test tests/logic.test.mjs` (10 passing).
- Logo banner and icons added (img/). Icons 192/512 are ready for the future phone-app install. Original artwork is untracked in .stuff/ (not committed).

## In progress
- Branch: `main` (after this PR merges). Pages is NOT on yet, so the first publish run will fail until the owner does step 1 below.

## Next steps
1. Owner: GitHub repo Settings > Pages > Source = "GitHub Actions", then re-run the "Publish site" workflow (Actions tab). Site appears at https://jeremyhobson111.github.io/hobson-movie-club/
2. Owner: in Supabase Auth > URL Configuration add that address as a redirect URL (keep localhost:8000 for testing). Test login on the live site.
3. Custom domain hobsonmovieclub.com: Pages setting + DNS records at the registrar; then add it to Supabase URL Configuration and make it the Site URL.
4. Custom SMTP (needed to email non-team family members and to edit email templates), then invite the family.
5. TMDB key via Supabase secret + edge function (ask before deploying).

## Open questions for the user
- Where was the domain bought (for exact DNS steps)?
- Plex availability of Best Picture nominees: decide before the picking feature.

## Deferred housekeeping
- Add the survey tests to CI (CI change).
- Dashboard + PWA + points game: add to ROADMAP when ready to plan.
