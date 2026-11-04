# Current state
**Last updated:** 2026-11-02
**Current focus:** Try out TMDB lookup and movie-card/review designs on the lab page; invite the family.

## Done this session
- Site is live at https://hobsonmovieclub.com (Pages on every merge, DEC-003); logo banner, icons, branded email templates (supabase/email-templates/), invites working via Resend. Survey v2 (13 questions) is live.
- Lab test page `lab.html` (search, movie card, review section; `?mock=1` shows it without a key). TMDB function deployed to Supabase (DEC-004); login protection checked, real searches still to be tested by the owner on the live lab page.

## In progress
- Branch: `main`. Owner to sign in on hobsonmovieclub.com, open /lab.html and try a real search (needs secret `TMDB_READ_TOKEN` set in Supabase).

## Decided (ideas, nothing built yet)
- Admin dashboard (owner only, enforced in the database, not just hidden): survey results, then link Plex usernames (several per member, e.g. a spouse) to members.
- Plex "finished watching" alert via Plex webhook (owner has Plex Pass), once per person per movie; push notifications only (no email besides login/invites) plus an in-app inbox. Watching on Plex is never required to rate/review; add an "I watched it" button.
- On pick: check Overseerr (reachable from the internet) for the movie, store its Plex link and status in the database, optionally request it if missing.

## Admin page
- `admin.html` is live once merged: survey results by question and by person. Migration applied, owner is the first admin (DEC-006).

## Plex alerts (phase 1, deployed, waiting on the owner)
- Live: migration `20261104000200`, function `plex-webhook`, admin "Plex activity" tab, Plex linking by name (works for managed users). Owner to do: set secret `PLEX_WEBHOOK_SECRET`, add the webhook in Plex (steps in docs/areas/plex.md), watch a few seconds of a movie on a normal and a managed account, and check the Plex activity tab.

## Members & Plex (done)
- Admin "Members & Plex" section: link Plex usernames to members (several per member; one shared account can go to several members, e.g. a couple). Migration applied (DEC-007). Next: Plex webhook receiver that alerts every member linked to the account.

## Next steps
1. Confirm real TMDB searches work on the live lab page; then decide the movie card and review design.
2. Invite the family to the survey; read their answers in the Supabase dashboard.
3. Decide the club structure from the survey, then design reviews table, picking flow, points game.
4. PWA install + notifications (later).

## Open questions for the user
- Plex availability of Best Picture nominees: decide before the picking feature.

## Deferred housekeeping
- Add the survey tests to CI (CI change).
- Dashboard + PWA + points game: add to ROADMAP when ready to plan.
