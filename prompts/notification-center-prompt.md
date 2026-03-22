# Prompt: Split-Panel Notification Center Modal

## Objective

Replace the current notification dropdown and `/notifications` page with a lightning-fast split-panel center modal. Bell icon click (or keyboard shortcut Cmd+J / Ctrl+J) opens a 960px centered modal with: notification list on the left, full thread/context detail on the right, and an inline reply composer. Users can read, respond, and act on notifications without ever leaving their current page.

## Context

### Existing System (What We Have)

The notification system is already fully built. There is a `notifications` table in Supabase, RPCs for marking read/archived, real-time subscriptions, email dispatch, and a complete UI. The upgrade is purely a UI/UX replacement.

**Existing files that will be modified or replaced:**

| File | Current Purpose | Change |
|------|----------------|--------|
| `components/notifications/notification-bell.tsx` | Bell icon + dropdown toggle | Replace dropdown with modal trigger + add Cmd+J shortcut |
| `components/notifications/notification-dropdown.tsx` | 380px dropdown with 15 items | **DELETE** (replaced by modal) |
| `components/notifications/notification-item.tsx` | Single notification row (compact/full variants) | Keep but add "selected" variant for left panel |
| `components/notifications/notifications-page-client.tsx` | Full `/notifications` page with filters | **DELETE** (replaced by modal) |
| `app/(authenticated)/notifications/page.tsx` | Server page wrapper | Redirect to current page with modal open, or remove |

**Existing files to reuse as-is (do NOT modify):**

| File | Purpose |
|------|---------|
| `hooks/use-notifications.ts` | Fetches notifications with filtering, pagination, real-time, archive/read RPCs |
| `hooks/use-unread-count.ts` | Real-time unread count for bell badge |
| `lib/notifications.ts` | Types (`Notification`, `NotificationPriority`, `EntityType`), route resolver (`getNotificationRoute`), format helpers (`formatRelativeTime`, `getPriorityColor`, `getEntityTypeLabel`), `nq()` query helper |
| `components/notifications/notification-priority-badge.tsx` | Priority badge component |
| `hooks/use-notification-preferences.ts` | Preferences management |

### Notification Data Shape

```typescript
interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  notification_type_id: string | null;
  notification_slug: string;       // e.g., "note_mention", "task_assigned", "condition_status_changed"
  title: string;                   // e.g., "Estefania Espinal mentioned you in a note"
  body: string | null;             // Note/message body text (may contain @mention markup)
  priority: "urgent" | "high" | "normal" | "low";
  entity_type: "loan" | "borrower" | "task" | "contact" | "company" | "condition" | ... | null;
  entity_id: string | null;
  entity_label: string | null;     // e.g., "Valor Quest Endeavors"
  action_url: string | null;       // Fallback deep link
  read_at: string | null;
  archived_at: string | null;
}
```

### Available RPCs

- `mark_notification_read(p_notification_id)` — marks single notification read
- `archive_notification(p_notification_id)` — archives single notification
- `archive_all_notifications()` — archives all active for user
- `get_active_notification_count()` — returns unread count

These are already wired in `useNotifications` hook via `markAsRead()`, `archiveNotification()`, `archiveAll()`.

### Existing Helper: `getNotificationRoute(notification, activeRole)`

Already resolves the correct deep link for any notification based on entity_type/entity_id and the user's role. Returns a path string like `/pipeline/abc123?tab=notes` or `/contacts/xyz?tab=notes`.

### Existing Helper: `stripMentionMarkup(text)`

From `lib/comment-utils.ts`. Strips `@[Name](uuid)` markup to plain `@Name` for display.

---

## Design Reference

The approved mockup is at `notification-center-mockup-v3.html` in the project root. Open it for the exact visual target. Key layout specs:

### Modal Dimensions & Positioning
- **Width:** 960px
- **Max height:** 78vh
- **Position:** Centered horizontally, 8-10vh from top
- **Background:** `bg-card` with `border border-border rounded-2xl`
- **Overlay:** `bg-black/60 backdrop-blur-sm`
- **Entry animation:** Scale from 0.97 + fade + translateY(-8px), 200ms ease-out
- **Exit:** Instant (no animation on close)

### Split Layout
- **Left panel:** 380px, notification list with filter tabs
- **Right panel:** Flex-1 (~580px), thread detail with reply composer
- **Divider:** `border-r border-border` on left panel

