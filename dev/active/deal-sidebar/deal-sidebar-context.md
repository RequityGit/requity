# Deal Sidebar - Context

## Key Files
- `DealDetailPage.tsx` - Main deal page, lines 492-583 are the content area
- `components/tasks/deal-tasks.tsx` - DealTasks component (332 lines)
- `components/shared/UnifiedNotes/index.tsx` - UnifiedNotes component (487 lines, has `compact` prop)
- `components/pipeline/tabs/DealActivityTab.tsx` - Activity timeline (765 lines)
- `components/ui/tabs.tsx` - shadcn Tabs (Radix-based)

## Decisions Made
- Sub-tabs within sidebar (not stacked panels)
- Activity at bottom of Overview (not in sidebar)
- Resizable width with ~340px default
- Default open
- No external dependency for resize (CSS + drag handle approach)

## Dependencies
- DealTasks needs: dealId, dealLabel, dealEntityType, tasks, profiles, currentUserId
- UnifiedNotes needs: entityType, entityId, dealId, showInternalToggle, showFilters, showPinning, compact
- DealActivityTab needs: dealId, currentUserId, primaryContactId

## Last Updated: 2026-03-15
## Next Steps: Build DealSidebar.tsx, then wire into DealDetailPage
