# Underwriting Tab v4 Enhancements - Simplified Plan

## Objective

Bring the pipeline Underwriting tab to parity with the Excel commercial UW template by adding occupancy-based income, expense guidance auto-population, a stabilized column, and asset-type-aware UX. Minimize new tables, new components, and moving parts.

---

## Architecture Philosophy: Extend, Don't Multiply

The original plan had 7 features, 5 phases, 7+ new files, and 2 new DB tables. That's too many moving parts. Here's how we collapse it:

### Simplification 1: No new tables for occupancy income
Instead of a `deal_commercial_occupancy_income` table, extend `deal_commercial_income` with one new column: `section` enum (`lease` | `occupancy` | `ancillary`). The existing table already stores line items with amounts. Occupancy rows just have different metadata (nightly_rate, occupancy_pct, operating_days, site_count in a JSONB `meta` column). Same CRUD, same server actions, same import flow. One table, three sections.

### Simplification 2: Expense benchmarks as code, not a table
Instead of an `expense_benchmarks` table + admin UI + seed migration, store the benchmark matrix as a TypeScript constant in `lib/commercial-uw/expense-benchmarks.ts`. It's 10 asset classes x 10 categories = 100 values. That's a single object literal. The Excel data rarely changes, and when it does, a code change is fine. If we ever need admin-editable benchmarks, we promote to a DB table later. Zero migration, zero admin UI, zero RLS policies.

### Simplification 3: Stabilized is a calculator column, not a feature
The Pro Forma calculator already outputs T-12, Yr0-5, and a Stabilized row. We just need to make the Stabilized column visible and wire it to use market rents from the rent roll + stabilized vacancy %. This is a calculator tweak + one more `<th>` column, not a standalone feature.

### Simplification 4: Asset-type-aware UX is conditional CSS, not a phase
Property type already exists on the deal. Showing/hiding sections is just `{propertyType === 'rv_park' && <OccupancySection />}`. Changing "$/unit" to "$/pad" is a lookup from a 10-line object. This gets woven into each component as we build it, not treated as a separate effort.

### Simplification 5: MHP POH analysis is deferred
POH is MHP-only, niche, and adds real complexity (separate NOI calculation, lot-rent-only DSCR). Defer to a future sprint. If an MHP deal needs POH analysis today, they use the Excel. The portal handles 95% of deal types without it.

### Simplification 6: Valuation table is 15 lines of JSX
Cap rate sensitivity (6-11%) is just `NOI / capRate` in a loop. No DB, no server action, no new component file needed. It goes inline at the bottom of the Pro Forma tab. 15 lines.

---

## What We're Actually Building (3 Things)

### Thing 1: Occupancy Income Section on the Income Tab
**What:** Below the rent roll, a collapsible "Occupancy-Based Income" section. Auto-expanded when asset type is RV Park, Hotel, Marina, Campground, Vacation Rental. Collapsed/hidden for MF, Office, etc.

**Fields per row:** Site Type, Count, Nightly Rate ($), Occupancy %, Operating Days/Yr, Annual Revenue (calc), Target Rate, Target Occ %, Stabilized Revenue (calc)

**Rollup KPIs:** Total Sites, Weighted Avg Rate, Weighted Avg Occ, Total Revenue, RevPAR

**Ancillary expansion:** Below occupancy (or below rent roll for lease-based), expand "Other Income" from 4 generic rows to a pre-populated template based on asset type. RV Park gets: Dump Station, Storage, Amenity Fees, Utility Reimbursement. Hotel gets: F&B, Event Space, Amenity Fees. MF gets: Laundry, Pet Fees, Storage, Late Fees. User can add/remove freely.

**GPI calculation:** MAX(Lease-Based Annual, Occupancy-Based Annual) + Ancillary = GPI. This matches the Excel logic exactly.

**DB change:** Add `section` (text, default 'lease') and `meta` (jsonb, nullable) columns to `deal_commercial_income`. Occupancy rows store `{nightly_rate, occupancy_pct, operating_days, site_count, target_rate, target_occ}` in meta. No new table.

### Thing 2: Expense Guidance Auto-Population + Notes on the Expenses Tab
**What:** When property type + unit count are set, auto-suggest Year 1 expenses using Requity's benchmarks. Year 1 starts at the benchmark value; user overrides are tracked with the original benchmark always visible as a reference. Every expense and income line item supports inline notes.

