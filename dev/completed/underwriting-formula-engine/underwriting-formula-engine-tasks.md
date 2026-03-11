# Underwriting Formula Engine - Tasks

## Phase 1: Engine Core
- [x] Install mathjs dependency
- [x] Create engine.ts with evaluateFormula(), validateFormula(), getFormulaVariables()
- [x] Create financial-functions.ts (PMT, IRR, NPV, FV, PV, NPER, IPMT, PPMT, RATE)
- [x] Create excel-functions.ts (IF, IFERROR, AND, OR, NOT, ROUNDUP, ROUNDDOWN, COALESCE, CLAMP, ANNUAL, MONTHLY)
- [x] Create index.ts public API

## Phase 2: Integration
- [x] Replace hardcoded computeUwOutput() with formula engine call
- [x] Add evaluateFormula import to pipeline-types.ts

## Phase 3: Admin UI
- [x] Enhance UwOutputsEditor with FormulaInput component
- [x] Add formula validation indicator (green/red dot)
- [x] Add function reference panel (fx button)
- [x] Add variable insertion from uw_fields

## Phase 4: Migration
- [x] Create SQL migration to backfill formula strings

## Phase 5: Verification
- [x] TypeScript typecheck passes
- [x] Production build passes
- [x] Commit and push (merged via PR #566)

## Last Updated: 2026-03-09 (audit cleanup)
