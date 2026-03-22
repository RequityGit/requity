# DealCard V4 - Implementation Plan

## Objective
Redesign the pipeline kanban DealCard from a 130px fixed-height card with 5 data points to an auto-height information-dense card with 8+ data points and conditions progress bar.

## Scope
- IN: DealCard.tsx (inner + overlay), PipelineKanban.tsx (new props), pipeline page.tsx (conditions query), pipeline-store (conditions + assignee map)
- OUT: pipeline-types.ts, deal-display-config.ts, drag-and-drop mechanics, stage filtering, kanban column layout

## Approach

### Phase 1: Add conditions query to pipeline page
- Aggregate conditions counts per deal in the server component
- Pass as a Map to PipelineProvider/store

### Phase 2: Build assignee name map
- Team members already in store with {id, full_name}
- Build lookup map in PipelineKanban

### Phase 3: Rewrite DealCard.tsx
- New layout matching pipeline-card-mockup.html
- Left accent stripe, property name logic, loan type badge, asset class, amount, contacts, conditions bar, footer
- Keep React.memo with updated comparator
- Keep useDraggable

### Phase 4: Update DealCardOverlay
- Static version of new card (no hooks)

### Phase 5: Wire new props through PipelineKanban
- Pass conditionsProgress and assigneeName to DealCard
- Pass same to DealCardOverlay

## Files to Modify
1. `apps/requity-os/app/(authenticated)/(admin)/pipeline/page.tsx` - Add conditions count query
2. `apps/requity-os/stores/pipeline-store.ts` - Add conditionsMap to store
3. `apps/requity-os/hooks/usePipelineStore.ts` - Add useConditionsMap hook
4. `apps/requity-os/components/pipeline/DealCard.tsx` - Complete rewrite
5. `apps/requity-os/components/pipeline/PipelineKanban.tsx` - Thread new props
6. `apps/requity-os/components/pipeline/PipelineProvider.tsx` - Pass conditionsMap

## Database Changes
- None (querying existing deal_conditions table)

## Risks
- broker_contact is not currently joined in the deals query; need to add it
- property_data may not have address fields populated for all deals
- Conditions query could add latency to initial page load

## Success Criteria
- Card visually matches pipeline-card-mockup.html in light and dark mode
- No TypeScript errors on build
- Drag and drop still works
- Performance maintained (React.memo, no fetches in card)
