# CLAUDE.md — Requity Group Monorepo

## Project Overview

Requity Group Monorepo — a pnpm + Turborepo workspace containing multiple Next.js applications and shared packages. The primary app is RequityOS, a full-stack SaaS platform for lending/fintech.

**Goal:** RequityOS is the most reliable tool any internal or external counterparty of Requity has ever used. Bulletproof functionality that never skips a beat, elegant UI, built with simplicity so the sum of simple parts handles complex workflows.

---

## Simplicity Principles

These guide every decision. If a proposed change violates one, push back.

1. **Prefer fewer, well-tested components over many specialized ones.** Every new abstraction must justify its existence. If it can be built by composing existing primitives, it must be.
2. **One way to do things.** If there's already a pattern for data fetching, form handling, or error display — use it. Don't invent a second way.
3. **Explicit over clever.** A verbose but readable approach beats a terse but opaque one. No magic.
4. **Small surface area.** Components accept only the props they need. Functions do one thing. Files stay under ~150 lines — split by composition, not by growing monoliths.
5. **Delete before you add.** Before creating something new, check if an existing component or utility already handles it (or can be extended trivially).

---

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

---

## Tech Stack

- **Build System**: Turborepo + pnpm workspaces
- **Framework**: Next.js 14.2.21 with App Router (all apps)
- **Language**: TypeScript 5.9 (strict mode)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with SSR support (RequityOS only)
- **Styling**: Tailwind CSS 3.4 per-app with app-specific tokens
- **UI Components**: shadcn/ui + Radix UI (RequityOS), custom per-app
- **Deployment**: Netlify (RequityOS), TBD (other apps)

---

## Design System

**RequityOS** follows [`apps/requity-os/DESIGN_SYSTEM.md`](./apps/requity-os/DESIGN_SYSTEM.md) (v3). Read it before touching any RequityOS component. Key reminders:

- Inter only via `font-sans`. No serif fonts, ever.
- `.num` class on ALL numeric values (currency, percentages, dates).
- `NumericTick` component for Recharts axes.
- Always compose existing shadcn primitives before creating custom components.
- If it looks like a SaaS template or a navy-gradient fintech mockup — it's wrong.

Other apps (requity-group, trg-living) follow their own brand tokens in their respective `tailwind.config.ts` files.

---

## UI Behavior Standards (RequityOS)

Every user interaction must feel reliable. No dead ends, no mystery states.

### Every Mutation Needs Three States
1. **Loading** — disable the trigger, show a spinner or subtle indicator with context (e.g., "Saving loan…" not a bare spinner).
2. **Success** — toast confirmation with what happened (e.g., "Loan L-1042 updated"). Revalidate or optimistically update the affected data.
3. **Error** — toast or inline error with a specific, actionable message. Never "Something went wrong." Include what failed and what the user can do about it.

### Error UX Rules
- Form validation errors appear inline next to the field, not in a toast.
- Server/mutation errors appear as toasts (destructive variant).
- If a page fails to load data, show an empty state with a retry action — never a blank screen.
- All error messages must be human-readable. Never expose raw database errors, status codes, or stack traces to users.

### Consistency
- Use shadcn `Toast` (via `useToast`) for all transient feedback. No `alert()`, no custom notification systems.
- Use shadcn `AlertDialog` for destructive confirmations only (delete, cancel, revoke). Non-destructive actions should not require confirmation modals.
- Loading skeletons (shadcn `Skeleton`) for initial page/section loads. Inline spinners for mutations.

---

## State & Data Flow (RequityOS)

### Server vs. Client State
- **Server state** (Supabase data) is fetched in Server Components or via server actions. Client-side refetching uses `router.refresh()` or revalidation.
- **Client state** (form inputs, UI toggles, modal open/close) stays in React `useState` or `useReducer`. Keep it minimal.
- **No global client state library** (no Redux, no Zustand). If something feels like it needs global state, it probably needs to be restructured as server-fetched data or React Context scoped to a subtree.

### Data Flow Rules
1. Data flows from server to component. No prop drilling beyond two levels — use composition (children/render props) or scoped Context.
2. Components receive exactly the data they need. Don't pass entire objects when a component only uses two fields.
3. Supabase calls happen in server actions or API routes, not in client components. The client triggers; the server executes.

