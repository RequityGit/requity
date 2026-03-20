# Deal Sidebar - Implementation Plan

## Objective
Add a persistent right sidebar to the deal detail page containing Tasks and Notes (sub-tabs), relocate Activity feed to the bottom of the Overview tab, and remove those three items from the top-level tab bar.

## Scope
- IN: New DealSidebar component, resizable width, sub-tabs for Tasks/Notes, Activity relocation to Overview, tab bar cleanup, backward compat
- OUT: No new Supabase schema changes, no changes to Tasks/Notes/Activity component internals

## Approach

### Phase 1: Build DealSidebar component
- Create `DealSidebar.tsx` in `components/pipeline/`
- Resizable via CSS `resize: horizontal` or drag handle (no external dep)
- Sub-tabs: Tasks, Notes using shadcn Tabs
- Default open, ~340px width, collapsible via toggle button
- Pass through existing props for DealTasks and UnifiedNotes

### Phase 2: Wire into DealDetailPage
- Change content area from single column to flex row (content + sidebar)
- Remove Tasks/Notes tab content blocks from main area
- Import and render DealSidebar in the flex row

### Phase 3: Move Activity to Overview
- Render DealActivityTab at bottom of Overview tab content
- Remove Activity tab content block from main area

### Phase 4: Clean up tabs + backward compat
- Remove "Tasks", "Activity", "Notes" from UNIVERSAL_TABS
- Add backward compat: `?tab=tasks`/`?tab=notes`/`?tab=activity` -> overview
- Remove unused loadedTabs entries

## Files to Modify
- NEW: `apps/requity-os/components/pipeline/DealSidebar.tsx`
- EDIT: `apps/requity-os/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx`

## Risks
- Layout shift on existing tabs when sidebar takes width
- Mobile responsiveness (sidebar should collapse on small screens)

## Success Criteria
- Sidebar visible on all tabs with Tasks/Notes sub-tabs
- Resizable width with drag handle
- Activity shows at bottom of Overview
- No Tasks/Activity/Notes in top tab bar
- Build passes clean
