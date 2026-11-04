# Area: notifications (push to phones and computers)

**Status:** test setup live (DEC-010); real-device delivery still to be confirmed by the owner. Members can turn notifications on; the owner can send marked-as-test messages from the admin page. The automatic ones (finished watching, reminders, picks) are not built yet: they need the club's round/pick structure.

## Files
- `manifest.webmanifest`, `sw.js`: make the site an installable app and show push messages. `sw.js` caches nothing on purpose.
- `js/push.js`: what this device can do (`pushSupport`), turning notifications on/off, saving the device. `VAPID_PUBLIC_KEY` lives here (public, not secret); while it is empty the member card stays hidden.
- `js/notifications.js`: the "Notifications" card members see on the survey page.
- `js/admin-notify.js`: the admin **Notifications** tab (sample messages for each kind, send to one person or everyone with notifications on, recent log).
- `supabase/functions/send-push/`: `handler.ts` (all the logic, no Deno imports) and `index.ts` (wires in the `web-push` library). Admins only. Every message is prefixed "Test:".
- `supabase/migrations/20261104000500_push_notifications.sql`: `push_subscriptions` (one row per device; the encryption keys cannot be read back by the browser) and `notification_log` (what was sent; also the future in-app inbox).
- `scripts/make-vapid-keys.mjs`: makes the key pair.
- Checks: `node --test tests/*.test.mjs` and `node --experimental-strip-types --no-warnings tests/send-push.check.mjs`.

## Setup (owner, once; the private key never goes in chat, a file, or the repo)
1. `node scripts/make-vapid-keys.mjs` prints a PUBLIC and a PRIVATE key. Keep the pair forever: if it changes, every device has to turn notifications on again.
2. Supabase > Edge Functions > Secrets: add `VAPID_PRIVATE_KEY` (private key), `VAPID_PUBLIC_KEY` (public key), and `VAPID_SUBJECT` (`mailto:` plus an email address you control).
3. Put the PUBLIC key into `VAPID_PUBLIC_KEY` in `js/push.js` (Claude can do this) so the card appears.
4. On a phone or computer with Chrome: open the site, sign in, tap **Turn on notifications**, allow. Then in Admin > Notifications use **Send test**.
- Secret names used by this project's functions (values only in Supabase): `TMDB_READ_TOKEN`, `PLEX_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Device notes
- **Chrome** (Android, Windows, Mac): works. **Brave on Android** blocks push unless "Use Google Services for push messaging" is on in Brave's privacy settings. **iPhone/iPad**: only works after "Add to Home Screen" (iOS 16.4+), and the card says so.
- Someone who signs in on a browser already used by another member keeps the first member's registration (rare; fix by turning notifications off and on).

## How the real notifications will be triggered (design, not built)
- **Event-driven:** something happens and we send right away: the Plex webhook records a finished movie (review prompt), a pick is made, everyone has reviewed (reveal).
- **Timer-driven (reminders such as "2 days left"):** a Supabase scheduled job (pg_cron) runs about hourly, asks the database who still hasn't watched or reviewed the current round while the deadline is within 48h/24h, sends, and records it in `notification_log`. Only between set hours in the family's time zone.
- **Once only:** `notification_log` has a unique rule on (member, kind, dedupe key, for example a round id). A rewatch, a repeated Plex event or a job that runs twice cannot send the same thing twice.
- **"Watched" means** (to decide): a Plex finished event, a review, or an "I watched it" button. A review always counts, since watching on Plex is not required.
- Delivery is push only (no email except login and invites), plus an in-app inbox as the safety net for people who never install.

## Gotchas
- This project does not auto-expose tables: every table a function writes needs an explicit grant to `service_role` (see docs/areas/plex.md). The migration includes them.
- The admin page asks the function, which re-checks that the caller is an admin; the page only decides what to show.
