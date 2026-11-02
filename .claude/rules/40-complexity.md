# Keep it simple (important for projects that may be sold or handed off)

- Prefer the boring, well-known solution. Prefer fewer moving parts over cleverness.
- No new dependency without asking and logging a DECISIONS entry. Prefer the standard library or an existing dependency.
- No feature that is not on `docs/ROADMAP.md`. If an idea comes up, add it to the roadmap's "Ideas" list and ask.
- No premature abstraction: do not add layers, plugin systems, or config options until there are at least two real uses.
- Keep files focused. If a file passes ~400 lines or a function passes ~60 lines, flag it and propose a split.
- One way to do each thing. If you find two patterns for the same job, propose consolidating.
- Every non-obvious piece of code gets a short comment explaining **why**, not what.

## Complexity warning signs (say so out loud when you notice them)
- More than ~10 direct dependencies in a small project.
- A third service added (hosting + DB + something else).
- Config that needs more than a page to explain.
- You are about to write a workaround for a tool instead of using it normally.

When you see one, stop and give the user a two-line summary: what is getting complex, and the simpler alternative.