### Left Panel (Notification List)
- **Header (shared):** "Notifications" title + "N new" count + "Mark all read" button + `esc` keyboard hint
- **Filter tabs:** All, Mentions, Threads, Reactions, Assigned — each with count badge
- **Notification rows:** Compact (28px avatar, 11px text, 1-line body clamp, small type badges)
- **Selected state:** Blue left border + subtle blue background (`bg-blue-500/[0.06]`)
- **Unread state:** Blue left border + blue dot
- **Date group labels:** Sticky "Today", "Yesterday", formatted date headers
- **System events:** Compact single-line rows (no avatar, small icon, indented)

### Right Panel (Thread Detail)
- **Header:** Entity path breadcrumb (e.g., "Valor Quest > Soft / Hard Credit Report") + "Open deal" button
- **Thread feed:** Full conversation history with avatars, timestamps, Internal badges, attachments, reactions
- **Highlighted message:** The specific message that triggered the notification gets a blue left border + blue tinted background
- **Reply composer:** Sticky at bottom with avatar, surface-style textarea, paperclip/emoji/@mention toolbar buttons, Enter to send

### Color-Coded Type Badges (Left Panel)
- **Mention:** `bg-blue-500/10 text-blue-500` (blue)
- **Thread:** `bg-purple-500/10 text-purple-400` (purple)
- **Reaction:** `bg-amber-500/10 text-amber-500` (amber)
- **Task:** `bg-emerald-500/10 text-emerald-500` (green)
- **Condition:** `bg-teal-500/10 text-teal-400` (teal)

---

## Architecture

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `NotificationCenter` | `components/notifications/notification-center.tsx` | Modal container: overlay, header, split layout |
| `NotificationListPanel` | `components/notifications/notification-list-panel.tsx` | Left panel: filters + scrollable notification list |
| `NotificationDetailPanel` | `components/notifications/notification-detail-panel.tsx` | Right panel: thread header, message feed, reply composer |
| `NotificationFilterTabs` | `components/notifications/notification-filter-tabs.tsx` | Filter tab bar (All / Mentions / Threads / Reactions / Assigned) |
| `NotificationRow` | `components/notifications/notification-row.tsx` | Compact row for left panel list (replaces dropdown variant of NotificationItem) |
| `TaskPreviewCard` | `components/notifications/previews/task-preview-card.tsx` | Right panel preview for task assignment/due notifications |
| `ConditionPreviewCard` | `components/notifications/previews/condition-preview-card.tsx` | Right panel preview for condition status change notifications |
| `ApprovalPreviewCard` | `components/notifications/previews/approval-preview-card.tsx` | Right panel preview for approval request notifications |
| `useNotificationCenter` | `hooks/use-notification-center.ts` | Modal state management: open/close, selected notification, keyboard shortcut |

### Modified Components

| Component | Change |
|-----------|--------|
| `notification-bell.tsx` | Remove dropdown rendering, call `useNotificationCenter().open()` on click |
| `app/(authenticated)/layout.tsx` or equivalent | Mount `<NotificationCenter>` at layout level so it's available on every page |

### Deleted Components

| Component | Reason |
|-----------|--------|
| `notification-dropdown.tsx` | Replaced by `NotificationCenter` modal |
| `notifications-page-client.tsx` | Replaced by `NotificationCenter` modal |

---

## Implementation Details

### 1. Create `useNotificationCenter` hook

Global state for the notification center modal. Use a simple React context or a lightweight store.

```typescript
// hooks/use-notification-center.ts

interface NotificationCenterState {
  isOpen: boolean;
  selectedNotificationId: string | null;
  open: (notificationId?: string) => void;
  close: () => void;
  selectNotification: (id: string) => void;
}
```

This hook:
- Manages open/close state for the modal
- Tracks which notification is selected (for the right panel)
- Registers the global keyboard shortcut (Cmd+J / Ctrl+J) to toggle
- Listens for Escape to close

Create a `NotificationCenterProvider` context wrapper that goes in the authenticated layout, so any component can call `useNotificationCenter().open()`.

**Keyboard shortcut registration:**
```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "j") {
      e.preventDefault();
      toggle();
    }
    if (e.key === "Escape" && isOpen) {
      close();
    }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen]);
```

