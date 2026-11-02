# Testing

- Every new behavior gets a test, or a stated reason why not.
- Bug fixes start with a failing test that reproduces the bug.
- Run the relevant tests after every meaningful change, and the full suite before pushing.
- Test commands live in `docs/PROJECT.md` under "Commands". If missing, ask the kickoff question and add them.
- Prefer testing locally. Do not use a hosted/production environment as a test bed.
- For web UIs, run the local dev server and check the page works before reporting done. If you cannot verify something (for example visual layout), say so rather than claiming it works.
- Report test results honestly: what ran, what passed, what failed, what was skipped.

## By stack (fill in at kickoff; keep only the ones that apply)
- Python: `pytest`, `ruff check`, optional `mypy`
- .NET: `dotnet test`, `dotnet format --verify-no-changes`
- Node/web: the project's `npm test` / `npm run lint` / `npm run build`
