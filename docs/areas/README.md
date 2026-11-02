# Area docs

One file per area of the project (for example `frontend.md`, `api.md`, `data.md`, `billing.md`, `infra.md`). Each is under ~60 lines and covers:

- Purpose of the area
- Key files and directories
- Conventions specific to this area
- Gotchas
- Current open work
- Related DECISIONS entries

**How to use with separate chats:** start a chat with "Working on <area>". Claude reads `docs/areas/<area>.md` and nothing else is needed. Different chats on different areas all share the same always-loaded brief (`PROJECT.md`, `STATE.md`) without re-explaining and without loading every other chat's context.

Template for a new area file:

```
# <Area>
## Purpose
## Key files
## Conventions
## Gotchas
## Open work
## Related decisions
```
