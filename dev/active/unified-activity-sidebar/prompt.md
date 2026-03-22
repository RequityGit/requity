# Unified Activity Sidebar — Implementation Prompt

## Context

We are replacing the fragmented activity system on the pipeline deal detail page. Currently activity is split between two locations:

1. **Sidebar (DealActivitySidebar)** — right side panel with tabs for All, Notes, Conditions, Messages. Uses `useActivityFeed` hook. Located at `components/pipeline/DealActivitySidebar/`.
2. **Bottom of Overview tab (DealActivityTab)** — full timeline showing stage changes, CRM activities (calls, meetings), and emails. Located at `components/pipeline/tabs/DealActivityTab.tsx`. Uses `fetchActivityTabData` server action.
3. **Tasks section (DealTasks)** — also on the overview tab body, above DealActivityTab.

The team has to scroll past all deal fields to see activity. The sidebar only shows notes/conditions/messages but misses system events, emails, calls.

## Objective

Consolidate all deal activity into a single, unified sidebar with four tabs: **Timeline**, **Notes**, **Conditions**, **Tasks**. Remove DealActivityTab and DealTasks from the overview tab body. The overview tab becomes purely deal data.

## Visual References

Two HTML mockups exist in the repo root. These are the source of truth for the UI:

- **`unified-activity-sidebar-v3.html`** — The collapsed sidebar (420px). Shows:
  - Deal Intelligence banner (AI-generated summary of what needs attention)
  - SLA timer (ring showing days in stage vs target)
  - Quick action buttons (Email, Call, Note, Meeting, Reminder)
  - Timeline tab with filter chips (All, Email, Calls, Stages, Tasks, System) and counts
  - Smart nudges (e.g., "Borrower hasn't responded in 48h" with action button)
  - Notes tab with pinned section, threaded replies, @mentions, like/reply/remind actions
  - Conditions tab with summary stats bar (pending/received/waived counts), upload zones on pending conditions
  - Tasks tab with overdue/due today/upcoming/completed grouping, progress bar, priority badges, due dates, assignees
  - Activity analytics bar (activities count, emails count, avg reply time, deal age)
  - Quick templates (Follow up on conditions, Send term sheet, etc.)
  - Search bar with `/` keyboard shortcut
  - Keyboard hints footer (/, N, T, E, R)

- **`unified-sidebar-expanded.html`** — The expanded split-view panel. Shows:
  - Click expand button (diagonal arrows) to transition sidebar into a wide overlay panel
  - Left column: timeline list (same as collapsed view)
  - Right column: detail panel for selected item
  - Email detail: full body, attachments with View button, tracking data (delivered, opened, timestamps), Reply/Forward/Remind actions
  - Call detail: summary, participants, duration, direction, Add Note/Send Follow-up actions
  - Stage change detail: full stage history timeline with dates and time in each stage, benchmarks
  - Empty state when nothing selected: "Select an item — Click any timeline event to see full details here"
  - Clicking an item in collapsed mode auto-expands the sidebar first
  - Deal body dims behind the expanded panel

## Layout Architecture

The sidebar should start at the **tab content level** (below the deal header, stage progress bar, and tab bar). Those top elements span full width. Below the tab bar, the page splits into:
- **Left:** Tab content (scrollable)
- **Right:** Activity sidebar (sticky, full remaining height)

The sidebar does NOT scroll with the tab content. It stays pinned.

## Implementation Plan

### Phase 1: Unified Timeline Tab (merge DealActivityTab into sidebar)

**Goal:** Add a "Timeline" tab to the existing sidebar that shows everything DealActivityTab currently shows.

1. Create a new `useUnifiedTimeline` hook that merges data from:
   - `unified_deal_activity` (stage changes, system events) — currently fetched by `fetchActivityTabData`
   - `crm_activities` (calls, meetings, notes) — currently fetched by `fetchActivityTabData`
   - `crm_emails` (emails with tracking) — currently fetched by `fetchActivityTabData`
   - Existing `useActivityFeed` data (notes, conditions, messages)

