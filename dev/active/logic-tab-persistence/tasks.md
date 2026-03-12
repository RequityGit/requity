# Logic Tab Persistence - Tasks

## Phase 1: Database Schema
- [ ] Create migration adding condition_rules JSONB column to field_configurations

## Phase 2: Update Logic Tab UI
- [ ] Add ConditionRule type and update FieldConfig type in actions.ts
- [ ] Replace hardcoded Logic tab UI with dynamic rule editor
- [ ] Wire save/load through updateFieldConfig

## Phase 3: Verification
- [ ] pnpm build passes
- [ ] Commit and push

## Blockers
- None

## Last Updated: 2026-03-12
