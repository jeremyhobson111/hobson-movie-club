# Git and releases

## Branching
- `main` is always releasable. It changes only through merged PRs.
- Claude may merge its own PRs when the conditions in `10-autonomy.md` are met. **Merging is not releasing**: a merge must never publish anything or spend hosting credits.
- Work on short-lived branches: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`.
- One logical change per PR. Draft PRs are fine while in progress.
- Use squash merges so `main` has one clean commit per change. Put the PR title in the subject line, in conventional style (below). The version level is worked out from these subjects.

## Commits and PR titles
- Small, frequent, and runnable. Never commit code that fails tests unless the commit message says `WIP`.
- Conventional style: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`, `test: ...`, `perf: ...`.
- Mark breaking changes with `!` (for example `feat!: ...`) and a `BREAKING CHANGE:` line in the body explaining what breaks and how to migrate.
- Before pushing: run the project's test and lint commands (see `docs/PROJECT.md` "Commands").
- For projects connected to a host that deploys on merge, see `80-deploy-github-pages.md`.

## Rolling back
- To undo something already on `main`, use `git revert` (a new commit), never history rewriting.
- Mention the commit hash and the revert command to the user when a problem is found.

## Releases: Claude picks the version

The user asking for a release is the approval. They do not need to supply a number.

**Triggers:** "release", "make a release", "ship it", or similar. Also accepted:
- `release patch`, `release minor`, `release major`: the user chooses the level, Claude works out the number.
- `release 1.4.0`: the user chooses the exact number. Always honor an explicit override.

**How Claude chooses the level** (look at every merged commit/PR since the last `v*` tag with `git log <last-tag>..main --oneline`):

| What changed since the last release | Level | Example |
|---|---|---|
| Any breaking change: a `!` commit or `BREAKING CHANGE:` line, removed or renamed public behavior, incompatible data/schema/config change, dropped support for something users rely on | **MAJOR** (X.0.0) | 1.4.2 -> 2.0.0 |
| At least one `feat:` (new user-visible capability), and nothing breaking | **MINOR** (x.Y.0) | 1.4.2 -> 1.5.0 |
| Only `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `chore:` | **PATCH** (x.y.Z) | 1.4.2 -> 1.4.3 |

The highest level wins. Judge by the effect on users, not the size of the diff: a one-line change that breaks existing data is MAJOR, and a large internal refactor with no user-visible change is PATCH.

**Version 0.x (before the first stable release):** breaking changes and new features both bump MINOR (0.3.1 -> 0.4.0); fixes bump PATCH. The very first release is `0.1.0`. Moving to `1.0.0` means "ready for real use and a compatibility promise", so propose it and ask before doing it.

**Confirmation:**
- PATCH and MINOR: decide, state it in one line with the reason ("0.2.0: two new features, no breaking changes"), and carry on.
- MAJOR (including `1.0.0`): state the version and list the breaking changes that justify it, then wait for a quick yes, because a major bump promises compatibility to people who use or buy the software.
- Nothing to release (no commits since the last tag): say so and stop.

**Release steps:**
1. Make sure `main` is up to date and tests and CI pass.
2. On a branch `chore/release-v<version>`: move CHANGELOG "Unreleased" entries under the new version heading with today's date, and update the version in the project's manifest (`package.json`, `pyproject.toml`, `*.csproj`, or wherever this project keeps it; see `docs/PROJECT.md`). Open a PR, and merge it once CI is green (this follows the normal merge rules).
3. Create an annotated tag `v<version>` on the merge commit and push the tag, then create a GitHub release with the changelog section as the notes.
4. Deploy only if the user also asked for a deploy; follow `80-deploy-github-pages.md`.
5. Update `docs/HANDOFF.md` if setup or deploy steps changed, and `docs/STATE.md`.
6. Report in one or two lines: the version, why that level, and what is in it.

If the version was wrong, do not delete or move the tag silently. Tell the user and propose the fix (a new, correct release is usually cleanest).
