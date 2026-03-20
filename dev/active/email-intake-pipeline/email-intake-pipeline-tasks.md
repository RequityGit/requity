# Email Intake Pipeline - Tasks

## Phase 1: Schema
- [ ] Create intake_items migration
- [ ] Add RLS policies

## Phase 2: Types & Utilities
- [ ] Create intake types (lib/intake/types.ts)
- [ ] Create matching engine utility (lib/intake/matching-engine.ts)

## Phase 3: Edge Function
- [ ] Create process-intake-email edge function

## Phase 4: Pipeline UI Integration
- [ ] Create IntakeCard component
- [ ] Create IntakeBanner component
- [ ] Modify PipelineKanban to render intake cards in Lead column
- [ ] Modify PipelineView to accept intake items
- [ ] Modify pipeline-v2/page.tsx to fetch intake items
- [ ] Add email callout button to pipeline header

## Phase 5: Review Modal
- [ ] Create FieldMergeRow component
- [ ] Create EntityMergeSection component
- [ ] Create IntakeReviewModal component

## Phase 6: Processing Action
- [ ] Create processIntakeItemAction server action

## Phase 7: Cleanup
- [ ] Remove /pipeline/intake page
- [ ] Remove sidebar Intake nav entry
- [ ] Remove old IntakeQueue component
- [ ] Remove old IntakeReviewSheet component

## Phase 8: Build Verification
- [ ] Run pnpm build
- [ ] Fix any TypeScript errors

## Blockers
- None

## Last Updated: 2026-03-11