### Realtime & Freshness
- Use Supabase Realtime subscriptions only for genuinely collaborative/live features (e.g., multiple users viewing the same loan). Don't use them as a lazy substitute for proper revalidation.
- For standard CRUD flows, revalidate after mutations via `revalidatePath` or `router.refresh()`.
- Stale data is worse than slow data. If a loan status changes, the next time any user views it, it must reflect the current state.

---

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

---

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

---

## Environment Variables

Required in `apps/requity-os/.env` (see `apps/requity-os/.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side only)
```

---

## Testing

### Requirements
- **Every form submission**: test that fields render, required validation fires, submit calls the correct Supabase RPC/mutation with the correct payload, and success/error states display properly.
- **Every button that triggers a mutation** (insert, update, delete, RPC call): test that it fires correctly and handles errors gracefully.
- **Every new page or route**: smoke test — renders without crashing, required data loads, role-based access is enforced.

### Tools & Patterns
- **Vitest** for unit/integration tests. **Playwright** for E2E flows involving multi-step user interaction.
- Test files live next to the component: `ComponentName.test.tsx` in the same directory.
- Mock Supabase at the client level. Test structure:
  1. Render with mocked data
  2. Interact (fill fields, click buttons)
  3. Assert the Supabase call was made with the correct payload
  4. Assert the UI reflects success or error state

### When Modifying Existing Features
- **Read the existing tests first** before changing anything. If tests exist, update them to match new behavior.
- **If no tests exist for the feature you're modifying, write them first** (covering current behavior), then make your changes.
- Run the full test suite after changes. If anything breaks, fix it before proceeding.

---

## Validation & Type Safety

- **All form inputs** validated with **Zod schemas** before submission. Never trust raw form data.
- Zod schemas must match corresponding Supabase table types. If a column is `text NOT NULL`, the Zod field is `z.string().min(1)` — not `.optional()`.
- **Never use `any` type.** If you don't know the type, look it up via MCP (`list_tables`, `execute_sql`) or reference the generated Supabase types.
- When adding or modifying a form field, verify the field name matches the exact column name in Supabase. **Mismatches between form fields and DB columns are the #1 source of portal bugs.**

---

## Error Handling

- Every Supabase call: `const { data, error } = await supabase...` followed by an `if (error)` block.
- Never silently swallow errors. At minimum: log to `console.error` with context, show a toast to the user.
- API/edge function calls must have try/catch with meaningful error messages.
- When structured logging/Sentry is added, these `console.error` calls become the integration points. Until then, `console.error` with context is the standard.

---

## Database Changes

- Every schema change (new table, new column, altered type) must be done via a **Supabase migration** through MCP — never raw SQL in the dashboard.
- After any schema change, regenerate TypeScript types immediately: `npx supabase gen types typescript --project-id edhlkknvlczhbowasjna > src/types/supabase.ts`
- Update any affected Zod schemas to match the new types.
- If you add a new table, add RLS policies. No table ships without RLS.

---

## Forbidden Patterns

- ❌ `as any` — find the real type
- ❌ Optional chaining as a band-aid (`data?.something?.nested?.value`) when the data should be guaranteed — fix the data flow instead
- ❌ Submitting forms without Zod validation
- ❌ Mutations without error handling
- ❌ New tables without RLS policies
- ❌ Pushing code that doesn't build
- ❌ Skipping tests because "it's a small change"
- ❌ `console.log` in production code (use `console.error` with context for actual errors)
- ❌ Hardcoded values that should come from the database or env vars
- ❌ Custom components that duplicate existing shadcn primitives
- ❌ Generic error messages ("Something went wrong") shown to users
- ❌ Bare loading spinners without context labels

---

## Definition of Done

Before any PR is opened, confirm all six:

1. ✅ `pnpm build` — zero errors, zero warnings
2. ✅ `pnpm lint` — passes clean
3. ✅ Tested — new/modified mutations have corresponding tests
4. ✅ Validated — all forms use Zod, all errors are handled
5. ✅ Matches design system — follows `DESIGN_SYSTEM.md`, no visual regressions
6. ✅ Manually verified — clicked every button, submitted every form, checked empty/loading/error/success states

---

## GitHub — PR Workflow

**CRITICAL: ALWAYS push the branch and create a pull request.**

```bash
git push -u origin <branch-name>
gh pr create --title "..." --body "..." --base main
```

If `gh` is not authenticated, provide: `https://github.com/RequityGit/borrwerportal/compare/main...<branch-name>`
