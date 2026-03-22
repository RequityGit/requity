# Prompt: Persistent Activity Sidebar on Deal Pages

## Objective

Add a collapsible activity sidebar to the deal detail page that aggregates all deal communication into a single, persistent feed: internal notes, condition notes (with context badges), borrower messages, and system events. This replaces the current notes section at the bottom of the Overview tab and the standalone Messages tab, unifying them into a sidebar that is accessible from every tab.

## Context

The deal page currently has communication spread across three disconnected locations:

1. **Overview tab bottom** — `<UnifiedNotes entityType="deal">` renders internal team notes with the new single-surface composer, attachments, threading, pins, likes, etc.
2. **Diligence tab** — Condition notes live inside expanded condition rows (migrating to `<UnifiedNotes entityType="unified_condition">`). These are scoped to individual conditions.
3. **Messages tab** — `<DealMessagesPanel>` is a separate borrower messaging system using the `deal_messages` table and `/api/deal-messages/[dealId]` API.

Users must navigate between tabs to see different communication streams. The sidebar unifies everything into one persistent view visible from any tab.

### Approved Visual Design

The mockup at `activity-sidebar-mockup.html` (in project root) has been approved. Key design elements:

- 380px sidebar on the right, separated by `border-left: 1px solid border`
- Sidebar header with "Activity" title, note count badge, and close (collapse) button
- Filter tabs: All, Notes, Conditions, Messages, System (each with count)
- Unified feed showing notes with context badges (Internal = amber, Condition = teal, Borrower Message = blue)
- Date dividers ("Today", "Yesterday", etc.)
- System event entries (stage changes, document uploads)
- Compact note composer at bottom with "Posting to:" context selector for conditions
- Collapsible via "Activity" toggle button in deal header with notification dot for unread items

## Architecture

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DealActivitySidebar` | `components/pipeline/DealActivitySidebar/index.tsx` | Main sidebar container: header, filters, feed, composer |
| `ActivityFeed` | `components/pipeline/DealActivitySidebar/ActivityFeed.tsx` | Scrollable feed rendering mixed note/message/event items |
| `ActivityFeedItem` | `components/pipeline/DealActivitySidebar/ActivityFeedItem.tsx` | Single feed item renderer (note, message, or system event) |
| `ActivityComposer` | `components/pipeline/DealActivitySidebar/ActivityComposer.tsx` | Sticky bottom composer with context selector |
| `ActivityFilters` | `components/pipeline/DealActivitySidebar/ActivityFilters.tsx` | Filter tab bar (All / Notes / Conditions / Messages / System) |
| `useActivityFeed` | `hooks/useActivityFeed.ts` | Hook to fetch + merge notes, deal_messages, and system events into a unified timeline |

### Modified Components

| Component | Change |
|-----------|--------|
| `DealDetailPage.tsx` | Add sidebar layout wrapper, Activity toggle button in header, remove Notes from Overview tab bottom, remove Messages tab (or keep as fallback) |

---

## Changes

### 1. Create `useActivityFeed` hook

This hook aggregates three data sources into one sorted timeline:

```typescript
// hooks/useActivityFeed.ts

interface ActivityItem {
  id: string;
  type: "note" | "condition_note" | "borrower_message" | "system_event";
  timestamp: string;  // ISO string, used for sorting
  // Note fields (when type is "note" or "condition_note")
  noteData?: NoteData;
  conditionName?: string;  // e.g., "Soft / Hard Credit Report"
  conditionId?: string;
  // Message fields (when type is "borrower_message")
  messageData?: DealMessage;
  // System event fields
  eventData?: {
    action: string;     // "stage_changed", "document_uploaded", "condition_cleared"
    description: string;
    actor_name?: string;
  };
  // Common
  isUnread?: boolean;
}

interface UseActivityFeedOptions {
  dealId: string;
  loanId?: string;
  opportunityId?: string;
}

