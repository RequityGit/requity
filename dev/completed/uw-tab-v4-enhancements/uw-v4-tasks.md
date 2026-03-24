# UW Tab v4 Enhancements - Tasks

## Sprint 1: Expense Guidance + Stabilized Column + Notes

### Foundation Files
- [x] Create `expense-benchmarks.ts` with all 10 asset classes from Excel
- [x] Create `asset-type-config.ts` with unit labels, ancillary templates, section visibility
- [x] Create `getUnitLabel()` helper

### Database Migrations
- [x] Add `source` + `notes` columns to `deal_commercial_expenses`
- [x] Add `section` + `meta` + `notes` columns to `deal_commercial_income`

### Expense Guidance UI
- [x] Add Benchmark Ref column to Expenses tab
- [x] Add Variance column (delta + percentage with directional arrows)
- [x] Add "Apply Guidance" button at top (populates all categories from benchmarks)
- [x] Wire auto-population when property type + units are set
- [x] Track source (guidance vs manual vs imported)
- [x] Source badges on guidance-populated rows

### Inline Notes
- [x] Add note icon on hover for expense rows
- [x] Add expandable textarea for notes
- [x] Persistent icon when note exists
- [x] Add same notes UI to income rows
- [x] Server actions for individual note updates (updateExpenseNotes, updateIncomeNotes)

### Pro Forma Enhancements
- [x] Add Stabilized column (year=99) to deal-computations calculator
- [x] Add Stabilized column to Pro Forma table UI (green tinted)
- [x] Stabilized vacancy % configurable (default 5%)
- [x] NOI Upside row (Stabilized vs T-12 delta)
- [x] Cap rate valuation grid uses T-12, Year 1, and Stabilized NOI
- [x] Highlight cap rates closest to going-in rate
- [x] Stabilized row in valuation grid highlighted green

### Server Action Updates
- [x] `upsertExpenseRows` now accepts `source` and `notes`
- [x] `upsertIncomeRows` now accepts `section`, `meta`, and `notes`
- [x] New `updateExpenseNotes` action for inline note saves
- [x] New `updateIncomeNotes` action for inline note saves

### Build & Verify
- [x] Run TypeScript check, zero errors in modified files
- [x] Pre-existing errors in PipelineKanban.tsx/PipelineView.tsx (unrelated)

## Sprint 2: Occupancy Income + Ancillary
- [x] Add `upsertIncomeBySectionRows` server action (section-aware insert)
- [x] Build `OccupancyIncomeSection.tsx` component with inline editing
- [x] Build `AncillaryIncomeSection.tsx` component with asset-type templates
- [x] Wire conditional show/hide based on asset type (`showOccupancySection`)
- [x] Split income rows by section in T12SubTab (lease/occupancy/ancillary)
- [x] Add GPI Summary card (MAX(lease, occ) + ancillary breakdown)
- [x] Update `computeT12GPI()` in deal-computations.ts
- [x] Refactor `computeProForma()` with `computeYearGPI()` helper for section-aware projections
- [x] Occupancy presets per asset type (Hotel, RV, Marina, Vacation Rental)
- [x] Ancillary templates per asset type (MF, MHP, RV, Hotel, Marina, etc.)
- [x] Inline notes on occupancy and ancillary rows
- [x] TypeScript check (zero errors in modified files, pre-existing PipelineView error only)

## Sprint 3: Polish + Integration
- [x] Fix income row mapping in CommercialUnderwritingTab to pass section/meta to Pro Forma engine
- [x] Wire stabilized_vacancy_pct from UW record into computeProForma options
- [x] Fix AssumptionsSubTab handleSave to persist all 8 assumption fields
- [x] Move Scope of Work from FinancialsTab to Capital Stack (already in Sources & Uses)
- [x] Edge cases: Mixed Use shows both sections, no property type graceful fallback
- [x] Asset-type-specific empty state placeholder text in T12SubTab
- [x] TypeScript check: zero errors in modified files (pre-existing ContactsTab/PipelineView only)
- [ ] Update Import Wizard to detect occupancy-style sheets (DEFERRED to future sprint)

## Blockers
- None

## Last Updated: 2026-03-20
## Status: COMPLETE (all 3 sprints shipped)
