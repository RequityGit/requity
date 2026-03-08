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

## Development Workflow

These workflow standards apply to every task. They are non-negotiable — follow them in order.

### 1. Plan Before You Code

**For multi-step features or new modules:**
- Explore the codebase first: read existing patterns, recent commits, related files.
- Ask clarifying questions one at a time. Prefer multiple-choice when feasible.
- Propose 2-3 approaches with trade-offs and a recommendation. Get user approval before writing any code.
- Break approved work into bite-sized tasks (each ~2-5 minutes of work): write failing test → make it pass → commit.
- For complex features, save the plan to `docs/plans/YYYY-MM-DD-<feature-name>.md`.

**Hard gate:** Do NOT write implementation code until the approach is approved. "Simple" tasks often contain the most problematic unexamined assumptions — a brief plan can still be one paragraph.

**For bug fixes and small changes:** A plan can be verbal (stated in chat), but must still exist. State what you think the root cause is and how you'll fix it before touching code.

### 2. Test-Driven Development (Red-Green-Refactor)

**The iron law: no production code without a failing test first.**

Every new feature, bug fix, or behavior change follows this cycle:

1. **RED** — Write one minimal test demonstrating the expected behavior. Run it. Watch it fail. If it passes immediately, you're testing existing behavior — revise the test.
2. **GREEN** — Write the simplest code that makes the test pass. Nothing more. No unrequested features, no unrelated refactoring, no over-engineering.
3. **REFACTOR** — Only after green: eliminate duplication, improve naming, extract helpers. All tests must stay green throughout.
4. **COMMIT** — Commit the passing test + implementation together.
5. **REPEAT** — Next failing test.

**Verify every phase:**
- RED: test fails for the right reason (missing feature, not a typo or import error).
- GREEN: test passes AND all other tests still pass.
- REFACTOR: no test regressions.

**Bug fixes always start with a failing test** that reproduces the bug. The test proves the fix works and prevents regression.

**Exceptions** (require user approval): throwaway prototypes, generated code, pure configuration files.

**If you catch yourself writing code before the test — stop.** Delete the code. Write the test first.

### 3. Systematic Debugging

**No fixes without root cause investigation first.** Guessing guarantees wasted time and new bugs.

Four mandatory phases:

| Phase | What to Do |
|-------|-----------|
| **1. Investigate** | Read the full error message and stack trace. Reproduce the issue consistently. Check recent changes (`git log`, `git diff`). Trace data flow backward through the call stack. |
| **2. Analyze** | Find similar working code in the codebase. List all differences between working and broken versions. Understand dependencies and assumptions. |
| **3. Hypothesize** | Form one specific hypothesis. Test it with a minimal change — one variable at a time. Verify before proceeding. |
| **4. Fix** | Write a failing test that reproduces the bug. Implement a single fix addressing the root cause. Verify all tests pass. |

**If 3+ fix attempts fail:** stop fixing symptoms. Question the architecture. The design may be wrong.

**Red-flag phrases that mean you've left the process:** "quick fix for now", "just try this", "one more attempt". If you hear yourself thinking these — restart at Phase 1.

### 4. Verification Before Completion

**Every claim of "done" requires fresh evidence. No exceptions.**

Before saying any task is complete:

1. **Identify** the verification command (`pnpm build`, `pnpm test`, `pnpm lint`, etc.)
2. **Run** it freshly — not from memory, not from a previous run
3. **Read** the complete output, including exit codes and failure counts
4. **Confirm** the output proves the claim (zero errors, zero failures)
5. **Only then** state the result with evidence

**Banned language without evidence:** "should work", "probably fixed", "looks good", "I believe this is correct". Run it and prove it.

**Applies before:** commits, PRs, task completion claims, delegation to subagents, and any statement implying success.

### 5. Subagent-Driven Development

**For complex tasks with multiple independent subtasks**, use fresh subagents per task:

1. Read the plan and extract all tasks with full context.
2. For each task: dispatch a subagent with complete context (don't make it re-read files you've already read).
3. After the subagent completes: review its work via `git diff`, run tests independently.
4. Never skip the review step. Never proceed with unfixed issues.
5. After all tasks: run full verification (`pnpm build && pnpm lint && pnpm test`).

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
- **Every new user-facing column must be registered in the Field Manager** — see section below.

---

## Field Manager

The Field Manager (`/control-center/field-manager`) is the single source of truth for which fields are visible, their layout order, and column position on every detail/profile page in RequityOS. It is backed by the `field_configurations` table in Supabase.

### Rules

