# Notification Center Modal - Context

## Key Files
- `lib/notifications.ts` - Types (Notification, EntityType), helpers (getNotificationRoute, formatRelativeTime, getEntityTypeLabel)
- `lib/comment-utils.ts` - stripMentionMarkup, parseComment for @mention display
- `hooks/use-notifications.ts` - Query hook with real-time, markAsRead, archive, archiveAll
- `hooks/use-unread-count.ts` - Real-time unread count via RPC
- `components/notifications/notification-bell.tsx` - Current bell + dropdown trigger
- `components/notifications/notification-dropdown.tsx` - Current 380px dropdown (TO DELETE)
- `components/notifications/notification-item.tsx` - Existing compact/full row variants (keep for reference)
- `components/shared/UnifiedNotes/NoteComposer.tsx` - Composer pattern with MentionInput, attachments, emoji
- `app/(authenticated)/layout.tsx` - Auth layout with providers (ConfirmProvider wraps children)

## Decisions Made
- Use React context (not external store) for modal state - matches existing patterns (ConfirmProvider)
- Reuse `useNotifications` hook as-is with limit: 50
- Client-side filtering for tabs (All/Mentions/Threads/Reactions/Assigned)
- Thread fetching: query notes table by entity_type + entity_id from notification
- Preview cards fetch their own data on mount with loading skeletons
- Z-index: use z-[60] to sit above other modals (ConfirmProvider, sheets)

## Gotchas Discovered
- Layout is a server component - need to pass userId and role as props to client provider
- NotificationBell is rendered in Topbar, not layout directly
- useNotifications creates its own Supabase subscription channel per instance

## Last Updated: 2026-03-22
## Next Steps: Begin Phase 1 implementation
