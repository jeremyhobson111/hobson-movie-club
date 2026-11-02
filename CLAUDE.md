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
- Claude may merge its own PRs to `main` when CI is green and the conditions in 10-autonomy.md are met. Merging is not releasing, and a merge must never publish anything or spend hosting credits (see 80-deploy-netlify-supabase.md).
- Nothing is released or deployed to production until the user asks ("release", or `release patch|minor|major`, or `release 1.4.0`). Claude picks the version number from the commits since the last release (rules in 50-git-and-releases.md) unless the user gives one.
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
