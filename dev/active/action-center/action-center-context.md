# Action Center - Context

## Key Files
- DealDetailPage.tsx: Tab structure, UNIVERSAL_TABS array, lazy loading pattern
- useUnifiedTimeline.ts: Existing hook for merging deal activities + CRM activities + emails
- fetchActivityTabData: Server action that fetches from unified_deal_activity, crm_activities, crm_emails
- ConditionsTab.tsx: Condition grouping, status updates, document management
- UnifiedNotes/index.tsx: Note CRUD, threading, pinning patterns
- NoteComposer.tsx: Composer UI with internal/external toggle, attachments, mentions
- actions.ts: logDealActivityRich, logQuickActionV2, updateConditionStatusAction

## Decisions Made
- Reuse useUnifiedTimeline pattern for activity stream (fetchActivityTabData + notes)
- Conditions rail reuses updateConditionStatusAction from pipeline/actions.ts
- Tasks use direct Supabase client calls (same pattern as existing task components)
- Composer follows NoteComposer patterns but simplified (no mentions/emoji initially)

## Gotchas Discovered
- DealDetailPage uses lazy() for heavy tabs; ActionCenterTab should also be lazy-loaded
- Tab backward compat: old params redirect in resolvedTabParam
- Sidebar auto-collapses on narrow screens; should also collapse when Action Center is active

## Dependencies
- fetchActivityTabData server action (exists)
- updateConditionStatusAction server action (exists)
- UnifiedNotes component patterns (exists)
- EmptyState, SectionErrorBoundary (exist)

## Last Updated: 2026-03-22
## Next Steps: Phase 1 - Create useActionCenterData hook