interface UseActivityFeedReturn {
  items: ActivityItem[];
  loading: boolean;
  counts: {
    all: number;
    notes: number;
    conditions: number;
    messages: number;
    system: number;
  };
  refetch: () => void;
}
```

**Data fetching strategy:**

1. **Notes** (internal team notes): Query `notes` table where `deal_id = dealId` (or `loan_id`/`opportunity_id`), `condition_id IS NULL`, `unified_condition_id IS NULL`, `deleted_at IS NULL`. Map to `type: "note"`.

2. **Condition notes**: Query `notes` table where `deal_id = dealId` AND `unified_condition_id IS NOT NULL`, `deleted_at IS NULL`. Join/fetch condition names from `unified_deal_conditions`. Map to `type: "condition_note"` with `conditionName`.

3. **Borrower messages**: Fetch from `/api/deal-messages/${dealId}`. Map to `type: "borrower_message"`.

4. **System events**: Query `deal_activity_log` or `entity_audit_log` for the deal. Map to `type: "system_event"`. If no activity log table exists yet, skip system events in v1 and show a placeholder.

**Merge and sort** all items by `timestamp` descending (newest first).

**Realtime:** Subscribe to:
- `notes` table changes for `deal_id = dealId`
- `deal_messages` broadcast channel (already used by `useDealMessages`)

On any change, re-fetch. Use the same channel pattern as existing `UnifiedNotes` and `useDealMessages`.

### 2. Create `DealActivitySidebar` component

```tsx
// components/pipeline/DealActivitySidebar/index.tsx

interface DealActivitySidebarProps {
  dealId: string;
  loanId?: string;
  opportunityId?: string;
  currentUserId: string;
  currentUserName: string;
  conditions: { id: string; condition_name: string }[];
  onClose: () => void;
}
```

Structure:
```tsx
<aside className={cn(
  "w-[380px] border-l flex flex-col bg-background flex-shrink-0",
  "rq-transition-panel"
)}>
  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
    <div className="flex items-center gap-2">
      <MessageSquare className="h-4 w-4" />
      <span className="text-[13px] font-semibold">Activity</span>
      <span className="text-[11px] text-muted-foreground bg-foreground/[0.06] px-1.5 py-0.5 rounded-full">
        {counts.all}
      </span>
    </div>
    <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition cursor-pointer">
      <ChevronsRight className="h-4 w-4" />
    </button>
  </div>

  {/* Filters */}
  <ActivityFilters ... />

  {/* Feed (scrollable) */}
  <ActivityFeed ... />

  {/* Composer (sticky bottom) */}
  <ActivityComposer ... />
</aside>
```

### 3. Create `ActivityFilters` component

Filter tabs styled identically to the mockup:

```tsx
type ActivityFilter = "all" | "notes" | "conditions" | "messages" | "system";

interface ActivityFiltersProps {
  active: ActivityFilter;
  onChange: (filter: ActivityFilter) => void;
  counts: Record<ActivityFilter, number>;
}
```

Render a row of small pill buttons, each showing label + count. Use the same style pattern as `NoteFilters` in UnifiedNotes:

```tsx
<div className="flex items-center gap-1 px-4 py-2 border-b flex-shrink-0">
  {filters.map(f => (
    <button
      key={f.key}
      onClick={() => onChange(f.key)}
      className={cn(
        "px-2.5 py-1 rounded-md text-[11px] font-medium rq-transition cursor-pointer",
        active === f.key
          ? "bg-foreground/[0.06] text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
      )}
    >
      {f.label}
      <span className="ml-1 text-muted-foreground/60 text-[10px]">{counts[f.key]}</span>
    </button>
  ))}
