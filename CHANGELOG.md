# Changelog

All notable changes. Format based on Keep a Changelog; versions follow semver.

## [Unreleased]
- Survey page: invite-only email login (link or 6-digit code) and the 19-question family survey, saved per person.
- Site restyled to a navy and gold theme inspired by spotle.movie.
- Site renamed to Hobson Movie Club.
- New logo banner in the header, favicon and app icons; header font no longer relies on fonts missing from phones.
- Branded login and invite email templates saved in supabase/email-templates/.
- Fixed survey question titles sitting half outside their cards.
- Survey question 7: removed the "Couldn't easily find or watch it" option.
- Login page no longer says the code is 6 digits (Supabase sends 8).
- Fixed a white strip at the bottom on phones while the address bar hides/shows (background is now a fixed layer sized to the tallest screen).
- Lab test page (lab.html): TMDB movie search, movie card and a review section (reviews saved in the browser only). TMDB lookup function written (not deployed yet).
- Lab page: removed a stray "null" shown above the search box.
- Favicon is now a true circle with a transparent outside; app icons are the circle centered on a dark square.
- Daily keep-alive job so the Supabase free plan does not pause the project.
- Admin page (admin.html, owner only): survey results by question and by person. Needs the admin database change applied (DEC-006).
- Admin "Members & Plex" section: link Plex usernames (several per member) to members; rename members.
- Plex alerts phase 1 is live: webhook receiver that logs movies started/finished, and a "Plex activity" admin tab. Plex links can use a name, or (better) a typed-in Plex ID, so managed users work; no Plex token is stored.
- Survey replaced with the shorter v2 (13 questions about the old club, a points game and a phone app).
- Site now publishes to GitHub Pages on every merge to `main` (DEC-003).
