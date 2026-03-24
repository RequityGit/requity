# Action Center - Tasks

## Phase 1: Data Hook
- [ ] Create useActionCenterData.ts (merge timeline + notes + conditions + tasks)

## Phase 2: Stream (Left Column)
- [ ] StreamFilters.tsx (filter chip bar)
- [ ] ActionCenterStreamItem.tsx (item renderer by type)
- [ ] ActionCenterComposer.tsx (bottom composer)
- [ ] ActionCenterStream.tsx (main stream layout)

## Phase 3: Rail (Right Column)
- [ ] RailConditionItem.tsx (collapsed + expanded condition)
- [ ] RailTaskItem.tsx (task row with checkbox)
- [ ] ActionCenterRail.tsx (main rail layout with progress + KPI strip)

## Phase 4: Integration
- [ ] index.tsx (two-column layout wrapper)
- [ ] Add to DealDetailPage.tsx as first tab
- [ ] Handle backward compat for ?tab= param

## Phase 5: Polish
- [ ] Error boundaries on both columns
- [ ] Empty states for stream and rail
- [ ] pnpm build passes

## Blockers
- None

## Last Updated: 2026-03-22
