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

## DEC-005: Daily keep-alive so Supabase does not pause
- **Date:** 2026-11-04
- **Status:** accepted (owner approved)
- **Context:** The Supabase free plan pauses a project after about a week with no activity. A biweekly club could go quiet that long.
- **Decision:** `.github/workflows/keep-supabase-awake.yml` runs daily and makes one REST request with the public key. A 401 "permission denied" from Postgres (or a 200) counts as healthy; anything else fails the job, so GitHub emails the owner. Chosen over relying on the future reminder job, since this is simple and checkable.
- **Alternatives considered:** Supabase Pro plan (paid, no pausing); a pg_cron job (unclear whether internal calls count as activity).
- **Consequences:** GitHub disables scheduled workflows after 60 days with no repo activity (it emails a warning first); any merge re-arms it. If the project is ever paused anyway, restore it from the Supabase dashboard.

## DEC-006: Admin access via an `admins` table
- **Date:** 2026-11-04
- **Status:** accepted. Migration applied 2026-11-04 with the owner's approval; the owner was added as the first admin. Checked in the database: an admin sees all survey rows, a regular member only their own, a stranger none.
- **Context:** The owner needs a page that is only theirs: survey results now, Plex account linking next.
- **Decision:** A table `admins (user_id)` lists admins. Row-level security lets a signed-in person see only their own row there (how the page asks "am I an admin?"), and an extra policy lets admins read all `survey_responses`. No API write access to `admins`: the owner adds themselves once in the Supabase SQL editor. The page `admin.html` only chooses what to show; the database enforces access.
- **Alternatives considered:** Hiding the page or checking an email in JavaScript (rejected: not real protection); a service-role Edge Function (more moving parts than a policy).
- **Consequences:** Admins can read, not edit, other people's answers. Plex linking will add more admin-only tables the same way.