1. **Every user-facing column must have a `field_configurations` row.** If a column is editable or displayed on a detail page, it must be registered in the Field Manager — no exceptions. This includes text fields, dropdowns, dates, booleans, currency, percentages, and formula/calculated fields.
2. **When adding a new column to an existing table**, also INSERT a corresponding row into `field_configurations` in the same migration. Include: `module`, `field_key` (must match the DB column name exactly), `field_label`, `field_type`, `column_position`, `display_order`, `is_visible`, `is_locked`.
3. **When creating a new table with a detail page**, seed all its user-facing columns into `field_configurations` as a new module. Also register the module in `FieldManagerView.tsx` (MODULES array, MODULE_LABELS, MODULE_TABLE_LABELS) and the `create-field` edge function (MODULE_TO_TABLE mapping).
4. **System/internal columns are excluded** — `id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, and foreign key IDs (e.g., `borrower_id`, `fund_id`) do not belong in the Field Manager.
5. **Formula fields** (calculated from other fields) use `field_type: 'formula'` with `formula_expression` and `formula_source_fields` — no DB column is created for these.
6. **The audit doc** at `docs/field-manager-audit.md` tracks coverage. Update it when adding new modules or closing gaps.

### Module-to-Table Mapping (25 modules)

| Module | DB Table | Module | DB Table |
|--------|----------|--------|----------|
| loan_details | loans | borrower_entity_detail | borrower_entities |
| property | loans | investing_entity | investing_entities |
| borrower_entity | loans | investor_commitment | investor_commitments |
| loans_extended | loans | capital_call | capital_calls |
| servicing_loan | servicing_loans | distribution | distributions |
| fund_details | funds | draw_request | draw_requests |
| opportunity | opportunities | payoff_statement | payoff_statements |
| standalone_property | properties | wire_instructions | company_wire_instructions |
| company_info | companies | crm_activity | crm_activities |
| borrower_profile | borrowers | equity_underwriting | equity_underwriting |
| investor_profile | investors | equity_deal | equity_deals |
| contact_profile | crm_contacts | equity_property | equity_properties |
| | | equity_notes | equity_deals |

### Key Files

- **UI**: `apps/requity-os/app/(authenticated)/control-center/field-manager/FieldManagerView.tsx`
- **Server actions**: `apps/requity-os/app/(authenticated)/control-center/field-manager/actions.ts`
- **Hook**: `apps/requity-os/hooks/useFieldConfigurations.ts`
- **Edge function**: `packages/db/supabase/functions/create-field/index.ts`
- **Seed migrations**: `packages/db/supabase/migrations/20260306200000_create_field_configurations.sql` and subsequent

---

## Development Discipline

These rules exist to prevent multi-round debugging cycles. Follow them strictly.

### Read Before Write
1. **Never modify a file you haven't read in this session.** Always `Read` the file first — understand the current code, its imports, its types, and how it connects to other files.
2. **Read adjacent files.** Before changing a component, read its parent (where it's rendered), its types/interfaces, and any server actions or hooks it uses. Changes that ignore context cause cascading errors.
3. **Check column names and types against the source of truth.** Before writing any Supabase query or form field, verify the exact column name in `apps/requity-os/lib/supabase/types.ts` — never guess.

### Change Small, Verify Often
4. **One logical change at a time.** Don't modify 8 files in a batch. Change one file (or a tightly coupled pair), then run `pnpm build` or `pnpm typecheck` to catch errors immediately — before moving to the next file.
5. **Run `pnpm --filter <app> typecheck` after every file edit.** This is a HARD GATE — do not proceed to the next file until the current file typechecks cleanly. Use the app-specific filter (e.g., `pnpm --filter @repo/requity-os typecheck`) for speed. Full `pnpm build` after completing a logical unit of work (2-3 files).
6. **If a build/type error appears, fix it before continuing.** Never pile more changes on top of a broken build. Stop, fix, verify, then resume.

### No Guessing
7. **If you're unsure how an existing pattern works, read an existing example first.** Find a similar component/page/action that already does what you need and follow that pattern exactly.
8. **If you're unsure about a Supabase table structure, query it via MCP** (`list_tables`, `execute_sql`) — don't assume column names or types.
9. **If a fix doesn't work on the first try, stop and re-read the actual error message and the actual code.** Don't apply speculative fixes. Diagnose first, then fix once.

### Scope Control
10. **Do exactly what was asked — nothing more.** Don't refactor surrounding code, add type annotations to untouched functions, or "improve" things that weren't requested. Extra changes create extra bugs.
11. **When fixing a bug, identify the root cause before changing code.** A symptom-level fix often just moves the bug somewhere else.

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
- ❌ Adding user-facing columns without a corresponding `field_configurations` row — every editable or displayed field must be in the Field Manager
- ❌ Writing production code before a failing test exists — TDD is not optional
- ❌ Claiming "done" without running verification commands and showing output — evidence before claims
- ❌ Attempting fixes without root cause investigation — no guess-and-check debugging
- ❌ Skipping the planning step for multi-file changes — propose your approach first

---

## Definition of Done

Before any PR is opened, confirm all nine:

1. ✅ `pnpm build` — zero errors, zero warnings
2. ✅ `pnpm lint` — passes clean
3. ✅ Tested — new/modified mutations have corresponding tests
4. ✅ Validated — all forms use Zod, all errors are handled
5. ✅ Matches design system — follows `DESIGN_SYSTEM.md`, no visual regressions
6. ✅ Manually verified — clicked every button, submitted every form, checked empty/loading/error/success states
7. ✅ Field Manager — any new user-facing columns have `field_configurations` rows; new tables have a registered module
8. ✅ TDD — every new function/mutation has a test that was written first and watched fail before the implementation existed
9. ✅ Verified with evidence — ran `pnpm build`, `pnpm lint`, `pnpm test` freshly and confirmed zero errors in the actual output (not from memory or a previous run)

---

## GitHub — PR Workflow

**CRITICAL: ALWAYS push the branch and create a pull request.**

```bash
git push -u origin <branch-name>
gh pr create --title "..." --body "..." --base main
```

If `gh` is not authenticated, provide: `https://github.com/RequityGit/borrwerportal/compare/main...<branch-name>`