**How it works:**
- `lib/commercial-uw/expense-benchmarks.ts` exports a typed constant:
  ```ts
  export const EXPENSE_BENCHMARKS: Record<AssetClass, Record<ExpenseCategory, { perUnit?: number; perSF?: number }>> = { ... }
  ```
- Lookup: `benchmarks[assetClass][category].perUnit * unitCount` (or perSF * totalSF for office/retail/industrial)

**Year 1 vs Benchmark flow:**
1. Property type + units set on the deal: Year 1 expense cells auto-populate with benchmark values
2. Each row shows: `T-12 Actual | Year 1 (editable) | Benchmark Ref | Variance`
3. The "Benchmark Ref" column is read-only and always shows the guidance value (e.g., "$8,000" for RE Taxes on a 20-unit MHP at $400/pad). This never changes when the user edits Year 1.
4. "Variance" column shows the delta: if Year 1 = $10,000 and Benchmark = $8,000, it shows "+$2,000 (+25%)" in amber. If Year 1 matches benchmark, it shows a green checkmark.
5. Override any Year 1 value and it flips `source` to `manual`. The benchmark ref stays visible so you can always see what guidance says.
6. "Reset to Guidance" button per row (or "Reset All" at top) to snap Year 1 back to benchmark.
7. Change property type or unit count: benchmark ref recalculates. Un-overridden (guidance-sourced) Year 1 values also recalculate. Manually overridden values stay put but the variance updates.

**Inline Notes on Line Items:**
- Every expense row and every income row gets an optional `notes` field (text, nullable).
- UI: A small chat/note icon appears on hover for each row. Click to expand an inline text area below the row. Saved notes show a persistent small icon so you know a note exists.
- Use case: "RE Taxes: County reassessment pending, using broker's estimate. Verify with tax assessor after closing." or "Utilities: Owner-paid water/sewer, tenants pay electric. Confirm meter setup."
- Notes are visible to anyone viewing the deal. They're the underwriter's thought process, not private.
- Notes also show on Income rows: "GPR: 3 units below market, owner hasn't raised rents in 2 years" or "Parking: Only 10 of 24 units have assigned spots, room to add."

**DB change:** Add `source` (text, default 'manual') and `notes` (text, nullable) to `deal_commercial_expenses`. Add `notes` (text, nullable) to `deal_commercial_income`. No new table.

**Unit label adaptation:** A 10-line helper: `getUnitLabel(assetClass)` returns "unit" | "pad" | "slip" | "site" | "room" | "SF". Used in $/unit column headers across Income, Expenses, and Pro Forma.

### Thing 3: Stabilized Column + Valuation on the Pro Forma Tab
**What:** Add a "Stabilized" column to the Pro Forma table (after Year 5). Add a cap rate valuation grid below.

**Stabilized column logic:**
- Income: Uses stabilized/market rents from rent roll (or target rate/occ from occupancy section)
- Vacancy: Uses the deal's stabilized vacancy % (default 5%, editable in assumptions bar)
- Expenses: Same as Year 1 (expense guidance defaults) unless overridden
- Debt Service: Uses the takeout loan terms (connects to Takeout Test)
- Shows NOI Upside: Stabilized NOI - T-12 NOI (the value-add delta)

**Valuation grid:**
- 6 rows: cap rates 6%, 7%, 8%, 9%, 10%, 11%
- 3 columns: T-12 Value, Year 1 Value, Stabilized Value
- Calc: NOI / Cap Rate
- Highlight row closest to deal's going-in cap rate
- Rendered inline at bottom of Pro Forma, no new component file needed

**DB change:** None. Stabilized assumptions (vacancy %, market rent flag) already fit in `deal_commercial_uw` JSONB.

---

## Implementation Order (3 Sprints, Not 5 Phases)

### Sprint 1: Expense Guidance + Stabilized Column + Notes (fastest ROI)
1. Create `expense-benchmarks.ts` with all 10 asset classes from the Excel
2. Add `source` + `notes` columns to `deal_commercial_expenses` (migration)
3. Add `notes` column to `deal_commercial_income` (migration)
4. Wire expense guidance into Expenses tab: Benchmark Ref column, Variance column, Reset to Guidance, Apply All
5. Build inline notes UI (hover icon, expand textarea, persistent indicator)
6. Add `getUnitLabel()` helper
7. Add Stabilized column to Pro Forma calculator + table
8. Add valuation grid at bottom of Pro Forma
9. Test: change property type on a deal, verify expenses auto-suggest with benchmark ref visible

