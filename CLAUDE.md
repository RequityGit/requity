# CLAUDE.md — Requity Group Monorepo

## Project Overview

Requity Group Monorepo — a pnpm + Turborepo workspace containing multiple Next.js applications and shared packages. The primary app is RequityOS, a full-stack SaaS platform for lending/fintech.

## Monorepo Structure

```
/
├── apps/
│   ├── requity-os/        # RequityOS SaaS portal (borrower/lender/investor)
│   ├── requity-group/     # Requity Group public marketing site
│   └── trg-living/        # TRG Living public site
├── packages/
│   ├── db/                # Shared Supabase: migrations, seed, edge functions
│   ├── ui/                # Headless shared component primitives
│   ├── lib/               # Shared utilities (cn, formatCurrency, etc.)
│   └── types/             # Shared TypeScript types
├── CLAUDE.md              # This file (monorepo root)
├── DESIGN_SYSTEM.md       # Design system spec (applies to RequityOS)
├── turbo.json             # Turborepo pipeline config
├── pnpm-workspace.yaml    # Workspace definition
└── package.json           # Root workspace package
```

## Commands (from root)

```bash
pnpm dev          # Run all apps in parallel (Turborepo)
pnpm build        # Build all apps and packages
pnpm lint         # Lint all workspaces
pnpm test         # Run tests across workspaces
pnpm typecheck    # TypeScript checking across workspaces
```

## App-specific commands

```bash
pnpm --filter @repo/requity-os dev     # Dev server for RequityOS (port 3000)
pnpm --filter @repo/requity-group dev  # Dev server for Requity Group (port 3001)
pnpm --filter @repo/trg-living dev     # Dev server for TRG Living (port 3002)
```

## Critical Rules

1. **Apps may import from `packages/*` but NEVER from each other**
2. **Packages must have zero knowledge of apps**
3. Each app has its own `CLAUDE.md` — read it before working on that app
4. Shared utilities go in `packages/lib`, shared types in `packages/types`
5. Database migrations and Supabase config live in `packages/db/supabase/`
6. Use `workspace:*` for internal package references

## Package Manager

This repo uses **pnpm** with workspaces. Do NOT use npm or yarn.

```bash
pnpm install              # Install all dependencies
pnpm add <pkg> --filter @repo/requity-os   # Add dep to specific app
```

## Tech Stack

- **Build System**: Turborepo + pnpm workspaces
- **Framework**: Next.js 14.2.21 with App Router (all apps)
- **Language**: TypeScript 5.9 (strict mode)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with SSR support (RequityOS only)
- **Styling**: Tailwind CSS 3.4 per-app with app-specific tokens
- **UI Components**: shadcn/ui + Radix UI (RequityOS), custom per-app
- **Deployment**: Netlify (RequityOS), TBD (other apps)

## Environment Variables

Required in `apps/requity-os/.env` (see `apps/requity-os/.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side only)
```

## Design System

**All RequityOS UI/design decisions must follow [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (v3).** Other apps (requity-group, trg-living) have their own brand tokens in their respective `tailwind.config.ts` files.

## Database

- Supabase PostgreSQL with RLS enabled on all tables
- Migrations live in `packages/db/supabase/migrations/`
- Seed data in `packages/db/supabase/seed.sql`
- Edge functions in `packages/db/supabase/functions/`

### Core Tables (28 tables)

**Auth & Identity:**
- `profiles` — User identity (FK → auth.users), stores role, allowed_roles, activation_status
- `user_roles` — Maps users to app_role enum (super_admin, admin, investor, borrower)

**Lending / Loan Pipeline:**
- `borrowers`, `borrower_entities`, `loans`, `loan_condition_templates`, `loan_conditions`, `loan_documents`, `loan_draws`, `loan_payments`, `loan_activity_log`

**Investor Portal:**
- `investors`, `investing_entities`, `funds`, `investor_commitments`, `capital_calls`, `capital_call_line_items`, `distributions`, `distribution_line_items`

**Operations:** `ops_projects`, `ops_project_notes`, `ops_project_comments`, `ops_tasks`, `ops_task_comments`

**CRM:** `crm_contacts`, `crm_activities`

### Rules for Database Code

1. Always use typed Supabase client
2. Never guess column names — check `apps/requity-os/lib/supabase/types.ts`
3. `unfunded_amount` on investor_commitments is generated — never set directly
4. `loan_number` is auto-generated — never set on insert
5. Soft deletes — filter with `.is("deleted_at", null)`
6. Use `stage` not `status` for loan pipeline tracking
7. RLS: wrap `auth.uid()` in a subselect: `(select auth.uid())`

## Supabase MCP (Required)

**CRITICAL: ALWAYS use the Supabase MCP server for ALL database operations.**

### Connection Setup

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=edhlkknvlczhbowasjna"
```

### MCP Tool Usage

- **Project ID**: `edhlkknvlczhbowasjna`
- **Schema changes**: `mcp__Supabase__apply_migration` — also create `.sql` file in `packages/db/supabase/migrations/`
- **Data queries**: `mcp__Supabase__execute_sql`
- **Generate types**: `mcp__Supabase__generate_typescript_types` → write to `apps/requity-os/lib/supabase/types.ts`

## GitHub — PR Workflow

**CRITICAL: ALWAYS push the branch and create a pull request.**

```bash
git push -u origin <branch-name>
gh pr create --title "..." --body "..." --base main
```

If `gh` is not authenticated, provide: `https://github.com/RequityGit/borrwerportal/compare/main...<branch-name>`

## Typography (RequityOS)

- **Font**: Inter exclusively via `font-sans`
- **`.num` class**: Apply to ALL numeric values (currency, percentages, dates)
- **Charts**: Use `NumericTick` component for Recharts axes
- These rules apply to RequityOS only — other apps follow their own design systems

## Page Layout (RequityOS)

- No KPI cards on content pages (data tables, kanban boards)
- Standard: PageHeader → Toolbar → Data view (visible without scrolling at 900px)
- KPI cards belong on Dashboard only
