# Unified Activity Sidebar — Context

## Key Files
- `DealDetailPage.tsx` — Main page layout, flex container at line 538, sidebar at line 667
- `DealActivitySidebar/index.tsx` — Current sidebar (186 lines), tabs: All/Notes/Conditions/Messages
- `DealActivityTab.tsx` — Bottom timeline (755 lines), merges 3 data sources, has item renderers
- `useActivityFeed.ts` — Hook for notes/messages (261 lines), real-time subscriptions
- `actions.ts` — Server actions: fetchActivityTabData, logDealActivityRich, logQuickActionV2
- `deal-tasks.tsx` — Task list component (317 lines), optimistic completion

## Decisions Made
- Timeline items are NOT expandable in collapsed sidebar (Phase 7)
- Tasks removed entirely from deal page (Phase 2 adds Tasks tab)
- Reuse fetchActivityTabData server action, no new endpoints
- QuickActions: Email/Call use logQuickActionV2, Note focuses composer, Meeting uses logDealActivityRich

## Last Updated: 2026-03-22
## Next Steps: Create useUnifiedTimeline.ts hook
