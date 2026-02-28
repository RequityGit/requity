# CLAUDE.md — Requity Group Portal

## Project Overview

Requity Group Unified Portal — a full-stack SaaS platform for lending/fintech with role-based access for admins, borrowers, and investors. Built with Next.js 14 (App Router), TypeScript, Supabase, and Tailwind CSS. Deployed on Netlify.

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

There is no test framework configured. No unit or integration tests exist.

## Tech Stack

- **Framework**: Next.js 14.2.21 with App Router
- **Language**: TypeScript 5.7 (strict mode)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with SSR support (`@supabase/ssr`)
- **Styling**: Tailwind CSS 3.4 with `class-variance-authority` and `tailwind-merge`
- **UI Components**: Radix UI primitives (headless) + custom components in `components/ui/`
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit
- **Deployment**: Netlify (`netlify.toml`)

## Environment Variables

Required in `.env` (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side only, for admin operations)
```

## Project Structure

```
app/                          # Next.js App Router pages
  (authenticated)/            # Protected routes (layout enforces auth)
    admin/                    # Admin dashboard, user/fund/loan management
    borrower/                 # Borrower portal (loans, draws, payments)
    investor/                 # Investor portal (funds, capital calls, distributions)
  api/                        # API routes (e.g. switch-role)
  auth/                       # OAuth callback routes
  login/                      # Login page
components/
  ui/                         # Reusable Radix-based UI primitives
  layout/                     # Sidebar, topbar, role-switcher
  shared/                     # Data table, file upload, KPI cards
  admin/                      # Admin-specific components
  borrower/                   # Borrower-specific components
  investor/                   # Investor-specific components
  operations/                 # Project/task management components
lib/
  supabase/                   # Supabase clients (client.ts, server.ts, admin.ts, middleware.ts)
  supabase/types.ts           # Generated Supabase TypeScript types
  utils.ts                    # General utilities (cn helper)
  constants.ts                # Business logic constants (loan stages, fund types, etc.)
  format.ts                   # Formatting utilities
supabase/
  migrations/                 # SQL migrations
  seed.sql                    # Database seed script
