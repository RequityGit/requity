# Notification Center Modal - Implementation Plan

## Objective
Replace the notification dropdown with a 960px split-panel modal (list + detail) triggered by bell click or Cmd+J, enabling read/respond/act without leaving current page.

## Scope
- IN: Split-panel modal, filter tabs, notification row selection, thread context for notes, inline reply, entity preview cards, Cmd+J shortcut, auto-select first unread, mark read on select, archive, deep linking
- OUT: Keyboard navigation (arrow keys), text search, notification grouping, push/browser notifications, sounds, removing /notifications page entirely

## Approach
1. Create `useNotificationCenter` context provider (modal state, keyboard shortcut)
2. Create display components: `NotificationFilterTabs`, `NotificationRow`
3. Create `NotificationListPanel` (left panel with filters + list)
4. Create `NotificationDetailPanel` (right panel with thread context + reply)
5. Create `NotificationCenter` modal container
6. Create entity preview cards (task, condition, approval)
7. Wire bell to open modal, mount provider in layout
8. Delete dropdown, clean up

## Files to Create
- `hooks/use-notification-center.ts`
- `components/notifications/notification-center.tsx`
- `components/notifications/notification-list-panel.tsx`
- `components/notifications/notification-detail-panel.tsx`
- `components/notifications/notification-filter-tabs.tsx`
- `components/notifications/notification-row.tsx`
- `components/notifications/previews/task-preview-card.tsx`
- `components/notifications/previews/condition-preview-card.tsx`
- `components/notifications/previews/approval-preview-card.tsx`

## Files to Modify
- `components/notifications/notification-bell.tsx` - Replace dropdown with modal trigger
- `app/(authenticated)/layout.tsx` - Mount NotificationCenterProvider + NotificationCenter

## Files to Delete
- `components/notifications/notification-dropdown.tsx`

## Risks
- Thread context fetching: matching notification body to note records may be imprecise
- Z-index conflicts with other modals (ConfirmDialog, sheets, etc.)
- Real-time subscription in useNotifications may duplicate with modal's usage

## Success Criteria
1. Bell click and Cmd+J open the 960px modal
2. Left panel shows filtered notification list
3. Right panel shows thread context or entity preview
4. Reply composer works for note-related notifications
5. Both light and dark mode work
6. `pnpm build` passes with no TS errors
