# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Turborepo monorepo with 3 Next.js 14 apps and 4 shared packages. See `CLAUDE.md` for full architecture, schema, and coding rules.

### Apps and Ports

| App | Package | Port | Purpose |
|-----|---------|------|---------|
| requity-os | `@repo/requity-os` | 3000 | Authenticated SaaS portal (primary app) |
| requity-group | `@repo/requity-group` | 3001 | Public marketing site |
| trg-living | `@repo/trg-living` | 3002 | Public TRG Living site |

### Running services

- `pnpm dev` from repo root starts all three apps via Turborepo
- To start a single app: `pnpm --filter @repo/requity-os dev` (or `requity-group`, `trg-living`)
- requity-os uses `next dev --turbo` (Turbopack)

### Environment variables

- requity-os requires a `.env.local` in `apps/requity-os/` with at minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL=http://localhost:3000`. See `apps/requity-os/.env.example` for the full list.
- Supabase URL and anon key are also in `.env.test` (committed) for E2E tests against the hosted instance.
- No local Supabase setup; the project uses a hosted Supabase instance only.
- `SUPABASE_SERVICE_ROLE_KEY` is needed for server-side operations but not required for the dev server to start.

### Lint and typecheck

- `pnpm lint` runs linting across all apps. Note: `@repo/lib` and `@repo/ui` lint scripts fail because they lack ESLint config files; this is a pre-existing issue. The three app lint commands work fine.
- `pnpm typecheck` runs `tsc --noEmit` across all 7 packages.
- `pnpm build` runs production builds and catches all TS errors.

### Tests

- `pnpm test` runs Vitest unit tests (only in requity-os currently).
- E2E tests use Playwright (`pnpm test:e2e`) and run against the deployed portal by default, not local dev.

### Pre-commit hooks

- Husky pre-commit hook runs `lint-staged`, which typechecks and lints changed files per app.

### Auth

- requity-os login page is at `/login` with Google OAuth and magic link options.
- Full authentication requires Supabase credentials and a valid user account.
- Without `SUPABASE_SERVICE_ROLE_KEY`, some server-side features won't work, but the dev server starts and renders the login page.