### 2. Create `NotificationCenter` modal

The main modal component. Rendered at the layout level (always mounted, visibility controlled by `useNotificationCenter`).

```tsx
export function NotificationCenter({ userId, activeRole }: { userId: string; activeRole: string }) {
  const { isOpen, close, selectedNotificationId, selectNotification } = useNotificationCenter();
  const { notifications, loading, markAsRead, archiveNotification, archiveAll } = useNotifications(userId, { limit: 50 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]"
         onClick={close}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-[960px] max-h-[78vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl rq-animate-scale-in"
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <NotificationCenterHeader
          unreadCount={unreadCount}
          onMarkAllRead={archiveAll}
        />

        {/* Split layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <NotificationListPanel
            notifications={filteredNotifications}
            loading={loading}
            selectedId={selectedNotificationId}
            onSelect={handleSelect}
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={filterCounts}
          />
          <NotificationDetailPanel
            notification={selectedNotification}
            activeRole={activeRole}
            onClose={close}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t">
          <a href="/settings/notifications" className="text-[11px] font-medium text-muted-foreground hover:text-foreground rq-transition">
            Notification Settings
          </a>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/[0.04] text-[10px]">Cmd</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/[0.04] text-[10px]">J</kbd>
            <span>to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. Create `NotificationFilterTabs`

Filter tabs for the left panel. These filter the notification list client-side based on `notification_slug`.

```typescript
type NotificationFilter = "all" | "mentions" | "threads" | "reactions" | "assigned";