2. Add the Timeline tab to `DealActivitySidebar/index.tsx`:
   - New tab: Timeline (default active)
   - Existing tabs shift: Notes, Conditions (keep as-is)
   - Move filter chips from DealActivityTab into the sidebar timeline
   - Render timeline items using existing renderers: `CrmActivityTimelineItem`, `DealActivityTimelineItem`, `EmailTimelineItem` — but adapt them for the narrower sidebar width

3. Add quick action buttons row above the filters (Email, Call, Note, Meeting). These call the existing `logDealActivityRich` and `logQuickActionV2` server actions.

4. Add filter chips with counts (All, Email, Calls, Stages, Tasks, System).

### Phase 2: Tasks Tab (move from overview body to sidebar)

**Goal:** Move DealTasks into the sidebar as a fourth tab.

1. Extract the task list rendering from wherever DealTasks currently lives.
2. Create a Tasks tab in the sidebar with:
   - Stats row: Overdue / Due Today / Upcoming / Done counts
   - Progress bar
   - Task items grouped by urgency (Overdue → Due Today → Upcoming → Completed)
   - Each task shows: checkbox, title, priority badge, due date, assignee
   - Add task button in footer
3. Wire up to existing task CRUD actions.

### Phase 3: Remove bottom activity section

**Goal:** Clean up the overview tab.

1. Remove `<DealActivityTab>` from the Overview tab
2. Remove `<DealTasks>` from the Overview tab
3. The overview tab should now be purely deal data: fields, financials, people, proposed terms
4. Clean up any orphaned imports or dead code

### Phase 4: Deal Intelligence Banner

**Goal:** Add the AI summary at the top of the Timeline tab.

1. Create `DealIntelligenceBanner` component
2. Logic to generate insights:
   - Check for overdue tasks (query tasks where due_date < now and not completed)
   - Check for pending conditions count
   - Check SLA: days in current stage vs target (if we have stage duration targets)
   - Check for stale deals: last activity > X days ago
   - Check for positive signals: appraisal within range, LTV below threshold
3. Render as a gradient banner with dot-colored items
4. This can be a simple rule-based system first (no AI needed), upgraded to AI-generated later

### Phase 5: SLA Timer

**Goal:** Show how long the deal has been in the current stage.

1. Calculate from `unified_deals.stage` and the last stage change timestamp in `unified_deal_activity`
2. Display as a ring chart with days count
3. If we have stage duration targets (could be a new field on card types or a config), show target and remaining
4. Color: green if on track, yellow if approaching target, red if over

### Phase 6: Smart Nudges

**Goal:** Surface actionable alerts inline in the timeline.

1. Create `SmartNudge` component
2. Rules engine:
   - "Borrower hasn't responded in X hours" — check last inbound email/message date
   - "Task overdue" — check tasks with past due dates
   - "Condition pending for X days" — check conditions requested date
3. Each nudge has: icon, title, subtitle, action button, dismiss button
4. Dismissed nudges stored in localStorage or a user preference

### Phase 7: Expanded Split-View

**Goal:** Clicking the expand button transitions the sidebar into a wide overlay with detail panel.

1. Add expanded state to sidebar component
2. When expanded:
   - Sidebar becomes `position: absolute` or uses a Sheet/Dialog pattern
   - Width expands to ~calc(100% - 60px) of the deal page area
   - Left column: same timeline list
   - Right column: detail panel showing full content of selected item
3. Detail panels per type:
   - **Email:** Full body, from/to/cc, attachments, tracking (delivered/opened/bounced), Reply/Forward actions
   - **Call:** Summary, participants, duration, direction
   - **Stage change:** Stage history timeline with time in each stage
   - **Task:** Full task details with subtasks, comments
   - **Note:** Full note with thread
4. Clicking an item in collapsed mode auto-expands, then shows detail
5. Deal body gets `opacity: 0.15; pointer-events: none` when expanded

### Phase 8: Activity Analytics + Quick Templates

**Goal:** Add the analytics bar and template chips at the bottom of the Timeline tab.

