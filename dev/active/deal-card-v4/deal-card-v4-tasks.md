# DealCard V4 - Tasks

## Phase 1: Data Layer
- [x] Add conditions count aggregate query to pipeline page.tsx
- [x] Add broker_contact join to deals query
- [x] Add conditionsMap to pipeline store
- [x] Add useConditionsMap hook
- [x] Pass conditionsMap through PipelineProvider

## Phase 2: DealCard Rewrite
- [x] Rewrite DealCardInner with V4 layout
- [x] Update DealCardOverlay to match
- [x] Update React.memo comparator
- [x] Update DealCardProps interface

## Phase 3: Wire Props
- [x] Update PipelineKanban to pass conditionsProgress + assigneeName
- [x] Build assignee name map in PipelineKanban

## Phase 4: Verify
- [x] Run pnpm build - PASSED (0 errors)
- [ ] Check light/dark mode visually

## Blockers
- None

## Last Updated: 2026-03-22
