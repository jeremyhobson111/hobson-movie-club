# Current state
**Last updated:** 2026-11-01
**Current focus:** Survey page is built; waiting on Supabase login setup before the family can use it.

## Done this session
- Built the survey page: email login (link or 6-digit code, invite-only), 19 questions, save/edit per person (js/, css/, index.html).
- Survey rules have tests (`node --test tests/logic.test.mjs`, 9 passing). Checked the page locally with a mocked database; not yet tried against the real Supabase login.
- No new dependencies (plain fetch to Supabase). Nothing published; Pages is still off.

## In progress
- Branch: `feat/survey-page` (PR open)
- Half-done: nothing.

## Next steps
1. Owner, in the Supabase dashboard (Authentication): turn off public sign-ups; under URL Configuration add `http://localhost:8000` as a redirect URL (and the Pages URL later); in Email Templates > Magic Link add `{{ .Token }}` so the email shows the 6-digit code. Then invite yourself and try a real login locally.
2. Invite family by email.
3. Poster lookup via TMDB (key goes in a Supabase secret, never in site code).
4. Ratings and reviews.

## Open questions for the user
- When to turn on GitHub Pages (needs a safe publish setup first).

## Deferred housekeeping
- Add the survey tests to CI (CI change, needs approval).
- Record "plain fetch instead of supabase-js" as a DEC entry if you want it logged.
