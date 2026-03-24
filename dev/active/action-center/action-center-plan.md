# Action Center Tab - Implementation Plan

## Objective
Build an "Action Center" tab as the first tab on the deal detail page, replacing the sidebar-based activity workflow with a two-column layout: unified live activity stream (left) and execution rail with conditions + tasks (right).

## Scope
- IN: New ActionCenterTab component, stream + rail columns, composer, filters, condition expand, task list, tab integration
- OUT: No DB migrations, no modifications to existing tabs, no real-time SMS/email sync, no RLS changes

## Approach
1. Create useActionCenterData hook (reuses fetchActivityTabData + adds notes + tasks + conditions)
2. Build ActionCenterStream with filter bar, feed, and composer
3. Build ActionCenterRail with conditions and tasks
4. Integrate as first tab in DealDetailPage
5. Polish: error boundaries, empty states, build check

## Files to Create
```
apps/requity-os/components/pipeline/tabs/ActionCenterTab/
  index.tsx
  ActionCenterStream.tsx
  ActionCenterStreamItem.tsx
  ActionCenterComposer.tsx
  ActionCenterRail.tsx
  RailConditionItem.tsx
  RailTaskItem.tsx
  StreamFilters.tsx
  useActionCenterData.ts
```

## Files to Modify
- DealDetailPage.tsx (add tab, reorder)

## Database Changes
None. All tables exist.

## Risks
- Performance: merging multiple data sources. Mitigate with Promise.all and reasonable limits.
- Tab order change: backward compat for URL ?tab= param.

## Success Criteria
1. Action Center loads as first tab
2. Stream shows notes, emails, calls, stage changes merged chronologically
3. Composer creates notes optimistically
4. Conditions rail with inline expand and status updates
5. Tasks with checkbox toggle
6. No TS errors on pnpm build
7. Dark mode works
