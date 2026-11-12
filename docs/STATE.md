# Current state
**Last updated:** 2026-11-12
**Current focus:** Decide how a club "round" works (pick, deadline, reviews, points) so notifications and reminders have something to attach to.

## Done (recent sessions)
- Live at https://hobsonmovieclub.com: GitHub Pages publishes on every merge to `main` (DEC-003). Invite-only login, branded emails (Resend).
- New look (midnight blue and gold, F-2b) is live: curtain header, flat sections, ringless app icons (DEC-012). Invite/login emails restyled and pasted into Supabase.
- Movie card shows TMDB, IMDb and both Rotten Tomatoes scores (MDBList, DEC-013). Search puts well-known films first. Seerr "On our Plex?" check (DEC-011).
- Survey v2 and the owner-only admin page (results, Members & Plex, Plex activity, Notifications). Plex webhook and test push notifications work (DEC-006 to DEC-010).
- Sign-in bug fixed (2026-11-06): six invited people were stuck because their accounts were never confirmed (Supabase then says "Signups not allowed for this instance"). Confirmed by hand in the database.
- Admin "Invite a member" box (Members & Plex tab) and `invite` function (DEC-014): sends the invite and confirms the account at once. Function deployed (v2), merged in #41.
- CI runs every project test, including the invite checks (#42).

## In progress
- Branch: `main`, clean. Nothing half-done.
- The invite box has NOT been tried against the real Supabase yet (only tested with a fake one).

## Next steps
1. Owner: try one invite to an address they control from Admin > Members & Plex; report any error.
2. Owner: paste the updated `supabase/email-templates/invite.html` into Supabase (Authentication > Emails > Templates > Invite user). Optional but helpful.
3. Draft the round/pick design (a short plan in `docs/areas/`) using the survey answers; owner reacts before anything is built.
4. Build rounds, picks and reviews, then automatic notifications (see docs/areas/notifications.md). Store the Seerr status with each pick.
5. Later: in-app inbox fallback; points game if the survey wants it. Link each member's Plex ID(s) under Members & Plex.

## Open questions for the user
- Best Picture nominees are not always on Plex: how should a pick handle that?
- What counts as "watched" for reminders: Plex finished, a review, an "I watched it" button?
- Points game and prize: keep, drop, or decide after the family answers the survey?

## Deferred housekeeping
- Don't send invites from the Supabase dashboard (they leave accounts unconfirmed); use the admin box.
- Add dashboard, PWA install and points game to `docs/ROADMAP.md` when ready to plan.
- Owner's Chrome is the supported browser; Brave on Android needs push enabled in its settings, iPhone needs Add to Home Screen.
