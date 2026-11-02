# Deploys: Netlify and Supabase (apply only if the project uses them)

## Why this matters
On Netlify's credit-based free plan (300 credits/month), a successful **production** deploy costs 15 credits, while deploy previews and branch deploys are documented as free. So: test locally and in free previews, and make production deploys rare and deliberate. (Check the site's usage page in the Netlify dashboard to confirm current numbers.)

## The key rule: merging must not publish
If a site is connected to GitHub, a merge to the production branch can trigger a production deploy automatically. Claude may merge PRs, so before the first merge in a Netlify-connected project:
1. Ask the user how the site's production deploys are configured (auto-publish on, locked, or a separate production branch).
2. Until the user confirms a safe setup, **add `[skip netlify]` to the squash-merge commit subject** (Netlify skips builds for commits containing `[skip netlify]` or `[skip ci]`). Example: `gh pr merge <n> --squash --subject "feat: counter page [skip netlify]"`.
3. Record how releases are published in `docs/HANDOFF.md`.

Safer long-term setups to propose to the user (they set these in the Netlify dashboard; do not change hosting settings yourself):
- **Lock auto-publishing** on the site's Deploys list, so builds finish but nothing goes live until the user publishes.
- **Separate production branch** (for example `production`): `main` then gets free branch deploys as a staging URL, and a release means merging `main` into `production`. Check Netlify's current docs for the exact settings before recommending steps.

## Testing order (cheapest first)
1. **Local:** `netlify dev` for sites with Netlify Functions; the normal dev server otherwise. `netlify build` builds locally using Netlify's build logic without a deploy.
2. **Deploy preview / branch deploy:** pushing a feature branch or opening a PR produces a preview URL (documented as free). Use it for sharing and device checks.
3. **Production:** only when the user asks for a release or a deploy.

## Rules for Claude
- Merging a PR is allowed under `10-autonomy.md`; production deploys are not. Never run `netlify deploy --prod`, trigger a production build, or change auto-publishing unless the user's latest message asks for that release or deploy. The command will also prompt for approval; do not try to work around the prompt.
- Batch changes. Do not push many tiny commits to a branch with an active preview if one push would do.
- To avoid a build on a commit, put `[skip netlify]` or `[skip ci]` in the commit message. For a PR that should not get a preview, put it in the PR title.
- Before a release, remind the user to check the credit balance and how production publishing is configured.

## Recommended Netlify site settings (user does these once)
- Production branch: `main` (or `production`; see above).
- Keep Netlify environment variables in the Netlify UI, not in `netlify.toml`.

## Supabase
- Develop against a **local** Supabase stack or a separate dev project/branch, never directly against production data.
- Schema changes go through migration files committed to the repo (`supabase/migrations/`). Never edit the production schema by hand.
- Applying a migration to a remote project is an "ask first" action. Describe the migration and its effect, then wait.
- After a migration, run the Supabase security/performance advisors and report anything new.
- Regenerate TypeScript types (if applicable) when the schema changes, and commit them.
