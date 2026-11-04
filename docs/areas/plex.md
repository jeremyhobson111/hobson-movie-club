# Area: Plex (finished-watching alerts)

**Status:** phase 1 = log what Plex sends (DEC-008). No notifications yet.

## Files
- `supabase/functions/plex-webhook/index.ts`: catches Plex webhooks. Public (no login token, Plex can't send one) but requires `?key=<PLEX_WEBHOOK_SECRET>`. Logs movie `media.play` and `media.scrobble` (watched past ~90%) into `plex_events`. Check it with `node --experimental-strip-types --no-warnings tests/plex-webhook.check.mjs`.
- `supabase/migrations/20261104000200_plex_events.sql`: `plex_events` table (admins read, only the function writes), renames `plex_accounts.plex_username` to `plex_name`, adds `plex_user_id`.
- Admin page: **Members & Plex** (link a Plex name to a member) and **Plex activity** (recent events and which members they match).

## How members are matched
By the Plex **name** in the event (`Account.title`), ignoring case: a username for normal accounts, the display name for managed home users. A name can be linked to several members (couples on one account); an alert for it goes to all of them. The plex.tv user id is stored when known but not used for matching yet: in the webhook the owner is always id 1, so ids from plex.tv probably differ.

## Setup (owner does this once; never put the secret in the repo)
1. Make a random secret, e.g. in PowerShell: `-join ((48..57)+(97..122) | Get-Random -Count 32 | % {[char]$_})`
2. Supabase dashboard > Edge Functions > Secrets: add `PLEX_WEBHOOK_SECRET` with that value.
3. Plex (needs Plex Pass on the server owner): Settings > Webhooks > Add Webhook: `https://bfpjetztwfcwzcjfxakx.supabase.co/functions/v1/plex-webhook?key=<the secret>`
4. Watch a few seconds of any movie on Plex; it should appear on the admin page under Plex activity.

## Next
- Pull the full Plex user list from plex.tv (owner token as secret `PLEX_TOKEN`) so members can be linked by picking from it; confirm how its ids relate to the webhook's.
- Notification once per member per movie (a dedupe table), then reminders; delivery is push (PWA), not email.
