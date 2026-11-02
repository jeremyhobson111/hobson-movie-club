# Security and secrets

- Secrets never go in git, chat, docs, or logs. Use environment variables or the host's secret store.
- Keep `.env.example` current with every variable name (no real values) and a one-line description.
- Do not read `.env` or other secret files. If a value is needed, ask the user to set it.
- Supabase: the service-role key is server-side only and never ships to a browser. Use row-level security on every table that holds user data and confirm it is enabled before calling a feature done.
- Validate input at the boundaries. Do not build SQL by string concatenation.
- If a secret may have been exposed (committed, pasted, logged), stop, tell the user, and recommend rotating it. Do not try to quietly clean it up.
- When handing off or selling a project, all credentials must belong to the project's own accounts, not personal ones, and be listed (names only) in `docs/HANDOFF.md`.