</div>
```

### 4. Create `ActivityFeed` component

Scrollable feed rendering `ActivityFeedItem` components with date dividers:

```tsx
interface ActivityFeedProps {
  items: ActivityItem[];
  loading: boolean;
  filter: ActivityFilter;
  currentUserId: string;
  onReplyToNote?: (noteId: string) => void;
}
```

- Group items by date (Today, Yesterday, or formatted date)
- Insert date divider components between groups
- Filter items based on active filter before rendering
- Use `ScrollArea` from shadcn for the scrollable container
- Loading state: show 3 skeleton items

### 5. Create `ActivityFeedItem` component

Renders a single item differently based on `type`:

**For `note` and `condition_note`:**
- Avatar (24px, rounded) + author name (12px semibold) + relative time
- Context badges after the time:
  - If `is_internal`: amber badge with Lock icon + "Internal"
  - If `condition_note`: teal badge with FileText icon + condition name (truncated to ~25 chars)
- Note body (12px, muted color, indented under avatar)
- If has attachments: show compact attachment chips below body
- If has replies: show "N replies" link
- Hover: show subtle background (`hover:bg-muted/30`)

**For `borrower_message`:**
- Avatar + sender name + time
- Blue "Borrower Message" context badge
- Message body
- Source icon (email/SMS/portal) next to time

**For `system_event`:**
- No avatar, just a small icon (16px circle with muted bg)
- Single line: description + time
- Indented more than notes (align with note body text)
- More subdued styling (text-muted-foreground, smaller font)

### 6. Create `ActivityComposer` component

Sticky at the bottom of the sidebar. Uses the existing `NoteComposer` component internally but adds a "Posting to:" context selector above it:

```tsx
interface ActivityComposerProps {
  dealId: string;
  loanId?: string;
  currentUserId: string;
  currentUserName: string;
  conditions: { id: string; condition_name: string }[];
  onNotePosted: () => void;
}
```

**Context selector** (above the composer):
```tsx
<div className="flex items-center gap-1.5 px-3 pb-1 text-[10px] text-muted-foreground">
  <span>Posting to:</span>
  <select
    value={postingContext}
    onChange={(e) => setPostingContext(e.target.value)}
    className="bg-transparent border-none text-[10px] font-semibold text-teal-500 dark:text-teal-400 cursor-pointer outline-none"
  >
    <option value="deal">Deal (general)</option>
    {conditions.map(c => (
      <option key={c.id} value={c.id}>{c.condition_name}</option>
    ))}
  </select>
</div>
```

When `postingContext` is `"deal"`, post to `notes` with `deal_id`. When it's a condition UUID, post to `notes` with `unified_condition_id = postingContext` AND `deal_id`.

Use the existing `NoteComposer` component with `compact={true}` and `enterToSend={true}` for chat-like behavior.

The `onPost` callback should:
1. Create the note in the `notes` table with appropriate entity columns
2. Call `onNotePosted()` to trigger feed refetch

### 7. Modify `DealDetailPage.tsx`

This is the most critical change. Transform the layout from full-width tabs to a split layout.

#### 7a. Add sidebar state

```tsx
// Inside DealDetailPageInner:
const [sidebarOpen, setSidebarOpen] = useState(true);  // Default open
```

Persist sidebar preference in localStorage (optional, can skip for v1).

#### 7b. Add Activity toggle button to header

In the `DealHeader` component, add an "Activity" button to the header right section (next to existing action buttons):

```tsx
<Button
  variant="outline"
  size="sm"
  className="h-8 text-xs gap-1.5 relative"
  onClick={() => setSidebarOpen(!sidebarOpen)}
>
  <MessageSquare className="h-3.5 w-3.5" />
  Activity
  {/* Unread notification dot */}
  {hasUnread && (
    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
  )}
</Button>
```

Pass `sidebarOpen` and `setSidebarOpen` down to `DealHeader` as props, or lift the toggle up.

#### 7c. Wrap tab content + sidebar in flex layout

Replace the current tab content area with a flex container:

```tsx
{/* Current structure (simplified): */}
<div className="flex flex-col gap-4 min-w-0">
  {/* tab panels */}
</div>

{/* New structure: */}
<div className="flex gap-0 min-w-0">
  {/* Left: Tab Content (flex-1) */}
  <div className="flex-1 min-w-0 flex flex-col gap-4">
    {/* All existing tab panels stay here exactly as they are */}
  </div>

  {/* Right: Activity Sidebar (conditional) */}
  {sidebarOpen && (
    <DealActivitySidebar
      dealId={deal.id}
      loanId={undefined}
      opportunityId={undefined}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      conditions={conditions.map(c => ({ id: c.id, condition_name: c.condition_name }))}
      onClose={() => setSidebarOpen(false)}
    />
  )}
