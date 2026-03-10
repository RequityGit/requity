# Journal — 2026-03-06

## What We Did Today

Today was an exploratory/orientation session. No code changes were made.

### Topics Covered

1. **MCP Server Audit** — Confirmed the project has two MCP servers configured in `.mcp.json`:
   - **Sentry** (`https://mcp.sentry.dev/mcp`)
   - **Supabase** (`https://mcp.supabase.com/mcp?project_ref=edhlkknvlczhbowasjna`)
   - Verified there is **no AppFolio MCP server** — all AppFolio references are UI content (links to their investor portal, FAQ copy, design comments).
   - Confirmed **no plaintext credentials** are stored in the MCP config.

2. **Monorepo Structure Review** — Walked through the `/apps` vs `/packages` distinction:
   - `/apps` — Deployable Next.js applications (`requity-os`, `requity-group`, `trg-living`)
   - `/packages` — Shared libraries (`db`, `ui`, `lib`, `types`)
   - The main Borrower Portal UI lives in `apps/requity-os`.

## Terminal Commands to Remember

```bash
# Run all apps in dev mode
pnpm dev

# Run only RequityOS
pnpm --filter @repo/requity-os dev

# Build everything
pnpm build

# Install dependencies (always use pnpm, never npm/yarn)
pnpm install

# Add a dependency to a specific app
pnpm add <pkg> --filter @repo/requity-os
```

## Tomorrow — Suggested Starting Points

- Pick up any pending feature work or bug fixes in `apps/requity-os`
- If an AppFolio integration is planned, we can scope out what an MCP server or API integration would look like
- Review any open PRs or issues on the repo