## DEC-007: Members table and linked Plex accounts
- **Date:** 2026-11-04
- **Status:** accepted. Migration applied 2026-11-04 with the owner's approval. Checked in the database: a new login gets a member row (trigger); an admin sees everyone and can link and rename; a member sees only their own row and no Plex links and cannot change anything; a stranger sees nothing; the same member plus the same username twice is refused; the same username on two members is allowed.
- **Context:** Plex "finished watching" alerts need to know which club member a Plex username belongs to, including alternate accounts such as a spouse's. The website cannot read the login list.
- **Decision:** `members` (one row per login, filled by a trigger on `auth.users`, backfilled for existing people) and `plex_accounts` (many-to-many: a member can have several Plex usernames, and one shared username, e.g. a couple's account, can be linked to several members; once per member, case-insensitive). An alert for a shared account goes to every member linked to it. Admins manage both from the admin page. A member can read only their own `members` row; `plex_accounts` is admin-only for now.
- **Alternatives considered:** Putting a Plex username column on the survey row (rejected: only one account per person, and not every member answers the survey); linking by Plex numeric account id (kept for later; the username is what the owner can type today, and the webhook field to match will be confirmed when the webhook is built).
- **Consequences:** The `auth.users` trigger is the only place `members` rows are created. Deleting a login deletes the member and their links.

## DEC-008: Plex webhook receiver, linked by Plex name, ids confirmed later
- **Date:** 2026-11-04
- **Status:** accepted. Migration applied and `plex-webhook` deployed (verify_jwt off, version 1) on 2026-11-04 with the owner's approval. Checked: the deployed function refuses requests until the secret is set; admins read `plex_events`, members and strangers see none, and nobody can write it from the website. Still to do: owner sets `PLEX_WEBHOOK_SECRET` and adds the webhook in Plex, then a real event confirms the payload.
- **Context:** The owner has Plex Pass and wants a notification when a member finishes the week's movie on Plex. Some accounts are managed home users with a display name but no username, and couples can share one account. Plex's webhook `Account` has an `id` (the owner is always 1), a `title` and an avatar URL; webhooks fire for every user's plays and the receiver must filter (Plex support article).
- **Decision:** (1) Function `plex-webhook` (public, secret in the address, writes with the service role) logs movie `media.play` / `media.scrobble` events to `plex_events`; no notifications yet. (2) Members are linked to Plex accounts by **name** (`plex_accounts.plex_name`: a username, or a managed user's display name), case-insensitive; `plex_user_id` is stored for a later step. (3) The admin "Plex activity" tab shows recent events and which members each matches, so the owner can see exactly what Plex sends. (4) A full user list pulled from plex.tv with the owner's token (unofficial endpoints) is the next step, built only after real events show how its ids relate to the webhook's.
- **Alternatives considered:** Match by webhook id now (rejected: the owner is id 1 in the webhook but a large id on plex.tv, so ids from the two places probably differ); a "seen accounts" picker (owner declined).
- **Consequences:** Two accounts with the same display name could be confused; the activity tab makes that visible. Needs two secrets (`PLEX_WEBHOOK_SECRET`, later `PLEX_TOKEN`).

## DEC-009: Link Plex accounts by a typed-in Plex ID; no Plex token stored
- **Date:** 2026-11-04
- **Status:** accepted. Migration `20261104000400` applied 2026-11-04 with the owner's OK; checked in the database: same member + same id refused, id 0 and negative refused, the same id on two members allowed, name-only links still work.
- **Context:** Real Plex alerts showed `Account.id` is a large plex.tv-style number for both the owner (21693055) and a managed user (21722565), not 1 as Plex's help page says, and `Account.title` is the display name. A user-list picker would need the owner's Plex token as a secret, which works like a password for the whole Plex account. The owner declined that risk and has another way to find Plex ids.
- **Decision:** No `PLEX_TOKEN`, no user-list picker. The owner types each member's Plex ID (and optionally a name and note) in the admin page. Alerts are matched by ID when the link has one, otherwise by name (case-insensitive). The activity tab shows each event's Plex ID so it can be copied. `plex_name` stays required (a blank name with an ID becomes "Plex ID <n>").
- **Alternatives considered:** plex.tv user-list picker (rejected: token risk); matching by name only (kept as fallback: names can repeat or change).
- **Consequences:** Members must be linked by hand, once. An account is the same account if the IDs match, or (when either has no ID) the names match. Supersedes the "user list" step in DEC-008.

## DEC-010: Push notifications via Web Push, the `web-push` library inside one Edge Function
- **Date:** 2026-11-04
- **Status:** accepted. Migration `20261104000500` applied and `send-push` deployed (verify_jwt on, `web-push@3.6.7`) on 2026-11-04 with the owner's approval. Checked in the database as admin, member, stranger and the service role: members see and manage only their own devices and cannot read the encryption keys (nor can admins), only the function's role writes the log, the once-only rule refuses a repeated reminder, anon has no access. Checked live: the function refuses no-login and the public key, and allows the site's origin.
- **Context:** Members should get reminders and prompts on their phones without email (owner's choice). The installed app (PWA) with Web Push does that, free, with no third service.
- **Decision:** Browser side: `manifest.webmanifest` + `sw.js` (no caching) + a "Turn on notifications" card. Server side: Edge Function `send-push` using the npm library `web-push@3.6.7` (new dependency, runs only on Supabase, owner approved) with VAPID keys kept as Supabase secrets. Devices live in `push_subscriptions` (column-level grants keep the encryption keys out of the browser); sends are recorded in `notification_log`, whose unique (member, kind, dedupe key) rule will make automatic reminders once-only. For now only admins can send, and every message is prefixed "Test:". Chrome is the supported browser (Brave on Android blocks push by default; iPhone needs Add to Home Screen).
- **Alternatives considered:** Writing Web Push encryption ourselves (rejected: easy to get subtly wrong); email (rejected by the owner); a hosted push service (a third service).
- **Consequences:** The key pair must never change. Dead devices are removed when the push service reports them gone. The timer-driven reminders (pg_cron) and event-driven sends come later and reuse this sending code.

## DEC-011: Seerr status check through one read-only Edge Function
- **Date:** 2026-11-04
- **Status:** accepted for the read-only check. Function `seerr` is written and tested locally; not deployed and secrets not set yet.
- **Context:** When a movie is picked, the club needs to know if it is already on Plex. The owner's Seerr is reachable from the internet and knows what is on Plex and what has been requested.
- **Decision:** New Edge Function `seerr` (verify_jwt on, signed-in members only) calls `GET /api/v1/movie/<tmdb id>` on the owner's Seerr and returns only `{ status, plexUrl }`. `SEERR_URL` and `SEERR_API_KEY` are Supabase secrets, never in the browser. It never requests anything. The movie card on the lab page shows the result.
- **Alternatives considered:** Calling Seerr from the browser (rejected: would expose the API key); asking TMDB (it does not know about Plex).
- **Consequences:** If the owner's server is off, the card says it couldn't check, and nothing else breaks. Requesting a movie (owner only) is a later, separate step.

## DEC-012: Site look is "midnight blue and gold" (design F-2b)
- **Date:** 2026-11-05
- **Status:** accepted
- **Context:** The owner compared eight looks (and colour variants) as mockups and chose F-2b: the velvet-curtain layout in midnight blue with gold trim.
- **Decision:** Colours live as variables at the top of `css/style.css`. Full-width striped curtain header with a round logo (`img/logo-round.png`, gold outline drawn in CSS), flat sections with thin lines instead of boxed cards, serif text, gold buttons/checkboxes, centred movie page. App icons and favicon are the logo art without the gold ring, filling the square so phones can crop them. Invite/sign-in email files restyled to match.
- **Alternatives considered:** Keeping the boxed-card look with new colours (rejected by the owner).
- **Consequences:** The wide `banner.jpg` is no longer used on the site (emails no longer use it either). Email changes only take effect when pasted into Supabase.

## DEC-013: IMDb and Rotten Tomatoes scores through MDBList (one read-only Edge Function)
- **Date:** 2026-11-05
- **Status:** accepted; function deployed 2026-11-05 and tried against real MDBList (it worked for a different movie; Parasite has no audience score in MDBList).
- **Context:** The owner wants IMDb, Rotten Tomatoes critic and Rotten Tomatoes audience scores on the movie card. TMDB has none of them. OMDb has IMDb and the critic score but no sign of the audience score.
- **Decision:** New Edge Function `ratings` (verify_jwt on, signed-in members only) calls MDBList by TMDB id and returns `{ imdb, rtCritic, rtAudience, sources }`. `MDBLIST_API_KEY` is a Supabase secret. The free plan allows about 1,000 lookups a day, so browsers may cache a result for a day.
- **Alternatives considered:** OMDb (no audience score found); scraping Rotten Tomatoes (rejected: against their terms, fragile).
- **Consequences:** A fourth outside service. If MDBList is down or over its limit, the card just says it couldn't get the scores. The exact field names (`imdb`, `tomatoes`, `tomatoesaudience`) come from MDBList docs found secondhand; `sources` in the response shows the real names if any are wrong.

## DEC-014: Admin invites create an already-confirmed account (Edge Function `invite`)
- **Date:** 2026-11-06
- **Status:** accepted. Function `invite` deployed (v2) and the admin box merged in #41. Not yet tried against the real Supabase from the admin page (only tested with a fake one); the owner is to try one invite to an address they control.
- **Context:** Six of fourteen invited people could not sign in. A dashboard invite leaves the account unconfirmed until the emailed link is clicked, and Supabase refuses the normal sign-in email for an unconfirmed account while public sign-ups are off ("Signups not allowed for this instance"). Links expire or get used up by mail apps. The six were fixed by hand in the database (2026-11-06).
- **Decision:** New Edge Function `invite` (verify_jwt on, admins only, checked as the caller). It sends the invite email, then marks the account confirmed with the service key (built-in secret, no new secrets). The admin page's Members & Plex tab has an "Invite a member" box. The invite email also says to just sign in at the site.
- **Alternatives considered:** Keep dashboard invites and confirm by hand (rejected: easy to forget, needs the database); turn on public sign-ups (rejected: breaks invite-only).
- **Consequences:** Anyone invited this way can sign in immediately. Invites sent from the Supabase dashboard still have the old problem, so use the admin box instead. Re-inviting an existing address returns "already a member".
