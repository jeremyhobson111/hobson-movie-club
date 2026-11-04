# Current state
**Last updated:** 2026-11-02
**Current focus:** Try out TMDB lookup and movie-card/review designs on the lab page; invite the family.

## Done this session
- Site is live at https://hobsonmovieclub.com (Pages on every merge, DEC-003); logo banner, icons, branded email templates (supabase/email-templates/), invites working via Resend. Survey v2 (13 questions) is live.
- Lab test page `lab.html` (search, movie card, review section; `?mock=1` shows it without a key). TMDB function written in `supabase/functions/tmdb` (DEC-004), NOT deployed yet.

## In progress
- Branch: `main`. Waiting on the owner to (1) create a TMDB key, (2) store it as Supabase secret `TMDB_READ_TOKEN`, (3) approve deploying the function. Then test lab.html on the live site.

## Next steps
1. Deploy the TMDB function and test the lab page with the real key.
2. Invite the family to the survey; read their answers in the Supabase dashboard.
3. Decide the club structure from the survey, then design reviews table, picking flow, points game.
4. PWA install + notifications (later).

## Open questions for the user
- Plex availability of Best Picture nominees: decide before the picking feature.

## Deferred housekeeping
- Add the survey tests to CI (CI change).
- Dashboard + PWA + points game: add to ROADMAP when ready to plan.
