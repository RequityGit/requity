# Field Manager Audit

**Date:** 2026-03-08 (updated)
**Author:** Claude (automated audit)

## Current State

The Field Manager (at `/control-center/field-manager`) now manages **22 modules with 348 total fields** after the Tier 1-3 seed migration was applied on 2026-03-08.

### All Active Modules (22 modules, 348 fields)

| # | Module | DB Table | Fields | Status |
|---|--------|----------|--------|--------|
| 1 | Loan Details | loans | 14 | Original |
| 2 | Property | loans (property_* cols) | 19 | Original |
| 3 | Borrower / Entity | loans (entity/borrower cols) | 6 | Original |
| 4 | Company Information | companies | 10 | Original |
| 5 | Borrower Profile | borrowers | 11 | Original |
| 6 | Investor Profile | investors | 2 | Original |
| 7 | Contact Profile | crm_contacts | 17 | Original |
| 8 | Loans (Extended) | loans | 62 | Tier 1 |
| 9 | Servicing Loan | servicing_loans | 48 | Tier 1 |
| 10 | Fund Details | funds | 18 | Tier 1 |
| 11 | Opportunity | opportunities | 29 | Tier 1 |
| 12 | Standalone Property | properties | 30 | Tier 1 |
| 13 | Borrower Entity Detail | borrower_entities | 12 | Tier 2 |
| 14 | Investing Entity | investing_entities | 10 | Tier 2 |
| 15 | Investor Commitment | investor_commitments | 6 | Tier 2 |
| 16 | Capital Call | capital_calls | 8 | Tier 2 |
| 17 | Distribution | distributions | 8 | Tier 2 |
| 18 | Draw Request | draw_requests | 15 | Tier 3 |
| 19 | Payoff Statement | payoff_statements | 16 | Tier 3 |
| 20 | Wire Instructions | company_wire_instructions | 5 | Tier 3 |
| 21 | CRM Activity | crm_activities | 9 | Tier 3 |
| 22 | Equity Underwriting | equity_underwriting | 20 | Tier 3 |

### Placeholder Modules (0 fields — not yet seeded)

| Module | DB Table | Notes |
|--------|----------|-------|
| Equity Deal Details | equity_deals | 19 DB columns available |
| Equity Property | equity_properties | Table does not exist yet |
| Equity Notes & Strategy | equity_deals (shared) | Shares table with Equity Deal |

---

## Remaining Gaps

### Existing modules with missing user-facing columns

| Module | Covered | Missing | Key Missing Fields |
|--------|---------|---------|-------------------|
| company_info | 10 | ~16 | address block, fee_agreement_on_file, notes, asset_types, company_capabilities, lender_programs, geographies, NDA dates |
| contact_profile | 17 | ~10 | address_line2, next_follow_up_date, last_contacted_at, contact_types, language_preference, user_function, is_independent_broker, marketing_consent, dnc, dnc_reason |
| borrower_profile | 11 | 1 | notes |
| investor_profile | 2 | 1 | notes |

### Not Recommended for Field Manager (system/internal tables)

approval_*, billing_*, budget_*, commercial_*, condition_template*, *_audit_log, dialer_*, dscr_*, email_*, field_configurations, gmail_*, inspection_*, notification_*, ops_*, pipeline_stage_*, site_*, sop_*, t12_*, unified_*, workflow_*, model_scenarios

---

## Changelog

| Date | Action |
|------|--------|
| 2026-03-07 | Initial audit: identified 15 missing modules across Tier 1-3 |
| 2026-03-08 | Applied Tier 1-3 seed migration: added 269 fields across 15 new modules |
