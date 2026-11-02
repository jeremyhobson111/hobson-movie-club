# Project kickoff (run once, when Stack is TBD in CLAUDE.md)

Ask these in one batch (use AskUserQuestion if available), then record the answers in `docs/PROJECT.md` and `docs/DECISIONS.md` (DEC-001), and fill in the Stack line of `CLAUDE.md`.

1. **What is it?** (website, web app, API, desktop app, script/tool, library, mix) and who uses it?
2. **Language/framework preference**, or "you choose". If "you choose", recommend the simplest option that fits and say why in two sentences. Prefer what the user already runs elsewhere.
3. **Data:** none / Supabase / other DB / local files?
4. **Hosting:** local only / Netlify / other / not decided?
5. **Auth and payments needed?** (these add real complexity; push back if they are not needed for v1)
6. **Is this likely to be sold or handed off?** If yes, enable handoff discipline: license choice, `HANDOFF.md` kept current, no hard-coded personal accounts.
7. **Definition of done for v1:** three bullet points max.

Then:
- Pick the test command, lint command, and run command for the stack and write them into `docs/PROJECT.md` under "Commands".
- Create the first entries in `docs/ROADMAP.md` (v1 only, small).
- Update `.github/workflows/ci.yml` to run the stack's test/lint commands.
- Commit on a branch `chore/kickoff` and open a draft PR. Do not merge it.
