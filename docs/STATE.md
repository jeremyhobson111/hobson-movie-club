# Current state
**Last updated:** 2026-11-01
**Current focus:** Build the survey page (v1 step 1).

## Done this session
- Project created, stack chosen (DEC-001): plain HTML/JS, Supabase, GitHub Pages.
- Repo made public so Pages works on the free plan. Netlify files removed.
- Survey spec saved in docs/areas/survey.md (19 questions).
- Supabase project created and `survey_responses` table applied (RLS on, security advisor clean).
- Kickoff and schema PRs merged to main. Nothing published; Pages is still off.

## In progress
- Branch: `main` (clean)
- Half-done: nothing.
- To resume: start the survey page (login + 19-question form saving to `survey_responses`).

## Next steps
1. Owner: turn off public sign-ups in Supabase Auth, invite family by email.
2. Build login + survey page, test locally.
3. Poster lookup via TMDB (key goes in a Supabase secret, never in site code).
4. Ratings and reviews.

## Open questions for the user
- When to turn on GitHub Pages (needs a safe publish setup first).

## Deferred housekeeping
- Add a CHANGELOG line when the first feature ships.
