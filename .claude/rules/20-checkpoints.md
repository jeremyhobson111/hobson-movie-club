# Checkpoints: when to prompt the user for formal housekeeping

The user wants most work to be autonomous, but wants to be reminded of the formal steps. At each trigger below, **propose** the step in one or two sentences, with a recommendation, and let the user say yes/no/later. If they say "later", note it in `docs/STATE.md` under "Deferred housekeeping". Do not nag more than once per session about the same item.

| Trigger | Propose |
|---|---|
| A feature batch is done, tests pass, branch is pushed | Open/refresh the PR. If the merge conditions in 10-autonomy.md are met, merge it and say so in one line. Then ask whether this should become a release |
| The user corrects the same behavior twice, or states a standing preference | Add it as a rule in `CLAUDE.md` or `.claude/rules/` (show the exact line) |
| The same multi-step procedure has been done three times | Turn it into a skill (`.claude/skills/<name>/SKILL.md`) or a script in `scripts/` |
| A dependency, service, or architectural choice is made | Add a DEC-### entry to `docs/DECISIONS.md` |
| A new area of the project starts (e.g. billing, admin, import) | Create `docs/areas/<area>.md` |
| Roadmap item is finished | Tick it in `docs/ROADMAP.md`; add a CHANGELOG line under "Unreleased" |
| Merged work since last tag is meaningful, or a milestone is hit | Propose a release, say which version level you would pick and why (see 50-git-and-releases.md); wait for the user to say "release" |
| Complexity warning (see 40-complexity.md) | Say so plainly and propose the simpler option |
| Session is ending, or the conversation is getting long | Rewrite `docs/STATE.md` (see 30-session-continuity.md) |
| Anything in HANDOFF.md is now out of date | Update it, or propose the edit |
| A secret may have been exposed | Stop, tell the user, recommend rotating it |
| The user asks for something that sounds useful to every project | Ask: global settings, the project template, both, or just this project? Recommend one. Change nothing until they answer |
| The user's process looks inconsistent or risky (working on main, skipping tests, decisions only in chat, project outside the ClaudeProjects folder, uncommitted work piling up) | Say so kindly, once, and show the better way |
| Session start shows an AUTO-PULL FAILED message | Explain what it means in plain words and walk the user through resolving it before editing |

## Hand-holding
The user has programming experience but wants a little extra guidance on git/GitHub, configuration, and Claude management. For those, give ordered steps, a short "what this does" for each, and what success looks like. Use Windows PowerShell commands unless told otherwise.

Keep proposals short. Example:
> Auth is now working and tested. I suggest recording the choice of Supabase Auth as DEC-004 and adding the `/auth` area doc. Want me to do both?
