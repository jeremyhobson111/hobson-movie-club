# Decision log
<!-- Append-only. Not auto-loaded. One entry per meaningful choice. -->

## DEC-001: Plain HTML/JS + Supabase + GitHub Pages
- **Date:** 2026-11-01
- **Status:** accepted
- **Context:** A small family-only movie club site. Needs saved data and per-person login, but nothing complex.
- **Decision:** Plain HTML/CSS/JS with no build step, Supabase for database and email login, GitHub Pages for hosting. Family-only, not for sale or handoff (handoff paperwork skipped). No payments.
- **Alternatives considered:** Vite + React (more structure, but adds a build step and dependencies); Netlify hosting (rejected: free credits matter and Pages is enough for static files).
- **Consequences:** No build tools to maintain. Everything runs in the browser, so security depends on Supabase row-level security, not hidden code. The Netlify rule file (80-deploy-netlify-supabase.md) and netlify.toml.example do not apply; they can be removed with approval. GitHub Pages has no deploy previews, so test locally.