1. Analytics bar: count activities this week, count emails, calculate avg response time, deal age
2. Quick templates: pre-built action templates (Follow up on conditions, Send term sheet, etc.) that pre-fill the log activity form

### Phase 9: Sidebar Position Fix

**Goal:** Pin the sidebar to start at the tab content level.

1. In `DealDetailPage.tsx`, restructure the layout so:
   - Deal header + stage bar + tab bar span full width
   - Below tab bar: flex container with tab content (scrollable, flex:1) + sidebar (sticky, fixed height)
2. Sidebar should use `position: sticky; top: [header height]; height: calc(100vh - [header height])`
3. Sidebar should NOT scroll with the tab content

## Technical Notes

### Data Sources to Merge

| Current Source | Data | Current Location |
|---|---|---|
| `useActivityFeed` hook | Notes, condition notes, borrower messages | Sidebar |
| `fetchActivityTabData` action | `unified_deal_activity`, `crm_activities`, `crm_emails` | Bottom of page |
| DealTasks component | Tasks for this deal | Overview tab body |

### Existing Components to Reuse

- `NoteCard` — keep for Notes tab
- `NoteComposer` / `ActivityComposer` — keep for note creation
- `CrmActivityTimelineItem` — adapt for sidebar width
- `DealActivityTimelineItem` — adapt for sidebar width
- `EmailTimelineItem` — adapt for sidebar width, add expandable in collapsed mode
- `SystemEventItem` — keep
- `MessageItem` — keep

### Components to Remove After Migration

- `DealActivityTab.tsx` (bottom of page timeline) — fully replaced by Timeline tab
- DealTasks rendering from overview tab — replaced by Tasks tab
- The old "Log Activity" form at the bottom of the overview — replaced by quick actions in sidebar

### Key Files

```
components/pipeline/DealActivitySidebar/
  index.tsx              # Main sidebar — ADD Timeline and Tasks tabs
  ActivityFilters.tsx     # Tab filter — UPDATE tab options
  ActivityFeed.tsx        # Feed renderer — UPDATE to handle timeline items
  ActivityFeedItem.tsx    # Item renderer — UPDATE to render all activity types
  ActivityComposer.tsx    # Note composer — KEEP

components/pipeline/tabs/
  DealActivityTab.tsx     # REMOVE after migration (755 lines)

hooks/
  useActivityFeed.ts      # EXTEND or create useUnifiedTimeline alongside it

app/(authenticated)/(admin)/pipeline/[id]/
  DealDetailPage.tsx      # UPDATE layout structure
  actions.ts              # REUSE existing server actions
```

### Design System Compliance

- All new components use global CSS classes from `globals.css` (see CLAUDE.md for full list)
- Timeline items use `.inline-field` hover pattern where editable
- Use `rq-micro-label` for date group headers
- Use `rq-transition` for hover states
- Financial values use `.num` class
- Empty states use `<EmptyState>` component
- Toasts use `lib/toast.ts` helpers
- Confirmations use `useConfirm()` hook
- Animations use motion tokens (`duration-fast`, `ease-out-rq`, etc.)
- Error boundaries: `<SectionErrorBoundary>` around each tab panel
- Loading states: use shared skeletons

### What NOT to Build (Out of Scope)

- No changes to the database schema (all data sources already exist)
- No new API endpoints (reuse existing server actions)
- No changes to the Notes, Conditions, or Messages functionality (just move them into the new tab structure)
- No AI/LLM calls for Deal Intelligence (use rule-based logic first)
- No email sending from the sidebar (Reply/Forward buttons open the existing email flow)
- No drag-and-drop task reordering (just display)
- No real-time Supabase subscriptions changes (keep existing subscription pattern)

## Phasing Strategy

Start with **Phase 1 + Phase 3 + Phase 9** together — this is the minimum viable change that consolidates activity and fixes the layout. Then layer on Phase 2 (Tasks), Phase 4-6 (intelligence features), Phase 7 (expanded view), and Phase 8 (analytics/templates) as follow-ups.

Build and typecheck (`pnpm build`) after each phase. Update dev docs after each phase.
