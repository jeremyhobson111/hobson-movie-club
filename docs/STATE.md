# Current state
**Last updated:** 2026-11-05
**Current focus:** Decide how a club "round" works (pick, deadline, reviews, points) so notifications and reminders have something to attach to.

## Done (recent sessions)
- Live at https://hobsonmovieclub.com: GitHub Pages publishes on every merge to `main` (DEC-003). Logo, icons, branded login/invite emails (Resend), invite-only login.
- Survey v2 (13 questions) is live; owner-only admin page (`admin.html`) shows results by question and by person (DEC-006).
- Admin Members & Plex: link members to Plex accounts by typed Plex ID, name as fallback; couples can share one account (DEC-007, DEC-009).
- Plex webhook receiver logs movies started/finished; Plex activity tab shows who (DEC-008). Tested with real events (owner + a managed user). No Plex token is stored.
- Test notifications work on a real Chrome device: installable-app files, "Turn on notifications" card, admin Notifications tab, `send-push` function (DEC-010).
- TMDB lookup works through a Supabase function (DEC-004); lab page (`lab.html`) has search, movie card, and a browser-only review preview.
- CI now runs the project tests; daily keep-alive stops Supabase pausing (DEC-005). Webhook secret rotated. `.env.example` lists secret names.

- New look (midnight blue and gold, design F-2b) is live: curtain header, flat sections, ringless app icons (DEC-012).
- Seerr (the renamed Overseerr) status check is live: `seerr` function deployed, secrets `SEERR_URL` and `SEERR_API_KEY` set, "On our Plex?" line on the lab movie card, tried against the real Seerr (DEC-011).

## In progress
- Branch: `main`, clean. Nothing half-done. Only 2 members invited so far (owner + 1); both answered the survey.

## Next steps
1. Draft the round/pick design (a short plan in `docs/areas/`) using the survey answers; owner reacts before anything is built.
2. Owner: invite the family; link each member's Plex ID(s) under Members & Plex (owner's own ID is on the Plex activity tab).
3. Build rounds, picks and reviews tables, then automatic notifications: finished-watching review prompt (Plex webhook), reminders 2 days / 1 day before the end (pg_cron), pick turn, reviews revealed. Once-only via `notification_log` (see docs/areas/notifications.md).
4. On pick: store the Seerr status/Plex link with the pick (the check itself works, see DEC-011); optionally let the owner request a missing movie.
5. Later: in-app inbox as a fallback for people who don't install; points game if the survey wants it.

## Open questions for the user
- Best Picture nominees are not always on Plex: how should a pick handle that?
- What counts as "watched" for reminders: Plex finished, a review, an "I watched it" button (a review should always count).
- Points game and prize: keep, drop, or decide after the family answers the survey?

## Deferred housekeeping
- Add dashboard, PWA install and points game to `docs/ROADMAP.md` when ready to plan.
- Owner's Chrome is the supported browser; Brave on Android needs push enabled in its settings, iPhone needs Add to Home Screen.