</div>
```

#### 7d. Remove notes section from Overview tab

Remove or comment out the UnifiedNotes block that currently sits at the bottom of Overview:

```tsx
// REMOVE this block from Overview tab content:
{/* Notes section */}
<div className="mt-4">
  <UnifiedNotes
    entityType="deal"
    entityId={deal.id}
    dealId={deal.id}
    showInternalToggle={true}
    showFilters={true}
    showPinning={true}
  />
</div>
```

Notes are now in the sidebar. The Overview tab keeps: DealOverviewSummary, DealTasks, DealActivityTab (system log).

#### 7e. Keep Messages tab as a fallback (for now)

Don't remove the Messages tab yet. Borrower messaging has different security and audience considerations (borrowers can see these messages). The sidebar shows messages in the unified feed for admin convenience, but the Messages tab remains the primary full-featured borrower messaging interface. In a future iteration, we can evaluate removing the tab.

### 8. Sidebar height and scroll behavior

The sidebar needs to fill the available height from below the tab bar to the bottom of the viewport:

```tsx
<aside className="w-[380px] border-l flex flex-col bg-background flex-shrink-0 h-full overflow-hidden">
```

The parent flex container needs a defined height. Since the deal page uses `min-h-screen` and the content area scrolls, set the flex wrapper to:

```tsx
<div className="flex gap-0 min-w-0" style={{ minHeight: 'calc(100vh - 280px)' }}>
```

The `280px` offset accounts for: breadcrumb (~32px) + header (~80px) + stage stepper (~60px) + note preview (~40px) + tab bar (~48px) + padding. Adjust as needed. Alternatively, use a sticky approach.

The feed inside the sidebar scrolls independently. The composer stays pinned at the bottom.

### 9. Responsive behavior

On screens narrower than 1200px, the sidebar should auto-collapse and be toggled via the Activity button only. Add:

```tsx
// In DealDetailPageInner:
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 1200 && sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

## Data Flow Diagram

```
useActivityFeed(dealId)
  ├── Supabase: notes WHERE deal_id = X AND condition_id IS NULL AND unified_condition_id IS NULL
  │   → type: "note"
  ├── Supabase: notes WHERE deal_id = X AND unified_condition_id IS NOT NULL
  │   → type: "condition_note" (enriched with condition_name from unified_deal_conditions)
  ├── API: /api/deal-messages/${dealId}
  │   → type: "borrower_message"
  └── (v2) Supabase: deal_activity_log WHERE deal_id = X
      → type: "system_event"

All items merged → sorted by timestamp desc → grouped by date → rendered in ActivityFeed
```

## Realtime Subscriptions (inside useActivityFeed)

```typescript
// Notes channel
supabase
  .channel(`sidebar-notes-${dealId}`)
  .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: `deal_id=eq.${dealId}` }, () => refetch())
  .subscribe();

// Deal messages broadcast channel (reuse existing pattern from useDealMessages)
supabase
  .channel(dealMessagesChannelName(dealId))
  .on("broadcast", { event: DEAL_MESSAGES_BROADCAST_EVENT }, () => refetchMessages())
  .subscribe();
```

## Styling Notes

- Use all existing global CSS classes (`.rq-transition`, `.rq-micro-label`, etc.)
- Context badges follow the same pattern as the mockup:
  - Internal: `text-amber-600 dark:text-amber-400 bg-amber-500/10`
  - Condition: `text-teal-600 dark:text-teal-400 bg-teal-500/10`
  - Borrower Message: `text-blue-600 dark:text-blue-400 bg-blue-500/10`
- Date dividers: thin line + uppercase micro label centered
- Note body text: `text-xs text-muted-foreground leading-relaxed`
- Avatars: 24px, `rounded-lg`, use same `getInitials` pattern as NoteComposer
- The sidebar uses `bg-background` (same as page), NOT `bg-card`
- Sidebar border: `border-l border-border`
- The composer at the bottom uses the existing `.comment-composer` and `.comment-surface` CSS classes

## Files to Create

