# Underwriting Formula Engine - Implementation Plan

## Objective
Replace the hardcoded formula evaluator in `computeUwOutput()` with a mathjs-based expression engine so underwriting formulas can be edited via the admin UI without code deploys.

## Scope
- IN: Formula engine library, replace `computeUwOutput()`, enhance CardTypeManager formula editor UI, migration to backfill formula strings
- OUT: Deep calculators (RTL, Commercial, DSCR), Google Sheets integration, new DB tables

## Approach
1. Install mathjs, create `lib/formula-engine/` with core engine + financial + Excel functions
2. Replace 90-line hardcoded switch in `computeUwOutput()` with 3-line engine call
3. Enhance `UwOutputsEditor` with validation, variable reference, function reference
4. SQL migration to fill in formula strings for outputs that were previously key-matched

## Files Modified
- `apps/requity-os/lib/formula-engine/engine.ts` (new)
- `apps/requity-os/lib/formula-engine/financial-functions.ts` (new)
- `apps/requity-os/lib/formula-engine/excel-functions.ts` (new)
- `apps/requity-os/lib/formula-engine/index.ts` (new)
- `apps/requity-os/components/pipeline-v2/pipeline-types.ts` (modified)
- `apps/requity-os/app/(authenticated)/control-center/card-types/CardTypeManagerView.tsx` (modified)
- `packages/db/supabase/migrations/20260309000000_update_uw_output_formulas.sql` (new)

## Success Criteria
- All existing formulas produce same results as before
- New formulas can be added/edited in CardTypeManager without code changes
- Build passes cleanly
