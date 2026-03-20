# Requity Group — Supabase Database Audit Report

**Date:** 2026-02-28
**Project:** edhlkknvlczhbowasjna (RequityGit's Project)
**Region:** us-east-2
**Postgres Version:** 17.6.1.063
**Status:** ACTIVE_HEALTHY

---

## Table of Contents

1. [Entity Relationship Summary](#1-entity-relationship-summary)
2. [Table-by-Table Breakdown](#2-table-by-table-breakdown)
3. [Custom Enums](#3-custom-enums)
4. [Views](#4-views)
5. [Functions](#5-functions)
6. [Triggers](#6-triggers)
7. [RLS Policies](#7-rls-policies)
8. [Indexes](#8-indexes)
9. [Edge Functions](#9-edge-functions)
10. [Storage](#10-storage)
11. [Auth Configuration](#11-auth-configuration)
12. [Security Advisories](#12-security-advisories)
13. [Performance Advisories](#13-performance-advisories)
14. [Gap Analysis — Loan Pipeline](#14-gap-analysis--loan-pipeline)
15. [Gap Analysis — Investor Portal](#15-gap-analysis--investor-portal)
16. [Gap Analysis — CRM/Internal Tools](#16-gap-analysis--crminernal-tools)
17. [Prioritized Recommendations](#17-prioritized-recommendations)

---

## 1. Entity Relationship Summary

The database is organized around **5 functional domains**:

### Auth & Identity
- **profiles** ← (id FK → auth.users) — Core user identity, stores role, allowed_roles, activation_status
- **user_roles** — Junction table mapping users to app_role enum (super_admin, admin, investor, borrower) with optional links to **investors** or **borrowers** records
- **members** — Legacy/standalone team member table (1 row, no FKs to auth.users — appears unused)

### Lending / Loan Pipeline
- **borrowers** ← (user_id FK → auth.users) — Borrower contact/credit info
- **borrower_entities** → borrowers — LLC/trust entities a borrower operates through
- **loans** → borrowers, borrower_entities, profiles (originator, processor, underwriter, closer)
- **loan_condition_templates** — Master checklist of 123 conditions by loan type
- **loan_conditions** → loans, loan_condition_templates — Per-loan condition tracking
- **loan_documents** → loans, loan_conditions — File metadata for uploaded docs
- **loan_draws** → loans — Rehab draw requests
- **loan_payments** → loans — Payment ledger
- **loan_activity_log** → loans — Audit trail

### Investor Module
- **investors** ← (user_id FK → auth.users) — Investor contact/accreditation info
- **investing_entities** → investors — LLC/trust entities for investing

### Operations / Project Management
- **ops_projects** → profiles (assigned_to, created_by) — Internal project tracker
- **ops_project_notes** → ops_projects, profiles
- **ops_project_comments** → ops_projects, profiles
- **ops_tasks** → ops_projects, profiles, ops_tasks (self-ref for sub-tasks) — Task manager with recurring task support
- **ops_task_comments** → ops_tasks, profiles

### CRM
- **crm_contacts** → profiles (assigned_to), borrowers, investors, loans — Contact/lead management
- **crm_activities** → crm_contacts, profiles — Activity log per contact

### Meta
- **form_field_registry** — Tracks form-to-database column mappings for validation

```
auth.users
  ├── profiles (1:1)
  ├── user_roles (1:many) ─→ investors, borrowers
  ├── borrowers.user_id
  └── investors.user_id

borrowers
  ├── borrower_entities (1:many)
  └── loans (1:many) ─→ loan_conditions ─→ loan_documents
                      ├── loan_draws
                      ├── loan_payments
                      └── loan_activity_log

investors
  └── investing_entities (1:many)

ops_projects
  ├── ops_project_notes (1:many)
  ├── ops_project_comments (1:many)
  └── ops_tasks (1:many) ─→ ops_task_comments
                          └── ops_tasks (sub-tasks, self-ref)

crm_contacts ─→ crm_activities (1:many)
```

---

## 2. Table-by-Table Breakdown

### 2.1 profiles (7 rows)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK, FK → auth.users) | No | — |
| created_at | timestamptz | Yes | now() |
| name | text | Yes | — |
| email | text | Yes | — |
| avatar_url | text | Yes | '' |
| location | text | Yes | — |
| role | text | Yes | 'user' |
| allowed_roles | text[] | Yes | ARRAY['investor'] |
| activation_status | text | Yes | 'activated' |
| full_name | text | Yes | — |
| company_name | text | Yes | — |
| phone | text | Yes | — |

### 2.2 user_roles (2 rows)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | No | gen_random_uuid() |
| user_id | uuid (FK → auth.users) | No | — |
| role | app_role (enum) | No | — |
| investor_id | uuid (FK → investors) | Yes | — |
| borrower_id | uuid (FK → borrowers) | Yes | — |
| granted_by | uuid (FK → auth.users) | Yes | — |
| granted_at | timestamptz | No | now() |
| is_active | boolean | No | true |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |

**Unique constraint:** (user_id, role, investor_id, borrower_id)

### 2.3 members (1 row) — LIKELY LEGACY
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | No | extensions.uuid_generate_v4() |
| created_at | timestamptz | No | now() |
| avatar_url | text | Yes | — |
| name | text | No | — |
| email | text | No | — |
| location | text | Yes | — |

### 2.4 borrowers (10 rows)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | No | gen_random_uuid() |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |
| first_name | text | No | — |
| last_name | text | No | — |
| email | text (UNIQUE) | Yes | — |
| phone | text | Yes | — |
| address_line1..zip | text | Yes | — |
| country | text | Yes | 'US' |
| ssn_last_four | text | Yes | — |
| date_of_birth | date | Yes | — |
| is_us_citizen | boolean | Yes | true |
| credit_score | integer | Yes | — |
| credit_report_date | date | Yes | — |
| experience_count | integer | Yes | 0 |
| notes | text | Yes | — |
| user_id | uuid (FK → auth.users) | Yes | — |

### 2.5 borrower_entities (0 rows)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | No | gen_random_uuid() |
| borrower_id | uuid (FK → borrowers) | No | — |
| entity_name | text | No | — |
| entity_type | text | No | — |
| ein | text | Yes | — |
| state_of_formation | text | Yes | — |
| address_line1..zip | text | Yes | — |
| country | text | Yes | 'US' |
| operating_agreement_url | text | Yes | — |
| articles_of_org_url | text | Yes | — |
| certificate_good_standing_url | text | Yes | — |
| ein_letter_url | text | Yes | — |
| is_foreign_filed | boolean | Yes | false |
| foreign_filed_states | text[] | Yes | — |
| notes | text | Yes | — |

### 2.6 investors (1 row)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | No | gen_random_uuid() |
| first_name | text | No | — |
| last_name | text | No | — |
| email | text (UNIQUE) | No | — |
| phone | text | Yes | — |
| address_line1..zip | text | Yes | — |
| country | text | Yes | 'US' |
| accreditation_status | text | No | 'pending' |
| accreditation_verified_at | timestamptz | Yes | — |
| notes | text | Yes | — |
| user_id | uuid (FK → auth.users) | Yes | — |

### 2.7 investing_entities (0 rows)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | No | gen_random_uuid() |
| investor_id | uuid (FK → investors) | No | — |
| entity_name | text | No | — |
| entity_type | text | No | — |
| ein | text | Yes | — |
| state_of_formation | text | Yes | — |
| address_line1..zip | text | Yes | — |
| operating_agreement_url | text | Yes | — |
| formation_doc_url | text | Yes | — |
| other_doc_urls | text[] | Yes | — |
| notes | text | Yes | — |

### 2.8 loans (1 row) — 100 COLUMNS
**Key columns:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | gen_random_uuid() |
| loan_number | text (UNIQUE) | Auto-generated |
| type | loan_type (enum) | commercial, dscr, guc, rtl, transactional |
| purpose | loan_purpose (enum) | purchase, refinance, cash_out_refinance |
| status | loan_status (enum) | Full pipeline stages |
| stage | loan_status (enum) | Duplicates status — default 'lead' |
| borrower_id | uuid (FK → borrowers) | — |
| borrower_entity_id | uuid (FK → borrower_entities) | — |
| originator_id | uuid (FK → profiles) | — |
| processor_id | uuid (FK → profiles) | — |
| underwriter_id | uuid (FK → profiles) | — |
| closer_id | uuid (FK → profiles) | — |
| property_type | property_type (enum) | — |
| property_address | text | Flat address field |
| property_address_line1..zip | text | Structured address fields |
| purchase_price / as_is_value / after_repair_value / appraised_value | numeric | — |
| loan_amount / rehab_budget / rehab_holdback / total_loan_amount | numeric | — |
| interest_rate / default_rate / origination_fee_pct / broker_fee_pct | numeric | — |
| loan_term_months / extension_term_months | integer | — |
| ltv / ltarv / dscr_ratio | numeric | — |
| application_date..payoff_date | date | Full date timeline |
| stage_updated_at | timestamptz | now() |
| stage_history | jsonb | '[]' |
| deleted_at | timestamptz | Soft delete |
| priority | text | 'normal' |
| notes / internal_notes | text | — |

### 2.9 loan_condition_templates (123 rows)
Master checklist definitions with `applies_to_commercial`, `applies_to_dscr`, `applies_to_guc`, `applies_to_rtl`, `applies_to_transactional` flags.

### 2.10 loan_conditions (102 rows)
Per-loan instances of conditions with status workflow (pending → submitted → under_review → approved/waived/rejected).

### 2.11 loan_documents (0 rows)
File metadata linking to loans and optionally to specific conditions.

### 2.12 loan_draws (0 rows)
Rehab draw tracking with inspection info and completion percentage.

### 2.13 loan_payments (0 rows)
Payment ledger with principal/interest/late fee breakdown.

### 2.14 loan_activity_log (1 row)
Audit log for loan-level events.

### 2.15 ops_projects (1 row)
Project tracking with status, priority, owner, description, due_date.

### 2.16 ops_project_notes (0 rows) & ops_project_comments (0 rows)
Notes and threaded comments on projects.

### 2.17 ops_tasks (5 rows)
Full task manager with recurring task support, sub-task hierarchy, and entity linking.

### 2.18 ops_task_comments (0 rows)
Comments on tasks.

### 2.19 crm_contacts (0 rows)
CRM leads/contacts with type, source, status, follow-up tracking, and cross-links to borrowers/investors/loans.

### 2.20 crm_activities (0 rows)
Activity log per CRM contact.

### 2.21 form_field_registry (43 rows)
Meta-table tracking form input → database column mappings.

---

## 3. Custom Enums

| Enum Name | Values |
|-----------|--------|
| **app_role** | super_admin, admin, investor, borrower |
| **loan_type** | commercial, dscr, guc, rtl, transactional |
| **loan_status** | lead, application, processing, underwriting, approved, clear_to_close, funded, servicing, payoff, default, note_sold, withdrawn, denied |
| **loan_purpose** | purchase, refinance, cash_out_refinance |
| **property_type** | sfr, condo, townhouse, duplex, triplex, fourplex, multifamily_5_plus, mixed_use, retail, office, industrial, mobile_home_park, land, other |
| **condition_category** | borrower_documents, non_us_citizen, entity_documents, deal_level_items, appraisal_request, title_fraud_protection, lender_package, insurance_request, title_request, fundraising, closing_prep, post_closing_items, note_sell_process, post_loan_payoff, prior_to_approval, prior_to_funding |
| **condition_stage** | processing, closed_onboarding, note_sell_process, post_loan_payoff |
| **condition_status** | pending, submitted, under_review, approved, waived, not_applicable, rejected |
| **crm_contact_type** | lead, prospect, borrower, investor, vendor, partner, referral, other |
| **crm_contact_source** | website, referral, cold_call, email_campaign, social_media, event, paid_ad, organic, broker, repeat_client, other |
| **crm_contact_status** | active, inactive, converted, lost, do_not_contact |

---

## 4. Views

| View | Purpose |
|------|---------|
| **borrowers_safe** | Masks SSN and DOB for non-super-admins |
| **borrowers_portal** | Same masking + includes user_id for portal access |
| **investing_entities_portal** | Masks EIN for non-super-admins |
| **crm_contacts_active** | Filters soft-deleted contacts (WHERE deleted_at IS NULL). **WARNING: SECURITY DEFINER** — runs as view owner, bypasses RLS |
| **loan_pipeline** | Denormalized loan view with borrower name, entity name, full address, and condition counts (pending/approved/total) |

---

## 5. Functions (21 total)

### Role/Auth Functions
| Function | Purpose |
|----------|---------|
| `is_admin()` | Returns true if current user has admin or super_admin role |
| `is_super_admin()` | Returns true if current user has super_admin role |
| `has_role(check_role)` | Check if current user has a specific role |
| `my_borrower_ids()` | Returns set of borrower_ids linked to current user |
| `my_investor_ids()` | Returns set of investor_ids linked to current user |
| `get_my_roles()` | Returns table of current user's active roles with display names |
| `get_portal_context()` | Returns jsonb with user_id, roles, is_admin, is_super_admin |
| `assign_role(...)` | Super-admin only role assignment (SECURITY DEFINER) |
| `grant_role(...)` | Similar to assign_role, allows first super_admin bootstrap |
| `revoke_role(...)` | Super-admin only role deactivation |

### Loan Functions
| Function | Purpose |
|----------|---------|
| `generate_loan_conditions(p_loan_id)` | Auto-generates conditions from templates based on loan type. **MISSING search_path** |
| `trigger_generate_conditions()` | Trigger wrapper for above. **MISSING search_path** |

### Timestamp/Utility Functions
| Function | Purpose |
|----------|---------|
| `handle_updated_at()` | Generic updated_at trigger. **MISSING search_path** |
| `set_updated_at()` | Duplicate of above (with search_path set) |
| `update_updated_at()` | Another duplicate (with search_path set) |
| `update_crm_contacts_updated_at()` | CRM-specific version |
| `update_ops_task_timestamp()` | Ops task version |
| `update_project_timestamp()` | Project version |
| `update_project_on_note()` | Updates project's latest_update when note is added |
| `handle_recurring_task_completion()` | Creates next occurrence when recurring task is completed. **MISSING search_path** |
| `pgrst_watch()` | PostgREST schema reload notification |

---

## 6. Triggers

| Table | Trigger | Event | Action |
|-------|---------|-------|--------|
| borrower_entities | set_updated_at | BEFORE UPDATE | handle_updated_at() |
| borrower_entities | tr_borrower_entities_updated_at | BEFORE UPDATE | update_updated_at() |
| borrowers | set_updated_at | BEFORE UPDATE | handle_updated_at() |
| borrowers | tr_borrowers_updated_at | BEFORE UPDATE | update_updated_at() |
| crm_contacts | set_updated_at | BEFORE UPDATE | handle_updated_at() |
| investing_entities | set_updated_at | BEFORE UPDATE | handle_updated_at() |
| investing_entities | trg_investing_entities_updated_at | BEFORE UPDATE | set_updated_at() |
| investors | set_updated_at | BEFORE UPDATE | handle_updated_at() |
| investors | trg_investors_updated_at | BEFORE UPDATE | set_updated_at() |
| loan_condition_templates | set_updated_at + tr_ | BEFORE UPDATE | 2 duplicate triggers |
| loan_conditions | set_updated_at + tr_ | BEFORE UPDATE | 2 duplicate triggers |
| loan_draws | set_updated_at + tr_ | BEFORE UPDATE | 2 duplicate triggers |
| loans | set_updated_at | BEFORE UPDATE | handle_updated_at() |
| loans | tr_loans_updated_at | BEFORE UPDATE | update_updated_at() |
| **loans** | **tr_loans_auto_conditions** | **AFTER INSERT** | **trigger_generate_conditions()** |
| ops_project_notes | trigger_update_project_on_note | AFTER INSERT | update_project_on_note() |
| ops_projects | set_updated_at + tr_ + trigger_ | BEFORE UPDATE | **3 duplicate triggers!** |
| ops_tasks | set_updated_at + tr_ + trigger_ | BEFORE UPDATE | 3 triggers + recurring task handler |
| ops_tasks | trigger_recurring_task_completion | BEFORE UPDATE | handle_recurring_task_completion() |
| user_roles | set_updated_at + user_roles_updated_at | BEFORE UPDATE | Both call handle_updated_at() |

**Issue: Duplicate updated_at triggers** — Most tables have 2-3 triggers doing the same thing (updating `updated_at`). These are harmless but wasteful.

---

## 7. RLS Policies

All 22 tables have RLS **enabled**. Policy summary:

| Table | Policies |
|-------|----------|
| **profiles** | Users: read/insert/update own. Admins: read all. **No admin write** (uses service role) |
| **user_roles** | Users: read own. Admins: read all. Super admins: insert/update/delete |
| **members** | Admins: ALL. **No user-level access** |
| **borrowers** | Admins: ALL. Borrowers: read own (via `my_borrower_ids()`) |
| **borrower_entities** | Admins: ALL. Borrowers: read own entities |
| **investors** | Admins: ALL. Investors: read own (via `my_investor_ids()`) |
| **investing_entities** | Admins: ALL. Investors: read own entities |
| **loans** | Admins: ALL. Borrowers: read own |
| **loan_conditions** | Admins: ALL. Borrowers: read + update own |
| **loan_documents** | Admins: ALL. Borrowers: read + insert own |
| **loan_draws** | Admins: ALL. Borrowers: read own |
| **loan_payments** | Admins: ALL. Borrowers: read own |
| **loan_activity_log** | Admins: ALL |
| **loan_condition_templates** | Admins: ALL. Authenticated: read |
| **ops_projects** | Admins: ALL. Authenticated: read |
| **ops_project_notes** | Admins: ALL. Authenticated: read |
| **ops_project_comments** | Admins: ALL. Authenticated: read. Users: insert own |
| **ops_tasks** | Admins: ALL. Authenticated: read |
| **ops_task_comments** | Admins: ALL. Authenticated: read. Users: insert own |
| **crm_contacts** | Admins: full CRUD (separate policies per operation) |
| **crm_activities** | Admins: ALL |
| **form_field_registry** | Admins: ALL (checks profiles.role = 'admin') |

### RLS Issues
1. **Inconsistent admin checks** — Some policies use `is_admin()` function (user_roles-based), others check `profiles.role = 'admin'` (older pattern). These can diverge.
2. **loan_activity_log** — No borrower read access. Borrowers cannot see activity on their own loans.
3. **crm_contacts_active view** — Defined as SECURITY DEFINER, bypasses RLS for the querying user.
4. **No investor policies on loan-related tables** — Investors who fund loans have no visibility into loan data.

---

## 8. Indexes

**77 total indexes** across all tables. Well-indexed overall.

### Notable indexes on loans:
- `idx_loans_borrower`, `idx_loans_borrower_id` (duplicate)
- `idx_loans_status`, `idx_loans_type`, `idx_loans_priority`
- `idx_loans_originator_id`, `idx_loans_processor_id`, `idx_loans_underwriter_id`, `idx_loans_closer_id`
- `idx_loans_closing_date`, `idx_loans_expected_close_date`
- `loans_loan_number_key` (unique)

### Missing indexes flagged by Supabase:
- `crm_activities.performed_by` (FK, no index)
- `crm_contacts.linked_borrower_id` (FK, no index)
- `crm_contacts.linked_investor_id` (FK, no index)
- `crm_contacts.linked_loan_id` (FK, no index)
- `loan_conditions.template_id` (FK, no index)
- `loan_documents.condition_id` (FK, no index)
- `loans.borrower_entity_id` (FK, no index)
- `ops_project_comments.author_id` (FK, no index)
- `ops_project_notes.author_id` (FK, no index)
- `ops_projects.assigned_to` (FK, no index)
- `ops_projects.created_by` (FK, no index)
- `ops_task_comments.author_id` (FK, no index)
- `ops_tasks.created_by` (FK, no index)
- `user_roles.granted_by` (FK, no index)

### Duplicate indexes:
- `idx_loans_borrower` and `idx_loans_borrower_id` (same column)
- `idx_loan_conditions_loan` and `idx_loan_conditions_loan_id` (same column)
- `idx_loan_documents_loan` and `idx_loan_documents_loan_id` (same column)

---

## 9. Edge Functions

**None deployed.** The project has zero edge functions.

---

## 10. Storage

**No storage buckets exist.** Despite the CLAUDE.md mentioning `investor-documents` and `loan-documents` buckets, they have not been created. No storage policies exist.

---

## 11. Auth Configuration

- **Provider:** Email only (no OAuth providers like Google, GitHub, etc.)
- **Users:** 16 auth.users accounts (only 2 have ever signed in — emails redacted to avoid secret exposure in build)
- **Leaked password protection:** DISABLED (Supabase security advisory)
- **No custom auth hooks detected**
- **Many test accounts** with gibberish emails that should be cleaned up

---

## 12. Security Advisories

| Level | Issue | Detail |
|-------|-------|--------|
| **ERROR** | Security Definer View | `crm_contacts_active` view uses SECURITY DEFINER — bypasses querying user's RLS |
| **WARN** | Function Search Path Mutable | `trigger_generate_conditions`, `generate_loan_conditions`, `handle_recurring_task_completion`, `handle_updated_at` — search_path not set |
| **WARN** | Leaked Password Protection | Disabled — enable HaveIBeenPwned check |
| **WARN** | auth_rls_initplan | 22 RLS policies re-evaluate `auth.uid()` per row instead of using `(select auth.uid())` pattern for better performance |

---

## 13. Performance Advisories

### Unindexed Foreign Keys (14 total)
See Section 8 for the complete list. These cause sequential scans on JOINs and CASCADE deletes.

### RLS InitPlan Warnings (22 policies)
Many policies use `auth.uid()` directly instead of wrapping in a subselect `(select auth.uid())`. This causes the function to be re-evaluated per row instead of once per query.

### Duplicate/Unused Indexes
Many indexes have never been used (project is new), but there are legitimate duplicates that should be consolidated.

---

## 14. Gap Analysis — Loan Pipeline

### What EXISTS and works well:
- Full borrower + entity management
- Rich loan table with 100 columns covering property, financials, fees, dates, team assignments
- Condition template system (123 templates) with auto-generation on loan creation
- Condition workflow (pending → submitted → under_review → approved/waived/rejected)
- Loan documents table linked to conditions
- Draw and payment tracking
- Activity log
- Pipeline view with aggregated condition counts
- Proper enums for loan_type, loan_status, property_type, etc.

### MISSING for complete loan pipeline:

#### A. Schema Gaps
1. **`status` vs `stage` duplication** — The `loans` table has BOTH a `status` column (loan_status enum) and a `stage` column (also loan_status enum, default 'lead'). These are redundant and confusing. The CLAUDE.md says to use `stage`, but the `loan_pipeline` view uses `status`. Need to consolidate.

2. **No `funds` table** — CLAUDE.md references `funds` but it doesn't exist. No way to track which fund a loan is allocated to.

3. **No `draw_requests` table** — CLAUDE.md references `draw_requests` but the actual table is `loan_draws`.

4. **No `documents` table** — CLAUDE.md references a generic `documents` table but the actual table is `loan_documents`.

5. **Missing loan_number auto-generation** — CLAUDE.md says loan_number is auto-generated, but there's no trigger or function for this. The column is nullable with no default.

6. **No guarantor tracking** — Bridge loans often require personal guarantees. No guarantor table or fields.

7. **No property insurance tracking table** — Only fields for insurance agent contact on the loan itself. No policy tracking.

8. **No appraisal table** — Appraisal data is inline on the loan (appraised_value, as_is_value, after_repair_value) but there's no dedicated table to track multiple appraisals, appraisal orders, or appraisal management company info.

9. **No title/escrow tracking table** — Title company info is on the loan, but no table to track title commitments, title exceptions, title policy numbers, escrow balances.

10. **No wire/disbursement table** — No way to track closing disbursements, wire instructions, or funding breakdowns.

11. **No email/notification log** — No table to track automated emails sent to borrowers.

12. **Missing loan_type values** — The enum has (commercial, dscr, guc, rtl, transactional) but CLAUDE.md says (bridge_residential, bridge_commercial, fix_and_flip, ground_up, stabilized, dscr, other). These don't match.

13. **Missing loan_status values** — The CLAUDE.md mentions `reo` and `paid_off` stages, but the enum has `note_sold`, `withdrawn`, `denied` instead. Inconsistency.

#### B. Borrower Portal Gaps
1. **No borrower self-service application** — Borrowers can view loans but cannot INSERT loans (no RLS policy for borrower insert on loans)
2. **No document upload storage** — Storage buckets don't exist, so borrower document upload has no destination
3. **No borrower notification preferences** — No way to track email/SMS preferences
4. **No borrower draw request INSERT** — RLS only allows borrowers to VIEW draws, not submit new draw requests

#### C. Missing RLS
1. Borrowers cannot see `loan_activity_log` for their own loans
2. No investor visibility into any loan tables (needed for investor-funded loans)

---

## 15. Gap Analysis — Investor Portal

### What EXISTS:
- Basic investor contact/accreditation info
- Investing entities with document URLs
- Portal view masking sensitive EIN data
- Role-based access via user_roles

### CRITICALLY MISSING — Almost everything for a functional investor portal:

| Missing | Description |
|---------|-------------|
| **funds** | No table for fund definitions (name, type, target size, vintage year, strategy, status) |
| **investor_commitments** | CLAUDE.md references this but it doesn't exist. No way to track capital commitments per investor per fund |
| **capital_calls** | CLAUDE.md references this but it doesn't exist. No way to issue or track capital calls |
| **distributions** | CLAUDE.md references this but it doesn't exist. No way to track distributions to investors |
| **capital_accounts** | No running capital account balance tracking (contributions, distributions, fees, gains/losses) |
| **fund_loans** | No link between funds and loans they've invested in |
| **investor_documents** | No investor-specific document storage or tracking (K-1s, statements, subscription docs) |
| **fund_reports** | No quarterly/annual reporting infrastructure |
| **investor_communications** | No investor letter/notice tracking |
| **NAV calculations** | No way to track fund NAV, per-share NAV, or valuation history |
| **Waterfall calculations** | No preferred return, catch-up, or profit split tracking |
| **Subscription agreements** | No table to track subscription docs, side letters |
| **Wire instructions** | No investor bank/wire info for distributions |
| **Tax documents** | No K-1 or tax document tracking |

### Missing Storage
- `investor-documents` bucket referenced in CLAUDE.md does not exist
- No investor-facing document access at all

### Missing RLS
- Investors have NO read access to any fund/loan data — only their own investor record and entities

---

## 16. Gap Analysis — CRM/Internal Tools

### What EXISTS:
- CRM contacts with type, source, status, follow-up tracking
- CRM activities log
- Cross-linking to borrowers, investors, and loans
- Ops projects and tasks with recurring task support
- Task sub-tasks (parent_task_id self-reference)
- Task entity linking (can link tasks to any entity type)
- Task and project comments

### MISSING:

| Missing | Description |
|---------|-------------|
| **Deal/opportunity tracking** | No pipeline stages for CRM deals (separate from loan pipeline). CRM contacts can be linked to loans but there's no deal-level tracking before a loan is created |
| **Email integration** | No email log, templates, or campaign tracking |
| **Pipeline analytics tables** | No tables for conversion rates, pipeline velocity, or stage duration tracking |
| **Team performance tracking** | No originator scorecards, processor workload tracking |
| **Vendor management** | crm_contact_type includes 'vendor' but no vendor-specific tables (title companies, appraisers, insurance agents, attorneys) |
| **Calendar/scheduling** | No meeting or appointment tracking |
| **Notifications/alerts** | No notification queue or user preferences |
| **File attachments on tasks/projects** | No document linking for ops_tasks or ops_projects |
| **Task templates** | No way to create task templates (e.g., "new loan checklist" auto-creates tasks) |
| **Workflow automation rules** | No rules engine for "when loan reaches stage X, create task Y" |
| **Audit/change log** | loan_activity_log exists for loans, but no equivalent for CRM contacts, tasks, or projects |

---

## 17. Prioritized Recommendations

### P0 — Critical / Fix Now

1. **Fix `crm_contacts_active` SECURITY DEFINER view** — Recreate without SECURITY DEFINER or add appropriate security checks. This is a real security vulnerability.

2. **Fix 4 functions with mutable search_path** — `trigger_generate_conditions`, `generate_loan_conditions`, `handle_recurring_task_completion`, `handle_updated_at`. Add `SET search_path = ''` to prevent search path exploitation.

3. **Enable leaked password protection** in Supabase Auth settings.

4. **Create storage buckets** — `loan-documents` and `investor-documents` with proper RLS policies. Document upload is currently broken.

5. **Resolve `status` vs `stage` duplication on loans** — Pick one (recommend `stage`), migrate data, drop the other, update the `loan_pipeline` view.

### P1 — High Priority / Loan Pipeline Completion

6. **Add missing FK indexes** (14 foreign keys without covering indexes) — Single migration.

7. **Remove duplicate indexes** (3 pairs of duplicates on loan_conditions, loan_documents, loans).

8. **Remove duplicate updated_at triggers** — Consolidate to one per table.

9. **Add loan_number auto-generation** — Trigger or function to generate sequential loan numbers on insert.

10. **Add borrower self-service RLS** — Allow borrowers to INSERT on `loans` (for application submission) and INSERT on `loan_draws` (for draw requests).

11. **Add borrower read access to `loan_activity_log`** — Match the pattern used on other loan tables.

12. **Fix RLS initplan performance** — Wrap `auth.uid()` in subselect `(select auth.uid())` across all 22 affected policies.

13. **Reconcile CLAUDE.md with actual schema** — The CLAUDE.md references tables and column names that don't match reality (loan_type vs type, term_months vs loan_term_months, stage values don't match enum). Update CLAUDE.md to reflect actual database.

### P2 — Investor Portal (New Build)

14. **Create `funds` table** — id, name, fund_type, target_size, current_size, vintage_year, strategy, status, close_date, term_years, etc.

15. **Create `investor_commitments` table** — investor_id, fund_id, entity_id, commitment_amount, funded_amount, unfunded_amount, effective_date, status.

16. **Create `capital_calls` table** — fund_id, call_number, call_date, due_date, total_amount, status, document_url.

17. **Create `capital_call_line_items` table** — capital_call_id, investor_commitment_id, amount, status, paid_date.

18. **Create `distributions` table** — fund_id, distribution_date, total_amount, type (return_of_capital, income, gain), status, document_url.

19. **Create `distribution_line_items` table** — distribution_id, investor_commitment_id, amount, type.

20. **Create investor-specific RLS policies** — Investors should see their own commitments, capital calls, and distributions.

21. **Create `investor-documents` storage bucket** with folder-based RLS.

### P3 — CRM & Internal Tools Enhancement

22. **Add workflow automation** — Create a `workflow_rules` table to automate task creation on loan stage changes.

23. **Add email/notification queue** — `notifications` table for in-app + email notifications.

24. **Add vendor management tables** — Dedicated tables for title companies, appraisers, insurance agents with contact info and assignment tracking.

25. **Add deal/opportunity tracking** — Pre-loan pipeline for CRM leads before they become formal loan applications.

### P4 — Cleanup & Maintenance

26. **Remove `members` table** — Appears to be a legacy table (1 row, no FK to auth.users, no RLS for non-admins).

27. **Clean up test auth.users accounts** — 14 of 16 accounts appear to be test data with gibberish emails and no sign-ins.

28. **Consolidate duplicate timestamp functions** — `handle_updated_at`, `set_updated_at`, `update_updated_at`, `update_crm_contacts_updated_at`, `update_ops_task_timestamp`, `update_project_timestamp` all do the same thing. Keep one.

29. **Standardize RLS admin check pattern** — Some use `is_admin()`, others check `profiles.role = 'admin'`. Standardize on `is_admin()` which uses the `user_roles` table.

---

## Appendix: Installed Extensions

| Extension | Schema | Version |
|-----------|--------|---------|
| pgcrypto | extensions | 1.3 |
| pg_stat_statements | extensions | 1.11 |
| uuid-ossp | extensions | 1.1 |
| pg_graphql | graphql | 1.5.11 |
| supabase_vault | vault | 0.3.1 |
| plpgsql | pg_catalog | 1.0 |

## Appendix: Migration History (37 migrations)

All applied on 2026-02-28, ordered by timestamp from `20260227234630` to `20260228173531`.
