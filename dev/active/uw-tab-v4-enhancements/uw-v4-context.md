# UW Tab v4 Enhancements - Context

## Key Files
- `apps/requity-os/components/pipeline/tabs/UnderwritingTab.tsx` — Main UW tab orchestrator
- `apps/requity-os/components/pipeline/tabs/financials/IncomeSection.tsx` — Income sub-tab
- `apps/requity-os/components/pipeline/tabs/financials/ExpensesSection.tsx` — Expenses sub-tab
- `apps/requity-os/components/pipeline/uw/ProFormaSection.tsx` — Pro Forma sub-tab
- `apps/requity-os/lib/commercial-uw/calculator.ts` — Pro Forma calculator engine
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions.ts` — Server actions
- `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/page.tsx` — Deal page data loading

## New Files to Create
- `apps/requity-os/lib/commercial-uw/expense-benchmarks.ts` — 100-value constant + lookup helper
- `apps/requity-os/lib/commercial-uw/asset-type-config.ts` — Unit labels, ancillary templates, section visibility
- `apps/requity-os/components/pipeline/uw/OccupancyIncomeSection.tsx` — Occupancy income table (Sprint 2)

## Decisions Made
- Extend `deal_commercial_income` with section/meta columns instead of new table
- Expense benchmarks as TypeScript constant, not DB table
- Stabilized is a calculator column, not a standalone feature
- MHP POH analysis deferred
- Scope of Work moves from FinancialsTab to Capital Stack

## Gotchas Discovered
- `upsertIncomeRows` deletes ALL income rows. Created `upsertIncomeBySectionRows` for section-specific upserts to avoid wiping occupancy/ancillary when saving lease rows.
- TypeScript strict mode flags `OccupancyMeta as Record<string, unknown>` as unsafe. Used `as unknown as Record<string, unknown>` double cast.
- `ExtendedIncomeRow.section` is optional (`string | undefined`) but component interfaces expected required `string`. Fixed with optional section fields and `any[]` props.
- Pro forma `computeYearGPI` centralizes the MAX(lease,occ)+ancillary logic for all years including stabilized.

## Dependencies
- Depends on: Sprint 1 DB migrations (section/meta columns on deal_commercial_income)
- Blocks: Sprint 3 (Polish)

## New Files Created (Sprint 2)
- `components/pipeline/tabs/financials/OccupancyIncomeSection.tsx` - Occupancy income table with inline editing, presets, RevPAR calculation
- `components/pipeline/tabs/financials/AncillaryIncomeSection.tsx` - Ancillary income with asset-type templates

## Modified Files (Sprint 2)
- `commercial-uw-actions.ts` - Added `upsertIncomeBySectionRows` server action
- `deal-computations.ts` - Added `computeT12GPI()`, refactored `computeProForma()` with `computeYearGPI()` helper
- `T12SubTab.tsx` - Section-aware income filtering, OccupancyIncomeSection/AncillaryIncomeSection integration, GPI Summary card

## Last Updated: 2026-03-20
## Next Steps: Sprint 3 - Polish & Integration (Stabilized to Takeout Test, Scope of Work to Capital Stack, edge cases)
