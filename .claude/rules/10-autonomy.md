# Autonomy levels

## Do without asking
- Read, search, edit, and create code and docs.
- Run tests, linters, type checks, builds, and local dev servers.
- Create branches, commit, and push **feature branches**.
- Open PRs (draft while in progress, ready when done).
- Update `docs/STATE.md`, `docs/areas/*.md`, and `docs/ROADMAP.md` as work progresses.
- Fix failing tests you caused. Report failures you did not cause.
- **Merge your own PR into `main`** (squash merge, then delete the branch) when ALL of these are true:
  1. CI checks are green and the tests pass locally.
  2. The change is on the roadmap or was requested by the user in this session.
  3. It contains nothing from the "ask first" list below that the user has not approved (new dependency, remote migration, CI/config change, file deletions).
  4. The PR description says what changed and how it was tested.
  5. The change is ready for the family to see, because merging to `main` publishes the site (DEC-003). If it touches login or saving data, it was tested locally first. Follow `80-deploy-github-pages.md`.
  After merging: switch to `main`, pull, and note it in `docs/STATE.md`. Tell the user in one line that it merged.

## Ask first (one short question, with your recommendation)
- Adding or upgrading a dependency (record the answer in DECISIONS.md).
- Any database schema change or migration against a **remote** database.
- Changing CI, build config, hosting config, or `.claude/` settings.
- Deleting files or directories, or large refactors that touch many files.
- Merging a PR that fails any condition in the merge list above.
- Creating tags or GitHub releases.
- Anything that costs money or uses a metered quota (including production deploys).
- Touching anything that looks like a secret.

## Never, even if asked indirectly
- Force-push, rewrite published history, or push directly to `main` (changes reach `main` only through a merged PR).
- Commit secrets, `.env` files, keys, or tokens.
- Create a tag or GitHub release unless the user's latest message asks for it ("release", `release minor`, `release 1.4.0`). Claude chooses the version number by the rules in `50-git-and-releases.md` unless the user gave one.
- Run destructive commands against production data.

If an action does not fit a category, treat it as "ask first".
