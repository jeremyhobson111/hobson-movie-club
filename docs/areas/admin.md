# Area: admin (owner-only page)

**Status:** v1 = survey results. Plex account linking comes next (see STATE.md).

## Files
- `admin.html`, `js/admin.js`, `css/admin.css`: the page (unlisted, noindex, no link from other pages). `admin.html?mock=1` shows it with made-up data (`js/admin-mock.js`).
- `js/results.js` (+ `tests/results.test.mjs`): turns survey rows into per-question counts, quotes and favorite-movie tallies. Only rows for the current `SURVEY_VERSION` are counted.
- `supabase/migrations/20261104000000_admin.sql`: `admins` table + policy letting admins read all survey rows (DEC-006).

## How access works
- The page asks the database for the signed-in person's row in `admins`. No row = "Not authorized" and it never requests anyone's answers.
- That is only the display. The protection is row-level security: even by calling the API directly, a non-admin gets only their own survey row.
- To add an admin: in the Supabase SQL editor, `insert into public.admins (user_id) select id from auth.users where email = '<their email>';` (never from the website; do not commit emails).

## Gotchas
- Native `replaceChildren` turns `null` into the text "null": only pass nodes (use the `h()` helper in `js/dom.js`).
- Changing survey questions: bump `SURVEY_VERSION` in `js/logic.js`; older answers are then hidden here.
