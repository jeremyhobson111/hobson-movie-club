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

## Notifications test setup (live and verified)
- Live: installable-app files, member "Turn on notifications" card, admin Notifications tab, `send-push` function, migration `20261104000500`, VAPID public key in `js/push.js`. Verified 2026-11-04: the owner turned notifications on in Chrome and a test arrived (1 device registered, test sends logged). Next: the round/pick structure so reminders and prompts have something to attach to; then automatic sends (Plex finished-watching, pg_cron reminders). See docs/areas/notifications.md.

## Plex alerts (phase 1 and ID linking live)
- Live and tested with real events (owner and a managed user): webhook receiver, `plex_events`, Plex activity tab. Link members by typed Plex ID (DEC-009), name as fallback; migration `20261104000400` applied. Owner to link their own ID (21693055) and managed accounts under Members & Plex. Next: the actual "finished watching" notification (once per person per movie).
- Owner to do sometime: rotate `PLEX_WEBHOOK_SECRET` (it appears in Supabase logs) and update the webhook address in Plex.

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
