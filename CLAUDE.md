# Requity Group Borrower Portal — Claude Session Guide

## Session Startup Checklist

Before writing **any** database code each session:
1. Read this file (`CLAUDE.md`)
2. Read `src/types/supabase.ts` (the generated types)
3. After any migration, regenerate types:
   ```bash
   npx supabase gen types typescript --project-id edhlkknvlczhbowasjna > src/types/supabase.ts
   ```

## Project Overview

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with RLS
- **Styling:** Tailwind CSS + shadcn/ui
- **Roles:** admin, borrower, investor

## Database Schema — Canonical Column Names

All column names below are the **actual database columns**. Always use these
exact names in queries, inserts, and updates. The source of truth is
`src/types/supabase.ts`.

### loans

| Column               | Type                   | Notes                              |
|----------------------|------------------------|------------------------------------|
| id                   | uuid (PK)              | Auto-generated                     |
| borrower_id          | uuid (FK → profiles)   | Required                           |
| loan_number          | text                   | Auto-generated sequence `LN-XXXX`  |
| loan_type            | text                   | bridge_residential, bridge_commercial, fix_and_flip, ground_up, stabilized, dscr, other |
| property_address     | text                   |                                    |
| property_city        | text                   |                                    |
| property_state       | text                   |                                    |
| property_zip         | text                   |                                    |
| loan_amount          | numeric                | Required                           |
| appraised_value      | numeric                |                                    |
| ltv                  | numeric                | Generated column (loan_amount / appraised_value) |
| interest_rate        | numeric                |                                    |
| term_months          | int                    |                                    |
| origination_date     | date                   |                                    |
| maturity_date        | date                   |                                    |
| stage                | text                   | lead, application, processing, underwriting, approved, clear_to_close, funded, servicing, payoff, default, reo, paid_off |
| stage_updated_at     | timestamptz            |                                    |
| originator           | text                   | Legacy name field                  |
| notes                | text                   |                                    |
| created_at           | timestamptz            |                                    |
| updated_at           | timestamptz            | Auto-set by trigger                |
| processor_id         | uuid (FK → profiles)   |                                    |
| underwriter_id       | uuid (FK → profiles)   |                                    |
| closer_id            | uuid (FK → profiles)   |                                    |
| originator_id        | uuid (FK → profiles)   |                                    |
| priority             | text                   | hot, normal, on_hold               |
| next_action          | text                   |                                    |
| expected_close_date  | date                   |                                    |
| purchase_price       | numeric                |                                    |
| arv                  | numeric                | After-Repair Value                 |
| points               | numeric                |                                    |
| origination_fee      | numeric                |                                    |
| extension_options    | text                   |                                    |
| prepayment_terms     | text                   |                                    |
| application_date     | date                   |                                    |
| approval_date        | date                   |                                    |
| actual_close_date    | date                   |                                    |
| deleted_at           | timestamptz            | Soft delete                        |

### Common Misnomers to Avoid

| WRONG name        | CORRECT column   |
|-------------------|------------------|
| `type`            | `loan_type`      |
| `loan_term_months`| `term_months`    |
| `rate`            | `interest_rate`  |
| `address`         | `property_address` |
| `status`          | `stage`          |

### profiles

| Column            | Type     | Notes                                  |
|-------------------|----------|----------------------------------------|
| id                | uuid (PK)| References auth.users                  |
| email             | text     | Required                               |
| full_name         | text     |                                        |
| company_name      | text     |                                        |
| phone             | text     |                                        |
| role              | text     | admin, borrower, investor              |
| allowed_roles     | text[]   |                                        |
| activation_status | text     | pending, link_sent, activated          |
| created_at        | timestamptz |                                     |
| updated_at        | timestamptz |                                     |

### borrowers

Dedicated borrower data table (separate from profiles).

| Column             | Type     |
|--------------------|----------|
| id                 | uuid (PK)|
| first_name         | text     |
| last_name          | text     |
| email              | text     |
| phone              | text     |
| address_line1      | text     |
| city, state, zip   | text     |
| credit_score       | int      |
| experience_count   | int      |

### Other Tables

- **borrower_entities** — LLC/Corp entities for borrowers
- **funds** — Investment funds
- **investor_commitments** — Investor commitment amounts per fund
- **capital_calls** — Capital call notices to investors
- **distributions** — Distributions paid to investors
- **draw_requests** — Borrower draw requests against loans
- **loan_payments** — Payment records for loans
- **documents** — Uploaded files (linked to loans, funds, etc.)
- **loan_activity_log** — Audit trail for loan changes
- **condition_templates** / **condition_template_items** — Reusable condition checklists
- **loan_conditions** — Per-loan condition tracking
- **loan_condition_documents** — Documents linked to conditions

## Rules for Database Code

1. **Always use typed Supabase client.** The clients in `lib/supabase/` are
   already parameterized with `Database` from the types file.
2. **Use `LoanInsert` / `LoanUpdate` types** when building insert/update
   payloads. This catches column name typos at compile time.
3. **Never guess column names.** If unsure, check `src/types/supabase.ts`.
4. **`ltv` is a generated column** — never set it directly. It auto-computes
   from `loan_amount / appraised_value`.
5. **`loan_number` is auto-generated** — never set it on insert.
6. **`updated_at` has a trigger** — but it's fine to explicitly set it
   when you need a specific timestamp.
7. **Soft deletes** — filter with `.is("deleted_at", null)` on loan queries.

## Architecture Notes

- `app/` — Next.js App Router pages and API routes
- `components/admin/` — Admin dashboard components
- `components/borrower/` — Borrower portal components
- `components/investor/` — Investor portal components
- `components/shared/` — Shared UI components
- `components/ui/` — shadcn/ui primitives
- `lib/supabase/` — Supabase client factories (client, server, admin, middleware)
- `lib/constants.ts` — Loan stages, types, priorities, and other enums
- `src/types/supabase.ts` — Generated Supabase types (source of truth)

## MCP Server

The Supabase MCP server is configured in `.mcp.json` for live database access.
To authenticate, run: `npx supabase login`

## Build & Lint

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript strict check (no emit)
```
