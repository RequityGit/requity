# Field Manager Audit: Objects Not Yet Configured

**Date:** 2026-03-07
**Author:** Claude (automated audit)

## Context

The Field Manager (at `/control-center/field-manager`) currently manages 10 object modules with ~65 total fields. These control field visibility, ordering, and layout on detail/profile pages across RequityOS. This audit identifies which platform objects with active detail pages and user-facing fields are **missing** from the Field Manager.

---

## Current Field Manager Objects (10 modules, ~65 fields)

| # | Module | DB Table | Fields |
|---|--------|----------|--------|
| 1 | Loan Details | loans | 14 |
| 2 | Property | loans (property_* cols) | 10 |
| 3 | Borrower / Entity | loans (entity/borrower cols) | 6 |
| 4 | Equity Deal Details | equity_deals | 0 (placeholder) |
| 5 | Equity Property | equity_properties | 0 (placeholder) |
| 6 | Equity Notes & Strategy | equity_deals | 0 (placeholder) |
| 7 | Company Information | companies | 10 |
| 8 | Borrower Profile | borrowers | 11 |
| 9 | Investor Profile | investors | 2 |
| 10 | Contact Profile | crm_contacts | 12 |

---

## Objects NOT in Field Manager That Could Be Added

### Tier 1 -- High Priority (active detail pages, many user-facing fields, high daily usage)

| # | Proposed Module | DB Table | Candidate Fields | Detail Page | Why Add |
|---|----------------|----------|-----------------|-------------|---------|
| 1 | **Loans (Extended)** | `loans` | ~80 additional columns | `/admin/loans/[id]` | The loans table has ~130 columns but only 30 are in the Field Manager. Closing dates, fees, insurance, title company, broker, approval, prepayment, extension, co-borrower fields all lack visibility control. |
| 2 | **Servicing Loan** | `servicing_loans` | ~40 fields | `/admin/servicing/[loanId]` | Heavily used post-funding detail page. Payment structure, ACH info, default tracking, balance fields have zero admin control. |
| 3 | **Fund Details** | `funds` | ~20 fields | `/admin/funds/[id]` | Core investor object. Different fund types need different field visibility (management_fee_pct, carry_pct, hurdle_rate_pct, etc.). |
| 4 | **Opportunity / Origination** | `opportunities` | ~30 fields | `/admin/originations/`, `/admin/pipeline-v2/[id]` | Pipeline entry point. Many fields vary by loan type -- field control would let admins customize the intake experience. |
| 5 | **Standalone Property** | `properties` | ~25 fields | Referenced by opportunities and equity deals | First-class entity separate from loan-level property columns. 25 fields (zoning, building class, flood zone, etc.) need layout control. |

### Tier 2 -- Medium Priority (active pages, fewer fields or lower frequency)

| # | Proposed Module | DB Table | Candidate Fields | Detail Page | Why Add |
|---|----------------|----------|-----------------|-------------|---------|
| 6 | **Borrower Entity** | `borrower_entities` | ~15 fields | `/admin/borrowers/entities` | The existing "Borrower / Entity" module maps to the `loans` table. The actual `borrower_entities` table has its own page with no Field Manager coverage. |
| 7 | **Investing Entity** | `investing_entities` | ~13 fields | `/admin/investors/[id]` (entity tab) | 13 configurable fields with no admin control. |
| 8 | **Investor Commitment** | `investor_commitments` | ~10 fields | `/admin/funds/[id]` (commitments section) | Field control would let admins customize for different fund types. |
| 9 | **Capital Call** | `capital_calls` | ~10 fields | `/admin/capital-calls` | Active page with investor-facing data. |
| 10 | **Distribution** | `distributions` | ~10 fields | `/admin/distributions` | Active page with investor-facing data. |

### Tier 3 -- Lower Priority

| # | Proposed Module | DB Table | Candidate Fields | Notes |
|---|----------------|----------|-----------------|-------|
| 11 | Draw Request | `draw_requests` | ~15 fields | More transactional than profile-like |
| 12 | Payoff Statement | `payoff_statements` | ~12 fields | Generated documents |
| 13 | Company Wire Instructions | `company_wire_instructions` | ~8 fields | Narrow audience |
| 14 | CRM Activity | `crm_activities` | ~10 fields | Timeline entries, not configurable fields |
| 15 | Equity Underwriting | `equity_underwriting` | ~20 fields | Lower usage frequency |

### Not Recommended (system/internal tables, ~40+)

approval_*, billing_*, budget_*, commercial_*, condition_template*, *_audit_log, dialer_*, dscr_*, email_*, field_configurations, gmail_*, inspection_*, notification_*, ops_*, pipeline_stage_*, site_*, sop_*, t12_*, unified_*, workflow_*, model_scenarios

---

## Summary

| Category | Count |
|----------|-------|
| Current FM modules | 10 |
| **Tier 1 -- High priority to add** | **5** |
| Tier 2 -- Medium priority to add | 5 |
| Tier 3 -- Lower priority | 5 |
| Not recommended (system tables) | ~40+ |
| **Total candidate fields across Tier 1 + 2** | **~195** |

---

## Recommended Priority Order

1. **Loans (Extended)** -- ~80 fields. Biggest gap by far. Only 30 of ~130 loan columns are managed.
2. **Servicing Loan** -- ~40 fields. Operational backbone post-funding with no admin control.
3. **Fund Details** -- ~20 fields. Central to the investor experience.
4. **Opportunity / Origination** -- ~30 fields. Pipeline entry point with type-varying fields.
5. **Standalone Property** -- ~25 fields. Shared entity across deals.

Then: Borrower Entity (15), Investing Entity (13), Investor Commitment (10), Capital Call (10), Distribution (10).

---

## Implementation Notes

To add a new module to the Field Manager:

1. `FieldManagerView.tsx` (lines 103-114): Add to `MODULES` array
2. `FieldManagerView.tsx` (lines 128-139): Add to `MODULE_LABELS`
3. `FieldManagerView.tsx` (lines 141-152): Add to `MODULE_TABLE_LABELS`
4. Edge Function `create-field/index.ts`: Add to `MODULE_TO_TABLE`
5. Migration: Seed `field_configurations` rows
6. Detail page components: Wire up `useFieldConfigurations` hook