// Mapping filters to notification_slug patterns:
const FILTER_SLUG_MAP: Record<NotificationFilter, string[]> = {
  all: [],  // no filter, show everything
  mentions: ["note_mention"],
  threads: ["note_reply", "thread_reply"],
  reactions: ["note_like", "note_reaction"],
  assigned: ["task_assigned", "task_due_reminder", "approval_requested"],
};
```

Filter matching logic: if `notification.notification_slug` starts with or matches any slug in the filter's list, it passes. The "all" filter shows everything.

Count each filter's matching notifications for the badge numbers.

### 4. Create `NotificationRow`

Compact notification row for the left panel. This is a simplified version of the existing `NotificationItem` "compact" variant, adapted for the split-panel layout:

- 28px avatar (rounded-lg, initials from title actor name)
- Actor name (11px, semibold) + action verb + relative time (right-aligned)
- Body preview (11px, 1-line clamp, muted)
- Type badge(s) + entity label
- Selected state: `bg-blue-500/[0.06] border-l-2 border-l-blue-500`
- Unread state: `border-l-2 border-l-blue-500`
- Click: calls `onSelect(notification.id)` AND `markAsRead(notification.id)`

**Extracting actor name from title:** Most notification titles follow the pattern "Person Name did something". Extract the actor name for the avatar by taking everything before common verbs: "mentioned", "replied", "liked", "assigned", "requested", "uploaded", "moved", "cleared", "updated". If no match, use the first two words.

**Type badge mapping:**
```typescript
function getNotificationTypeBadge(slug: string): { label: string; colorClass: string } | null {
  if (slug.includes("mention")) return { label: "Mention", colorClass: "badge-mention" };
  if (slug.includes("reply") || slug.includes("thread")) return { label: "Thread", colorClass: "badge-thread" };
  if (slug.includes("like") || slug.includes("reaction")) return { label: "Liked", colorClass: "badge-reaction" };
  if (slug.includes("task")) return { label: "Task", colorClass: "badge-task" };
  if (slug.includes("condition")) return { label: "Condition", colorClass: "badge-condition" };
  if (slug.includes("approval")) return { label: "Approval", colorClass: "badge-approval" };
  return null;
}
```

### 5. Create `NotificationDetailPanel`

The right panel. This is the most complex new component. When a notification is selected, it shows:

#### 5a. Detail Header
- Entity path breadcrumb: `entity_label` > condition name (if applicable)
- "Open deal" button that calls `router.push(getNotificationRoute(notification, activeRole))` and closes the modal

#### 5b. Thread Context (where possible)

This is the key UX improvement. When a notification is about a note mention or thread reply, we want to show the full conversation thread, not just the single notification.

**For note-related notifications** (`notification_slug` contains "mention", "reply", "like"):
- The notification has `entity_type` (e.g., "loan", "task", "contact") and `entity_id`
- Fetch notes for that entity from the `notes` table using the same query pattern as `UnifiedNotes`
- If the notification body contains a note, find it in the fetched notes and highlight it
- Show the full thread (parent note + replies) with the triggering note highlighted

**For non-note notifications** (task assignments, condition status changes, approvals, etc.):
Show a rich **Entity Preview Card** instead of just title + body. The right panel should give enough context to triage (act, defer, or dismiss) without leaving the notification center.

**Task Assignment / Due Reminder** (`notification_slug` contains "task"):
- Fetch the task from `ops_tasks` by `entity_id`
- Display:
  - **Task title** (bold, prominent, top of panel)
  - **Status badge** (To Do / In Progress / Done / Blocked) using the task's `status` field
  - **Assignee** with 28px avatar + name
  - **Due date** with overdue styling (red text via `.rq-value-negative`) if past due
  - **Related entity** — the deal, project, or loan it's tied to (clickable `rq-link` that navigates and closes modal)
  - **Description** snippet — first 3-4 lines of the task description, clamped with `line-clamp-4`
  - **Recent activity** — fetch last 2-3 notes for this task from `notes` table (where `entityType = "task"` and `entity_id = task.id`), render as compact message bubbles with avatar + timestamp
  - **"Go to Task" primary CTA** button at the bottom using `getNotificationRoute(notification, activeRole)`

**Condition Status Changes** (`notification_slug` contains "condition"):
- Fetch the condition from `unified_deal_conditions` by `entity_id`
- Display:
  - **Condition name** (bold)
  - **Current status badge** (Pending / In Review / Approved / Waived / etc.)
  - **Associated deal** name as clickable link
  - **Changed by** — actor name extracted from notification title
  - **Condition notes thread** — fetch notes where `entityType = "unified_condition"` and `entity_id = condition.id`, render as compact thread (same as note-related notifications)
  - **Reply composer** at bottom (so users can comment on the condition directly)
  - **"Go to Condition" CTA** linking to the deal's Diligence tab

**Approval Requests** (`notification_slug` contains "approval"):
- Fetch the approval from the relevant entity
- Display:
  - **Approval title** (what's being approved)
  - **Requested by** with avatar + name
  - **Entity context** — deal/loan/project the approval relates to
  - **Description/reason** from the notification body
  - **"Go to Approval" CTA** button

**Generic / Unknown entity types** (fallback):
- Show notification title and body in a clean detail view
- Show a "Go to [entity_label]" button using `getNotificationRoute()`

**Entity Preview Component Structure:**
```tsx
// Inside NotificationDetailPanel, after determining the notification type:
function renderEntityPreview(notification: Notification) {
  const slug = notification.notification_slug;

  if (slug.includes("mention") || slug.includes("reply") || slug.includes("like")) {
    return <ThreadContextView notification={notification} />;
  }
  if (slug.includes("task")) {
    return <TaskPreviewCard notification={notification} />;
  }
  if (slug.includes("condition")) {
    return <ConditionPreviewCard notification={notification} />;
  }
  if (slug.includes("approval")) {
    return <ApprovalPreviewCard notification={notification} />;
  }
  return <GenericNotificationDetail notification={notification} />;
}
```

Each preview card fetches its data on mount (with loading skeleton), caches it for the duration the modal is open, and renders within the right panel's scrollable area. The "Go to [entity]" CTA always uses `getNotificationRoute()` and closes the modal on click.

**Thread fetching approach:**
```typescript
// In NotificationDetailPanel, when selectedNotification changes:
// 1. Determine entity type and ID from the notification
// 2. Fetch notes for that entity
// 3. Find the note that matches the notification (by body text match or note_id if stored in action_url)
// 4. If it's a reply, find the parent thread
// 5. Render the thread with the triggering note highlighted
```

Since we don't store `note_id` on the notification record, match by: extracting a note ID from `action_url` if present, or matching the notification `body` against note bodies in the fetched set. If no match is found, fall back to showing just the notification content without thread context.

#### 5c. Reply Composer

At the bottom of the detail panel, a compact reply composer (only shown for note-related notifications):

- Uses the same composer pattern as `NoteComposer` but compact
- Avatar (28px) + surface textarea + toolbar (paperclip, emoji, @mention, send)
- "Enter to send" behavior
- Posts a reply note to the same entity (using the same `handlePost` logic as `UnifiedNotes`)
- After posting, the new reply appears in the thread feed above
- The composer needs: `currentUserId`, `currentUserName`, entity type/id from the notification

**Important:** The reply composer should post notes with `is_internal: true` by default (matching the existing behavior for deal-level notes). Include the Internal/Visible toggle from `NoteComposer`.

#### 5d. Empty State (no notification selected)

When the modal first opens and no notification is selected:
```tsx
<div className="flex flex-col items-center justify-center h-full text-center px-8">
  <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
  <p className="text-sm font-medium text-muted-foreground">Select a notification</p>
  <p className="text-xs text-muted-foreground/60 mt-1">Click a notification on the left to see details and reply</p>
