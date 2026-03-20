# Logic Tab Persistence - Tasks

## Phase 1: Database Schema
- [x] condition_rules column already exists (conditional_rules in FieldConfig type)

## Phase 2: Update Logic Tab UI
- [x] Add ConditionRule type and constants (OPERATORS, ACTIONS, VALUE_FREE_OPERATORS)
- [x] Replace hardcoded Logic tab UI with dynamic LogicTab component
- [x] Wire save/load through updateFieldConfig (via handleUpdate -> conditional_rules)
- [x] Pass siblingFields from ObjectManagerView to FieldConfigPanel

## Phase 3: Verification
- [x] pnpm typecheck passes
- [x] Commit and push

## Blockers
- None

## Last Updated: 2026-03-12