| File | Purpose |
|------|---------|
| `components/pipeline/DealActivitySidebar/index.tsx` | Main sidebar component |
| `components/pipeline/DealActivitySidebar/ActivityFeed.tsx` | Scrollable feed |
| `components/pipeline/DealActivitySidebar/ActivityFeedItem.tsx` | Single item renderer |
| `components/pipeline/DealActivitySidebar/ActivityComposer.tsx` | Bottom composer with context selector |
| `components/pipeline/DealActivitySidebar/ActivityFilters.tsx` | Filter tab bar |
| `hooks/useActivityFeed.ts` | Unified data fetch + realtime hook |

## Files to Modify

| File | Change |
|------|--------|
| `app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage.tsx` | Add sidebar layout, Activity toggle button, remove notes from Overview bottom |

## Files NOT to Modify

- `components/shared/UnifiedNotes/*` — The sidebar uses its own feed, not UnifiedNotes directly. UnifiedNotes continues to work in Diligence tab condition rows.
- `components/pipeline/DealMessagesPanel.tsx` — Keep as-is for the Messages tab. The sidebar reads messages via the same API but renders them in the unified feed.
- `hooks/useDealMessages.ts` — Keep as-is. The sidebar hook fetches messages independently.
- `globals.css` — No new classes needed. Reuse existing `.comment-composer`, `.comment-surface`, `.rq-transition`, etc.
- `components/pipeline/DealNotePreview.tsx` — Keep the pinned/recent note preview strip. It serves a different purpose (quick glance without opening sidebar).

## Implementation Order

1. **Phase 1:** Create `useActivityFeed` hook (data layer)
2. **Phase 2:** Create `ActivityFilters`, `ActivityFeedItem`, `ActivityFeed` components (display layer)
3. **Phase 3:** Create `ActivityComposer` (interaction layer)
4. **Phase 4:** Create `DealActivitySidebar` (container)
5. **Phase 5:** Modify `DealDetailPage.tsx` (integration)
6. **Phase 6:** Test and verify

## Constraints

- `DealDetailPage.tsx` is a large file (~900+ lines). Only modify the specific areas described: the flex layout wrapper, the Overview tab notes removal, and adding the sidebar toggle to the header. Do not refactor or reorganize other parts of the file.
- The `notes` table query must exclude `deleted_at IS NOT NULL` notes (soft delete).
- The sidebar composer must create notes with the correct FK columns: `deal_id` for general notes, `unified_condition_id` + `deal_id` for condition-scoped notes.
- All context badges must work in both light and dark mode (use Tailwind `dark:` variants).
- The sidebar must not break the existing tab navigation or any existing tab functionality.
- The `DealNotePreview` strip (pinned/recent note above tabs) should remain. It provides a quick glance without needing the sidebar open.
- Run `pnpm build` after all changes to verify TypeScript.

## v1 Scope (This Prompt)

**IN scope:**
- Sidebar layout and toggle
- Unified feed with notes + condition notes + borrower messages
- Filter tabs with counts
- Context badges (internal, condition, borrower)
- Date dividers
- Composer with condition context selector
- Realtime updates
- Responsive auto-collapse

**OUT of scope (future iterations):**
- System events in the feed (need activity log table first)
- Unread tracking (needs a `last_read_at` per user per deal)
- Push notifications for @mentions
- Drag-to-resize sidebar width
- Sidebar on loan servicing pages (different layout)

## Success Criteria

1. The deal page has a 380px activity sidebar on the right that shows a unified feed
2. The sidebar is collapsible via an "Activity" button in the deal header
3. Notes from the Overview tab appear in the feed with appropriate context badges
4. Condition notes appear with teal badges showing the condition name
5. Borrower messages appear with blue "Borrower Message" badges
6. Filter tabs (All, Notes, Conditions, Messages) filter the feed correctly with accurate counts
7. Date dividers group items by day (Today, Yesterday, or formatted date)
8. The composer at the bottom allows posting notes to the deal or to a specific condition via the context selector
9. Realtime: new notes and messages appear in the feed without page refresh
10. The Notes section is removed from the bottom of the Overview tab
11. The Messages tab still works as before (fallback for full borrower messaging)
12. Sidebar auto-collapses on screens < 1200px wide
13. Both light and dark mode render correctly
14. No TypeScript errors on `pnpm build`