middleware.ts                 # Role-based route protection & redirects
```

## Architecture Patterns

- **Path alias**: `@/*` maps to the project root — use `@/components/...`, `@/lib/...`, etc.
- **Authentication**: Supabase session managed via middleware. Unauthenticated users redirect to `/login`. Roles managed via `user_roles` table with `app_role` enum; active role tracked via cookie.
- **Multi-role support**: Users can have multiple roles via `user_roles` table. Role switching uses the `/api/switch-role` endpoint and `active_role` cookie. Helper functions: `is_admin()`, `is_super_admin()`, `has_role()`, `my_borrower_ids()`, `my_investor_ids()`.
- **Route groups**: `(authenticated)` layout wraps all protected pages; role-specific subdirectories enforce access.
- **Server components by default**: Use `"use client"` directive only when needed for interactivity.
- **Supabase clients**: Use `createClient()` from `lib/supabase/client.ts` in client components, `createServerClient()` from `lib/supabase/server.ts` in server components/actions, and `createAdminClient()` for service-role operations.

### Server Actions Pattern

Server actions live in `actions.ts` files colocated with their page (e.g., `app/(authenticated)/admin/borrowers/new/actions.ts`). They follow this pattern:

1. Start with `"use server"` directive
2. Verify auth with `requireAdmin()` helper (checks user session + role)
3. Use admin client (`createAdminClient()`) for write operations that bypass RLS
4. Return `{ success: true, ... }` or `{ error: string }` objects
5. Wrap in try/catch with console.error logging

## Code Style

- TypeScript strict mode — avoid `any` types
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Components use Radix UI primitives wrapped in `components/ui/`; prefer composing existing UI components
- Forms use React Hook Form with Zod schemas for validation
- Follow existing naming conventions: PascalCase for components, camelCase for utilities, kebab-case for files

## Database

- Supabase PostgreSQL with Row Level Security (RLS) enabled on all tables
- Migrations are applied via Supabase MCP — create new timestamped migration files for schema changes
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Core Tables (28 tables)

**Auth & Identity:**
- `profiles` — User identity (FK → auth.users), stores role, allowed_roles, activation_status
- `user_roles` — Maps users to app_role enum (super_admin, admin, investor, borrower) with optional links to investors/borrowers
- `members` — Legacy team member table (likely to be removed)

**Lending / Loan Pipeline:**
- `borrowers` — Borrower contact/credit info (FK user_id → auth.users)
- `borrower_entities` — LLC/trust entities (FK → borrowers)
- `loans` — 100-column loan table with full property, financial, fee, date, and team assignment fields
- `loan_condition_templates` — Master checklist of 123 conditions by loan type
- `loan_conditions` — Per-loan condition tracking with status workflow
- `loan_documents` — File metadata linked to loans and conditions
- `loan_draws` — Rehab draw requests
- `loan_payments` — Payment ledger
- `loan_activity_log` — Audit trail for loan events

**Investor Portal:**
- `investors` — Investor contact/accreditation info (FK user_id → auth.users)
- `investing_entities` — LLC/trust entities for investing (FK → investors)
- `funds` — Fund definitions (type, target size, strategy, fees, status)
- `investor_commitments` — Capital commitments per investor per fund (with computed unfunded_amount)
- `capital_calls` — Capital call notices per fund
- `capital_call_line_items` — Per-investor amounts for each capital call
- `distributions` — Distribution notices per fund
- `distribution_line_items` — Per-investor amounts for each distribution

**Operations / Project Management:**
- `ops_projects` — Internal project tracker
- `ops_project_notes` / `ops_project_comments` — Notes and comments on projects
- `ops_tasks` — Task manager with recurring tasks and sub-task hierarchy
- `ops_task_comments` — Comments on tasks

**CRM:**
- `crm_contacts` — Contact/lead management with cross-links to borrowers/investors/loans
- `crm_activities` — Activity log per CRM contact

**Meta:**
- `form_field_registry` — Tracks form-to-database column mappings for validation

### Custom Enums

| Enum | Values |
|------|--------|
| `app_role` | super_admin, admin, investor, borrower |
| `loan_type` | commercial, dscr, guc, rtl, transactional |
| `loan_status` | lead, application, processing, underwriting, approved, clear_to_close, funded, servicing, payoff, default, note_sold, withdrawn, denied, reo, paid_off |
| `loan_purpose` | purchase, refinance, cash_out_refinance |
| `property_type` | sfr, condo, townhouse, duplex, triplex, fourplex, multifamily_5_plus, mixed_use, retail, office, industrial, mobile_home_park, land, other |
| `condition_category` | borrower_documents, non_us_citizen, entity_documents, deal_level_items, appraisal_request, title_fraud_protection, lender_package, insurance_request, title_request, fundraising, closing_prep, post_closing_items, note_sell_process, post_loan_payoff, prior_to_approval, prior_to_funding |
| `condition_stage` | processing, closed_onboarding, note_sell_process, post_loan_payoff |
| `condition_status` | pending, submitted, under_review, approved, waived, not_applicable, rejected |
| `crm_contact_type` | lead, prospect, borrower, investor, vendor, partner, referral, other |
| `crm_contact_source` | website, referral, cold_call, email_campaign, social_media, event, paid_ad, organic, broker, repeat_client, other |
| `crm_contact_status` | active, inactive, converted, lost, do_not_contact |

### Views

| View | Purpose |
|------|---------|
| `loan_pipeline` | Denormalized loan view with borrower name, entity, address, condition counts |
| `borrowers_safe` / `borrowers_portal` | Masks SSN and DOB for non-super-admins |
| `investing_entities_portal` | Masks EIN for non-super-admins |
| `crm_contacts_active` | Filters soft-deleted contacts |

### Row Level Security (RLS)

All tables have RLS enabled. General pattern:
- **Admins** (`is_admin()`) have full CRUD on all tables
- **Super admins** (`is_super_admin()`) can manage user_roles
- **Borrowers** can view/update own records, view own loans/conditions/documents/draws/payments, submit loan applications, submit draw requests, upload documents
- **Investors** can view own records, view funds they're committed to, view own commitments/capital calls/distributions
- **Storage**: Two buckets (`investor-documents`, `loan-documents`) with folder-based RLS (`{entity_id}/{filename}`)

### Database Helper Functions

| Function | Purpose |
|----------|---------|
| `is_admin()` | Returns true if current user has admin or super_admin role |
| `is_super_admin()` | Returns true if current user has super_admin role |
| `has_role(check_role)` | Check if current user has a specific app_role |
| `my_borrower_ids()` | Returns set of borrower_ids linked to current user |
| `my_investor_ids()` | Returns set of investor_ids linked to current user |
| `get_my_roles()` | Returns table of current user's active roles with display names |
| `get_portal_context()` | Returns jsonb with user_id, roles, permissions |
| `assign_role()` / `grant_role()` / `revoke_role()` | Role management (super_admin only) |
| `generate_loan_conditions(loan_id)` | Auto-generates conditions from templates based on loan type |

## Database Schema — Key Column Names

All column names below are the **actual database columns**. Always use these exact names in queries, inserts, and updates. The source of truth is `lib/supabase/types.ts`.

### loans (key columns)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| borrower_id | uuid (FK → borrowers) | |
| borrower_entity_id | uuid (FK → borrower_entities) | |
| loan_number | text (UNIQUE) | Auto-generated — never set on insert |
| type | loan_type (enum) | commercial, dscr, guc, rtl, transactional |
| purpose | loan_purpose (enum) | purchase, refinance, cash_out_refinance |
| stage | loan_status (enum) | **Primary pipeline column** — lead, application, processing, underwriting, approved, clear_to_close, funded, servicing, payoff, default, reo, paid_off |
| status | loan_status (enum) | **Deprecated** — use `stage` instead |
| property_type | property_type (enum) | sfr, condo, townhouse, etc. |
| property_address | text | Flat address (convenience field) |
| property_address_line1..property_zip | text | Structured address fields |
| loan_amount | numeric | |
| appraised_value | numeric | |
| ltv | numeric | Manually set (not auto-computed) |
| interest_rate | numeric | |
| loan_term_months | integer | |
| originator_id | uuid (FK → profiles) | |
| processor_id | uuid (FK → profiles) | |
| underwriter_id | uuid (FK → profiles) | |
| closer_id | uuid (FK → profiles) | |
| priority | text | normal, hot, on_hold |
| stage_updated_at | timestamptz | Auto-set |
| stage_history | jsonb | Default '[]' |
| deleted_at | timestamptz | Soft delete — filter with `.is("deleted_at", null)` |

### funds (key columns)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| name | text | Required |
| fund_type | text | debt, equity, hybrid |
| status | text | fundraising, open, closed, fully_deployed, winding_down, terminated |
| target_size | numeric | |
| current_size | numeric | Default 0 |
| vintage_year | integer | |
| preferred_return_pct | numeric | |
| carry_pct | numeric | |
| management_fee_pct | numeric | |
| deleted_at | timestamptz | Soft delete |

### investor_commitments (key columns)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| fund_id | uuid (FK → funds) | Required |
| investor_id | uuid (FK → investors) | Required |
| entity_id | uuid (FK → investing_entities) | Optional |
| commitment_amount | numeric | Required |
| funded_amount | numeric | Default 0 |
| unfunded_amount | numeric | **Generated column** — auto-computed as commitment_amount - funded_amount |
| status | text | active, suspended, fully_funded, redeemed |

### Common Misnomers to Avoid

| WRONG name | CORRECT column |
|------------|----------------|
| `loan_type` | `type` (enum column, not text) |
| `term_months` | `loan_term_months` |
| `rate` | `interest_rate` |
| `address` | `property_address` or `property_address_line1` |
| `status` (on loans) | `stage` (use stage for pipeline tracking) |

### Rules for Database Code

1. **Always use typed Supabase client.** The clients in `lib/supabase/` are already parameterized with `Database` from the types file.
2. **Never guess column names.** If unsure, check `lib/supabase/types.ts`.
3. **`unfunded_amount` on investor_commitments is a generated column** — never set it directly.
4. **`loan_number` is auto-generated** — never set it on insert.
5. **`updated_at` has a trigger** — but it's fine to explicitly set it when you need a specific timestamp.
6. **Soft deletes** — filter with `.is("deleted_at", null)` on loan and fund queries.
7. **Use `stage` not `status`** for loan pipeline tracking. The `status` column is deprecated.
8. **RLS performance** — In RLS policies, always wrap `auth.uid()` in a subselect: `(select auth.uid())` to avoid per-row evaluation.

## Important Notes

- The `@/` path alias is used everywhere — always use it for imports
- No test framework is configured; run `npm run lint` to check for issues
- The project deploys to Netlify using `@netlify/plugin-nextjs`
- Supabase migrations are applied via MCP and tracked in the database
- The authenticated layout sets `dynamic = "force-dynamic"` to prevent static generation
- When creating new pages, follow existing patterns: server component with data fetching, use `PageHeader`, `KpiCard`, shared components
- Server actions should always verify authentication and admin role before performing mutations
- All financial amounts use `formatCurrency()` or `formatCurrencyDetailed()` from `lib/format.ts`
- Storage buckets: `loan-documents` (structure: `{loan_id}/{filename}`) and `investor-documents` (structure: `{investor_id}/{filename}`)
