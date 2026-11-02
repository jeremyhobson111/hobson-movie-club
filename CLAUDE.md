# hobson-movie-club

**Purpose:** A website that manages our family movie club: a survey to learn what people want, then movie picks, ratings and reviews. Family members only.
**Stack:** Plain HTML/CSS/JavaScript (no build step), Supabase (database + email login), GitHub Pages hosting. See DEC-001.
**Repo is the source of truth.** Decisions, plans, and state live in files in this repo, never only in chat.

## Always-loaded context (keep these files short)
@docs/PROJECT.md
@docs/STATE.md

## Operating model (details are in .claude/rules/)
- Work autonomously on code, tests, local servers, feature branches, and docs.
- Ask before the "formal" actions: new dependency, remote DB migration, CI/config changes, deleting files, tagging, releasing, deploying, anything involving secrets or money.
- **Merging to `main` publishes the site** (GitHub Pages, free, see DEC-003 and 80-deploy-github-pages.md). Claude may merge its own PRs when CI is green and the conditions in 10-autonomy.md are met, but only merges work that is ready for the family to see. Unfinished work stays on its branch.
- Tags and GitHub releases are optional milestone markers, made only when the user asks ("release", `release patch|minor|major`, `release 1.4.0`). Claude picks the version from the commits since the last release (50-git-and-releases.md) unless the user gives one.
- At natural checkpoints, **propose** the formal housekeeping (see 20-checkpoints.md). Do not silently skip it and do not silently do it.

## On-demand context (do NOT @import these; read the one you need)
- `docs/ARCHITECTURE.md`: how the system fits together
- `docs/DECISIONS.md`: why things are the way they are (append-only log)
- `docs/ROADMAP.md`: planned work and priorities
- `docs/areas/<area>.md`: per-area context. If the user says "working on <area>", read that file first.
- `docs/HANDOFF.md`: setup/deploy notes for a future owner or buyer

## Housekeeping rules for this file
- Keep this file under ~80 lines. Move detail into `.claude/rules/` or `docs/`.
- Every rule here should be something Claude would otherwise get wrong. Remove rules that are never needed.