</div>
```

### 6. Modify `notification-bell.tsx`

Replace the dropdown toggle with a modal trigger:

```tsx
// BEFORE:
const [open, setOpen] = useState(false);
// ... dropdown rendering

// AFTER:
const { open: openCenter } = useNotificationCenter();

return (
  <button
    onClick={() => openCenter()}
    className={cn(
      "relative flex items-center justify-center h-9 w-9 rounded-md transition-colors",
      "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
    aria-label={`Notifications${count > 0 ? ` (${count} active)` : ""}`}
  >
    <Bell className="h-5 w-5" />
    {count > 0 && (
      <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F0719B] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-card">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </button>
);
```

Remove all dropdown state management, click-outside handling, and escape key handling from this component. Those are now handled by `useNotificationCenter`.

### 7. Mount NotificationCenter in authenticated layout

Add `<NotificationCenterProvider>` and `<NotificationCenter>` to the authenticated layout so the modal is available on every page:

```tsx
// In the authenticated layout (find the layout that wraps all admin routes):
<NotificationCenterProvider>
  {/* existing layout content */}
  <NotificationCenter userId={userId} activeRole={activeRole} />
</NotificationCenterProvider>
```

### 8. Auto-select first unread notification

When the modal opens, auto-select the first unread notification (if any) so the right panel immediately shows useful content. If all notifications are read, select the most recent one.

```typescript
useEffect(() => {
  if (isOpen && notifications.length > 0 && !selectedNotificationId) {
    const firstUnread = notifications.find(n => n.read_at === null);
    selectNotification((firstUnread ?? notifications[0]).id);
  }
}, [isOpen, notifications]);
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/use-notification-center.ts` | Context provider + hook for modal state, keyboard shortcut |
| `components/notifications/notification-center.tsx` | Modal container with overlay, header, split layout, footer |
| `components/notifications/notification-list-panel.tsx` | Left panel: filters + notification list |
| `components/notifications/notification-detail-panel.tsx` | Right panel: thread context + reply composer |
| `components/notifications/notification-filter-tabs.tsx` | Filter tab bar |
| `components/notifications/notification-row.tsx` | Compact notification row for list panel |
| `components/notifications/previews/task-preview-card.tsx` | Task entity preview (status, assignee, due date, description, recent notes) |
| `components/notifications/previews/condition-preview-card.tsx` | Condition entity preview (status, deal, condition notes thread + reply) |
| `components/notifications/previews/approval-preview-card.tsx` | Approval entity preview (requester, entity context, description) |

## Files to Modify

| File | Change |
|------|--------|
| `components/notifications/notification-bell.tsx` | Replace dropdown with modal trigger via `useNotificationCenter` |
| Authenticated layout file | Add `<NotificationCenterProvider>` + `<NotificationCenter>` |

## Files to Delete

| File | Reason |
|------|--------|
| `components/notifications/notification-dropdown.tsx` | Replaced by `notification-center.tsx` |

## Files NOT to Modify

- `hooks/use-notifications.ts` — Reuse as-is
- `hooks/use-unread-count.ts` — Reuse as-is
- `lib/notifications.ts` — Reuse all types and helpers as-is
- `components/notifications/notification-priority-badge.tsx` — Reuse as-is
- `hooks/use-notification-preferences.ts` — Reuse as-is
- Any API routes, cron jobs, or database migrations

---

## Implementation Order

1. **Phase 1:** Create `useNotificationCenter` hook with context provider, open/close state, Cmd+J shortcut
2. **Phase 2:** Create `NotificationFilterTabs`, `NotificationRow` components (display layer)
3. **Phase 3:** Create `NotificationListPanel` (left panel with filters + list)
4. **Phase 4:** Create `NotificationDetailPanel` (right panel with thread context + reply)
5. **Phase 5:** Create `NotificationCenter` modal (container assembling all pieces)
6. **Phase 6:** Modify `notification-bell.tsx` to use `useNotificationCenter`
7. **Phase 7:** Mount provider + modal in authenticated layout
8. **Phase 8:** Delete `notification-dropdown.tsx`, update or remove `/notifications` page
9. **Phase 9:** Test and verify

---

## Constraints

- Reuse the existing `useNotifications` hook. Do NOT rewrite the data fetching layer.
- Reuse all existing types, helpers, and RPCs from `lib/notifications.ts`.
- The bell badge (unread count via `useUnreadCount`) must continue to work exactly as before.
- The `getNotificationRoute()` helper must be used for all deep-linking from the "Open deal" button.
- All text rendering must use `stripMentionMarkup()` from `lib/comment-utils.ts` for notification bodies that contain @mention markup.
- The modal must not interfere with other modals/dialogs (useConfirm, sheet panels, etc.). Use a high z-index (`z-[60]` or above).
- Both light and dark mode must work correctly.
- The notification preferences page (`/settings/notifications`) should remain accessible via the footer link.
- Existing notification creation triggers (note mentions, task assignments, etc.) are untouched.
- Run `pnpm build` after all changes.

## v1 Scope (This Prompt)

**IN scope:**
- Split-panel modal with left list + right detail
- Filter tabs with counts (All, Mentions, Threads, Reactions, Assigned)
- Notification row selection with detail view
- Thread context fetching for note-related notifications
- Inline reply composer in detail panel
- Keyboard shortcut (Cmd+J / Ctrl+J)
- Auto-select first unread on open
- Mark as read on select
- Archive individual + archive all
- "Open deal" deep linking

**OUT of scope (future iterations):**
- Keyboard navigation (arrow keys to move through notification list)
- Search/filter by text within notifications
- Notification grouping/batching in the UI (e.g., "3 mentions in Valor Quest")
- Push notifications / browser notifications
- Notification sounds
- Custom notification categories beyond the existing slug-based system
- Removing the `/notifications` page entirely (keep as redirect or minimal fallback for now)

## Success Criteria

1. Bell icon click opens the 960px split-panel modal centered on screen with blur backdrop
2. Cmd+J (Mac) / Ctrl+J (Windows) toggles the modal from anywhere in the app
3. Escape closes the modal
4. Left panel shows all notifications with filter tabs and correct counts
5. Clicking a notification selects it (blue highlight) and shows detail in right panel
6. Right panel shows full thread context for note-related notifications with the triggering message highlighted
7. Reply composer in right panel allows posting a reply directly from the modal
8. Task assignment notifications show a rich preview card with status, assignee, due date, description, and recent activity
9. Condition change notifications show condition name, status, deal link, and condition notes thread with reply composer
10. Approval notifications show the approval context and requester
11. "Open deal" / "Go to [entity]" button deep-links to the correct entity page and closes the modal
12. First unread notification is auto-selected when modal opens
13. Selecting an unread notification marks it as read
14. "Mark all read" archives all active notifications
15. The bell badge continues to show accurate unread counts
16. Modal works correctly in both light and dark mode
17. No TypeScript errors on `pnpm build`

---

## Visual Reference (HTML Mockup)

The full HTML mockup is at `notification-center-mockup-v3.html` in the project root. Open it in a browser for the exact visual target. Key sections to reference:

- **Left panel row styling:** `.nc-row`, `.nc-row.selected`, `.nc-row.unread`
- **Right panel thread messages:** `.nc-msg`, `.nc-msg.highlighted`
- **Reply composer:** `.nc-dc-surface`, `.nc-dc-toolbar`
- **Filter tabs:** `.nc-filter-btn`, `.nc-filter-btn.active`
- **Modal container:** `.nc-modal` with the `modal-in` animation keyframes
- **Badge colors:** `.badge-mention`, `.badge-thread`, `.badge-reaction`, `.badge-task`, `.badge-condition`