### Sprint 2: Occupancy Income + Ancillary Expansion
1. Add `section` + `meta` columns to `deal_commercial_income` (migration)
2. Build OccupancyIncomeSection component (reuse rent roll table patterns)
3. Wire conditional show/hide based on asset type
4. Expand ancillary section with asset-type templates
5. Update GPI calculation: MAX(lease, occ) + ancillary
6. Update Import Wizard to detect occupancy-style sheets
7. Test: create an RV Park deal, enter nightly rates, verify Pro Forma flows

### Sprint 3: Polish + Integration
1. Connect Stabilized column to Takeout Test (use stabilized NOI as the stress basis)
2. Assumptions bar: add stabilized vacancy %, market rent toggle
3. Asset-type-specific placeholder text and empty states
4. Edge cases: Mixed Use (both sections), no property type set yet, zero units
5. Review with Luis on a real RV park / hotel deal

---

## Scope

### IN
- Occupancy-based income section (auto-show by asset type)
- Expense guidance auto-population from code-based benchmarks
- Expanded ancillary income with asset-type templates
- Stabilized column on Pro Forma
- Cap rate valuation grid
- Asset-type-aware labels and section visibility
- Unit label adaptation ($/unit, $/pad, $/slip, $/room, $/SF)

### OUT (deferred)
- MHP Park-Owned Home analysis (niche, add later)
- Admin UI for editing expense benchmarks (code-based for now, promote to DB when needed)
- Separate `expense_benchmarks` DB table (overkill for 100 static values)
- Per-SF income for office/retail NNN reconciliation (future)
- Seasonality modeling for occupancy income (future)

---

## DB Changes Summary (2 lightweight migrations)

```sql
-- Migration 1: Expense source tracking + notes
ALTER TABLE deal_commercial_expenses
ADD COLUMN source text NOT NULL DEFAULT 'manual',
ADD COLUMN notes text;
-- source values: 'guidance', 'manual', 'imported'
-- notes: free-text underwriter commentary per line item

-- Migration 2: Income section support + notes
ALTER TABLE deal_commercial_income
ADD COLUMN section text NOT NULL DEFAULT 'lease',
ADD COLUMN meta jsonb,
ADD COLUMN notes text;
-- section values: 'lease', 'occupancy', 'ancillary'
-- meta for occupancy: {nightly_rate, occupancy_pct, operating_days, site_count, target_rate, target_occ}
-- notes: free-text underwriter commentary per line item
```

Two ALTER TABLEs. No new tables. No new RLS policies (inherits from parent table). No seed data migration.

---

## New Files (3, not 7+)

| File | Purpose |
|------|---------|
| `lib/commercial-uw/expense-benchmarks.ts` | 100-value constant + lookup helper |
| `lib/commercial-uw/asset-type-config.ts` | Unit labels, ancillary templates, section visibility per asset type |
| `components/pipeline/uw/OccupancyIncomeSection.tsx` | Occupancy income table (mirrors rent roll patterns) |

Everything else is modifications to existing files (calculator, Pro Forma section, Expenses section, Income section, server actions).

---

## Files to Modify

| File | Change |
|------|--------|
| `lib/commercial-uw/calculator.ts` | Add stabilized column, occupancy GPI logic |
| `components/pipeline/uw/ProFormaSection.tsx` | Stabilized column, valuation grid, assumptions bar tweaks |
| `components/pipeline/tabs/financials/IncomeSection.tsx` | Conditional occupancy section, expanded ancillary |
| `components/pipeline/tabs/financials/ExpensesSection.tsx` | Expense guidance hints, Apply All, source badges |
| `commercial-uw-actions.ts` | Update upsertIncomeRows for section/meta, expense source |
| Import wizard components | Occupancy sheet detection |

---

## Risks
- Expense benchmark accuracy: validate against 2-3 real deals with Luis before shipping
- Occupancy income edge cases: partial year operations, seasonal rates (defer seasonality, use annual averages)
- Mixed Use deals need both sections visible without confusion

## Success Criteria
- Luis can underwrite an RV park entirely in the portal (occupancy income flows to Pro Forma)
- Changing property type from MF to Hotel auto-shows occupancy section, hides rent roll emphasis
- Expense Guidance values match the Excel for all 10 asset classes within $1 rounding
- Stabilized column shows on Pro Forma and feeds Takeout Test
- Total new DB tables: 0. Total new migrations: 2 ALTER TABLEs.
