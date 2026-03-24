# Unified Activity Sidebar — Implementation Plan

## Objective
Consolidate all deal activity into a single sidebar with Timeline/Notes/Conditions/Messages tabs. Fix sidebar positioning to be sticky. Remove DealActivityTab and DealTasks from the overview tab.

## Scope
- IN: Timeline tab, sticky sidebar position, remove bottom activity/tasks from overview
- OUT: Tasks tab (Phase 2), Deal Intelligence (Phase 4), SLA timer (Phase 5), Nudges (Phase 6), Expanded view (Phase 7), Analytics (Phase 8)

## Approach
Phase 9 + 1 + 3 as single milestone. See approved plan at `.claude/plans/twinkly-shimmying-gizmo.md`.

## Files to Create
1. `hooks/useUnifiedTimeline.ts`
2. `components/pipeline/DealActivitySidebar/TimelineItems.tsx`
3. `components/pipeline/DealActivitySidebar/QuickActions.tsx`
4. `components/pipeline/DealActivitySidebar/TimelineTab.tsx`

## Files to Modify
1. `components/pipeline/DealActivitySidebar/index.tsx`
2. `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx`
3. `app/(authenticated)/(admin)/pipeline/[id]/page.tsx`

## Success Criteria
- Sidebar shows Timeline as default tab with all activity types
- Sidebar is sticky at tab content level
- Overview tab has no tasks or activity sections
- Existing Notes/Conditions/Messages tabs unchanged
- `pnpm build` passes cleanly
