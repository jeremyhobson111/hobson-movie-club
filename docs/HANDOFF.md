# Handoff guide
<!-- For a future maintainer or buyer. Claude keeps this current whenever setup or deploy steps change. -->

## What this is
{{...}}

## Accounts and services (names only, never credentials)
| Service | Purpose | Owner account | Notes |
|---|---|---|---|
| GitHub | source | {{...}} | |
| {{Netlify}} | hosting | {{...}} | |
| {{Supabase}} | database/auth | {{...}} | |

## Environment variables
See `.env.example`. Where each is set: {{local .env / Netlify UI / etc.}}

## Set up from scratch
1. {{clone}}
2. {{install}}
3. {{configure env}}
4. {{run}}

## Deploy
Merging a PR to `main` runs `.github/workflows/pages.yml`, which publishes `index.html`, `css/` and `js/` to GitHub Pages (free, public repo). One-time setup: repo Settings > Pages > Source = "GitHub Actions". Custom domain: hobsonmovieclub.com (set in Settings > Pages, plus DNS at the registrar). Supabase Auth > URL Configuration must list the live site address(es) as redirect URLs.

## Operations
Backups, monitoring, known issues, recurring tasks.
- A daily GitHub job (`keep-supabase-awake.yml`) pings the database so the free-plan project is not paused for inactivity (DEC-005). If it fails, GitHub emails the owner; check the Supabase dashboard.

## License and ownership
{{license, third-party licenses to be aware of}}
