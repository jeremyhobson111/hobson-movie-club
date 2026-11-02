# Session continuity (so new chats never need re-explaining)

Goal: any new chat, on any device, can be productive after reading a few small files. Chats are disposable. The repo is the memory.

## Token budget
- Always loaded (via @import in CLAUDE.md): `docs/PROJECT.md` and `docs/STATE.md`. Keep each under ~60 lines.
- Everything else is read on demand. Never @import area docs, the roadmap, or the decision log.

## Starting a session
1. Read the always-loaded files (automatic).
2. If the user names an area ("working on billing"), read `docs/areas/<area>.md`.
3. Run `git status` and `git log --oneline -10` to see where things stand.
4. State in one line what you understand the current focus to be. Ask only if it is unclear.

## During a session
- Keep area docs accurate when you change that area's behavior or structure.
- Capture decisions in DECISIONS.md as they happen, not later.

## Ending a session (or when asked to "wrap up")
Rewrite (do not append to) `docs/STATE.md` using this shape, under 40 lines:
- **Current focus:** one sentence
- **Done this session:** 3-6 bullets
- **In progress / branch:** branch name, what is half-done, how to resume
- **Next steps:** ordered, max 5
- **Open questions for the user**
- **Deferred housekeeping:** things the user said "later" to

Commit it on the working branch with the message `docs: update STATE`.

## Area docs (`docs/areas/<area>.md`, under ~60 lines each)
Purpose, key files/directories, conventions specific to the area, gotchas, current open work, and links to relevant DECISIONS entries.
