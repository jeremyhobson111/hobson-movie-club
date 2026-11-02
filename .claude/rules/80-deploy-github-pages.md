# Deploys: GitHub Pages and Supabase

Decision: DEC-003. Every merge to `main` publishes the site to GitHub Pages (workflow `.github/workflows/pages.yml`). It is free and uses no hosting credits.

- Only merge work that is ready for the family to see. Unfinished work stays on its branch.
- GitHub Pages has no previews. Test locally first, and test login and saving locally before merging anything that touches them.
- To undo a bad publish, `git revert` the change through a PR; the site republishes with the fix.
- Do not change Pages settings, the custom domain, or DNS without the user asking.
- A custom domain (hobsonmovieclub.com) and the Pages address must both be allowed in Supabase Auth > URL Configuration, or login emails will not return to the site.

Supabase: remote migrations and anything touching production data need the user's OK. The browser only ever gets the public publishable/anon key, with row-level security on every table.
