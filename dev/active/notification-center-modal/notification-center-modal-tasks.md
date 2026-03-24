# Notification Center Modal - Tasks

## Phase 1: Hook & Provider
- [ ] Create `useNotificationCenter` context provider with open/close, selected notification, Cmd+J shortcut

## Phase 2: Display Components
- [ ] Create `NotificationFilterTabs` (All, Mentions, Threads, Reactions, Assigned)
- [ ] Create `NotificationRow` (compact row with avatar, badges, selected/unread states)

## Phase 3: Left Panel
- [ ] Create `NotificationListPanel` (filters + scrollable list + date grouping)

## Phase 4: Right Panel
- [ ] Create `NotificationDetailPanel` (thread context, entity preview dispatch, reply composer)

## Phase 5: Modal Container
- [ ] Create `NotificationCenter` modal (overlay, header, split layout, footer)

## Phase 6: Entity Preview Cards
- [ ] Create `TaskPreviewCard`
- [ ] Create `ConditionPreviewCard`
- [ ] Create `ApprovalPreviewCard`

## Phase 7: Integration
- [ ] Modify `notification-bell.tsx` to use `useNotificationCenter`
- [ ] Mount provider + modal in authenticated layout

## Phase 8: Cleanup
- [ ] Delete `notification-dropdown.tsx`
- [ ] Clean up unused imports

## Phase 9: Verify
- [ ] Run `pnpm build` and fix any errors

## Last Updated: 2026-03-22
