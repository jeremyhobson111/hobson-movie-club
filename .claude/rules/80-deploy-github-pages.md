# Deploys: GitHub Pages and Supabase

GitHub Pages is not turned on yet. Do not enable it or change Pages settings without the user asking.

Once it is on, a push to the publishing branch makes the site live. Merging a PR to `main` is allowed, but it must never publish by accident:
- Publish from a separate branch or a manual workflow (`workflow_dispatch`), not automatically from `main`. Propose this setup before the first merge after Pages is enabled.
- Only publish when the user asks ("release", "deploy").
- GitHub Pages has no previews. Test locally first.

Supabase: remote migrations and anything touching production data need the user's OK. The browser only ever gets the public anon key, with row-level security on every table.
