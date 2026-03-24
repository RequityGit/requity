# UW Tab v4 Enhancements - Context

## Key Files
- `apps/requity-os/components/pipeline/tabs/UnderwritingTab.tsx` - Main UW tab orchestrator
- `apps/requity-os/components/pipeline/tabs/CommercialUnderwritingTab.tsx` - Commercial UW with Pro Forma, wires section-aware income to calculator
- `apps/requity-os/components/pipeline/tabs/financials/T12SubTab.tsx` - T12/Historical with lease, occupancy, ancillary sections + GPI Summary
- `apps/requity-os/components/pipeline/tabs/financials/ExpensesSection.tsx` - Expenses with benchmark guidance
- `apps/requity-os/components/pipeline/tabs/financials/AssumptionsSubTab.tsx` - All UW assumption fields
- `apps/requity-os/components/pipeline/tabs/financials/ClosingCostsSubTab.tsx` - Closing costs
- `apps/requity-os/components/pipeline/uw/ProFormaSection.tsx` - Pro Forma table + valuation grid
- `apps/requity-os/lib/commercial-uw/deal-computations.ts` - Calculator engine (computeProForma, computeT12GPI, computeYearGPI)
- `apps/requity-os/lib/commercial-uw/calculator.ts` - Standalone calculator (has stabilized column)
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions.ts` - Server actions
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/page.tsx` - Deal page data loading

## New Files Created
- `apps/requity-os/lib/commercial-uw/expense-benchmarks.ts` - 10x10 benchmark matrix + helpers (Sprint 1)
- `apps/requity-os/lib/commercial-uw/asset-type-config.ts` - Unit labels, ancillary templates, occupancy presets, section visibility (Sprint 1)
- `apps/requity-os/components/pipeline/tabs/financials/OccupancyIncomeSection.tsx` - Occupancy income table (Sprint 2)
- `apps/requity-os/components/pipeline/tabs/financials/AncillaryIncomeSection.tsx` - Ancillary income with templates (Sprint 2)

## Modified Files
- `commercial-uw-actions.ts` - upsertIncomeBySectionRows, updateExpenseNotes, updateIncomeNotes
- `deal-computations.ts` - computeT12GPI, computeYearGPI, section-aware computeProForma
- `T12SubTab.tsx` - Section filtering, OccupancyIncome/AncillaryIncome integration, GPI Summary
- `CommercialUnderwritingTab.tsx` - Income row mapping with section/meta, stabilizedVacancyPct passthrough
- `AssumptionsSubTab.tsx` - handleSave persists all 8 fields
- `FinancialsTab.tsx` - Removed Scope of Work tab (moved to Capital Stack)
- `ExpensesSection.tsx` - Benchmark Ref column, Variance column, Apply Guidance, source badges, notes
- `ProFormaSection.tsx` - Stabilized column, valuation grid

## Decisions Made
- Extend `deal_commercial_income` with section/meta columns instead of new table
- Expense benchmarks as TypeScript constant, not DB table
- Stabilized is a calculator column (year=99), not a standalone feature
- MHP POH analysis deferred
- Scope of Work removed from Financials tab (already in Sources & Uses / Capital Stack)
- Import Wizard occupancy sheet detection deferred to future sprint
- `upsertIncomeBySectionRows` for section-aware saves (avoids wiping other sections)
- GPI = MAX(lease net revenue, occupancy revenue) + ancillary income

## Gotchas Discovered
- `upsertIncomeRows` deletes ALL income rows. Created `upsertIncomeBySectionRows` for section-specific upserts.
- TypeScript strict mode flags `OccupancyMeta as Record<string, unknown>` as unsafe. Used double cast.
- `ExtendedIncomeRow.section` is optional but component interfaces expected required `string`. Fixed with optional fields.
- CommercialUnderwritingTab was stripping section/meta when mapping income rows to DealIncomeRow[]. Fixed in Sprint 3.
- AssumptionsSubTab handleSave only saved 3 of 8 fields. Fixed in Sprint 3 to save all.
- Two calculator systems exist: `calculator.ts` (standalone) and `deal-computations.ts` (pipeline). Pipeline uses deal-computations.

## Dependencies
- DB migrations from Sprint 1 must exist (section/meta/notes columns)
- No downstream blockers remaining

## DB Changes (Applied)
- `deal_commercial_expenses`: +source (text, default 'manual'), +notes (text, nullable)
- `deal_commercial_income`: +section (text, default 'lease'), +meta (jsonb, nullable), +notes (text, nullable)

## Pre-existing TS Errors (Not Ours)
- ContactsTab.tsx: 3 errors (contactRoles prop, cardType references)
- PipelineView.tsx: 1 error (cardTypes prop)

## Last Updated: 2026-03-20
## Status: ALL 3 SPRINTS COMPLETE
## Next Steps: Move to dev/completed/, test with real deal data with Luis
