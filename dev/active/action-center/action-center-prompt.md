# Action Center Tab - Claude Code Implementation Prompt

> Copy this entire prompt into Claude Code. It is self-contained.

---

## Objective

Build an "Action Center" tab as the **first tab** on the deal detail page (`pipeline/[id]`). This tab replaces the current sidebar-based activity workflow with a two-column layout: a **unified live activity stream** on the left and an **execution rail** (conditions + tasks) on the right. No database migrations. No schema changes. All required tables and hooks already exist.

## Why This Is Safe

Every data source, table, and fetch pattern already exists in the codebase. We are **composing existing primitives into a new layout**, not building from scratch. The existing tabs (Overview, Property, Analysis, etc.) remain untouched. We are adding one new tab component and reordering the tab list.

---

## Scope

### IN SCOPE
- New `ActionCenterTab` component (two-column layout)
- Left column: `ActionCenterStream` (unified activity feed)
- Right column: `ActionCenterRail` (conditions + tasks list with inline expand)
- Stream composer at bottom (reuse patterns from `NoteComposer`)
- Filter bar for stream (All, Notes, Emails, Calls, System)
- Make Action Center the first tab in DealDetailPage
- Condition inline expand with details, documents, comments, and action buttons
- Task list with check/uncheck, assignee, due date
- Bottom KPI strip on rail
- **AI Deal Brief**: Collapsible summary card at top of stream (see Phase 6 below)
- **Urgency-ranked Execution Rail**: Conditions and tasks auto-sorted by urgency (see Phase 3 below)

### OUT OF SCOPE
- Do NOT modify any existing tab components (Overview, Property, Analysis, Underwriting, Borrower, Diligence, Forms)
- Do NOT modify database schema or create migrations
- Do NOT modify the `UnifiedNotes`, `ConditionsTab`, or `DealActivityTab` components
- Do NOT remove existing tabs or the `DealActivitySidebar` (keep it functional, just remove auto-open behavior)
- Do NOT build real-time SMS/email sync integrations (manual logging only for now)
- Do NOT touch RLS policies

---

## Existing Infrastructure (READ THESE FILES FIRST)

Before writing any code, read these files to understand existing patterns:

### Data Layer (tables already exist)
```
packages/db/supabase/types.ts
  - unified_deal_activity (system events: stage changes, approvals, etc.)
  - unified_deal_conditions (condition lifecycle)
  - unified_deal_tasks (deal-specific tasks)
  - unified_deal_documents (condition documents)
  - unified_deal_stage_history (stage transitions)
  - notes (multi-entity notes with threading via parent_note_id)
  - note_likes, note_attachments
  - crm_activities (logged calls, meetings, notes, texts)
  - crm_emails (inbound/outbound emails with attachments)
```

### Existing Components to Study (not modify)
```
apps/requity-os/components/pipeline/DealDetailPage.tsx
  -> Tab structure, deal data loading, current tab order

apps/requity-os/components/pipeline/tabs/DealActivityTab.tsx
  -> How it merges unified_deal_activity + crm_activities + crm_emails
  -> Copy its data fetching pattern for the stream

apps/requity-os/components/pipeline/tabs/ConditionsTab.tsx
  -> Condition data fetching, status updates, document management
  -> Copy its condition mutation patterns for the rail

apps/requity-os/components/shared/UnifiedNotes/index.tsx
  -> Note CRUD, threading, pinning, liking patterns
  -> The stream composer should reuse NoteComposer patterns

apps/requity-os/components/pipeline/DealActivitySidebar/TimelineTab.tsx
  -> How it merges timeline items from multiple sources
  -> Useful pattern reference for the unified stream
```

### Design System (MANDATORY)
```
apps/requity-os/app/globals/globals.css
  -> All CSS utility classes (.inline-field, .rq-transition, etc.)
  -> Motion tokens (duration-fast, duration-normal, ease-out-rq)

Read the requity-ui-design skill for full design system rules.
```

---

## Architecture

### File Structure (create these new files)

```
apps/requity-os/components/pipeline/tabs/ActionCenterTab/
  index.tsx                    # Main two-column layout
  DealBrief.tsx                # AI-generated deal summary card
  ActionCenterStream.tsx       # Left: unified activity feed
  ActionCenterStreamItem.tsx   # Individual stream item renderer
  ActionCenterComposer.tsx     # Bottom composer (note/call/email logging)
  ActionCenterRail.tsx         # Right: execution rail
  RailConditionItem.tsx        # Condition row (collapsed + expanded)
  RailTaskItem.tsx             # Task row
  StreamFilters.tsx            # Filter chip bar
  useActionCenterData.ts       # Hook: merges all data sources into unified stream
```

### Data Flow

```
useActionCenterData(dealId)
  |
  |-- Fetch unified_deal_activity (stage changes, system events)
  |-- Fetch notes WHERE deal_id = dealId (user notes)
  |-- Fetch crm_activities WHERE contact_id IN deal's contacts
  |-- Fetch crm_emails WHERE contact_id IN deal's contacts
  |-- Fetch unified_deal_stage_history (for stage change events)
  |
  |-- Merge all into single array sorted by created_at ASC
  |-- Each item has: { type, timestamp, data, author }
  |-- Types: 'note' | 'email' | 'call' | 'sms' | 'meeting' | 'stage_change' | 'system' | 'document'
  |
  Returns: { items, isLoading, addNote, logActivity }
```

```
useConditionsData(dealId) -- reuse pattern from ConditionsTab
  |-- Fetch unified_deal_conditions
  |-- Fetch unified_deal_documents
  |-- Returns: { conditions, updateStatus, uploadDocument }

useTasksData(dealId) -- reuse pattern from existing task fetching
  |-- Fetch unified_deal_tasks
  |-- Returns: { tasks, toggleTask, addTask }
```

---

## Implementation Plan (Execute in Order)

### Phase 1: Data Hook (useActionCenterData)

Create `useActionCenterData.ts`. This is the critical piece. Study how `DealActivityTab.tsx` fetches and merges data. Create a unified type:

```typescript
type StreamItemType = 'note' | 'email_in' | 'email_out' | 'call' | 'sms' | 'stage_change' | 'system' | 'document_upload';

interface StreamItem {
  id: string;
  type: StreamItemType;
  timestamp: string;
  author: {
    id: string;
    name: string;
    initials: string;
    avatarColor?: string;
  };
  content: {
    text?: string;
    subject?: string;      // emails
    body?: string;          // emails
    from?: string;          // emails
    to?: string;            // emails
    attachments?: any[];    // emails, documents
    duration?: number;      // calls (seconds)
    direction?: string;     // calls, emails
    fromStage?: string;     // stage changes
    toStage?: string;       // stage changes
  };
  linkedConditions?: { id: string; name: string }[];
  linkedTasks?: { id: string; name: string }[];
  parentNoteId?: string;    // for threading
  isPinned?: boolean;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
}
```

Fetch all sources in parallel with `Promise.all`. Merge and sort by timestamp ascending (oldest first, newest at bottom for Slack-style scroll).

### Phase 2: ActionCenterStream (Left Column)

Two-section layout:
1. **Filter bar** (top, sticky): Chips for All, Notes, Emails, Calls, SMS, System, Pinned
2. **Feed** (flex: 1, overflow-y: auto, flex-direction: column-reverse for bottom-anchored scroll)
3. **Composer** (bottom, sticky, border-top)

**Feed rendering rules:**
- Group items by date. Insert date divider components between groups.
- Render each item with `ActionCenterStreamItem` based on `type`:
  - `note`: Avatar + author + "Note" tag + text + linked items + reactions + thread
  - `email_in` / `email_out`: Avatar + "Email" tag + email card (subject, body preview, attachments, Reply button). Use "Received"/"Sent" badge.
  - `call`: Avatar + "Call" tag + call card (contact, duration, answered/missed). Include play button placeholder.
  - `sms`: Avatar + "SMS" tag + bubble-style messages (blue outgoing, muted incoming)
  - `stage_change`: Centered pill with from -> to stage, who changed it, when
  - `system`: Compact one-liner (condition received, document uploaded, etc.)
  - `document_upload`: System-style message with file name and condition link

**Composer**: Reuse patterns from `NoteComposer.tsx`:
- Textarea with placeholder "Write a note, log a call, or # to link items..."
- Toolbar: Attach, @mention, Log Call button, Log Email button, Link button, Internal/External toggle, Post button
- On submit: create note via Supabase insert to `notes` table with `deal_id`
- Log Call/Email: create `crm_activity` with appropriate `activity_type`

### Phase 3: ActionCenterRail (Right Column) with Urgency Ranking

Width: 360px. Three sections:
1. **Header** with title "Execution", count badge, All/Conditions/Tasks toggle
2. **Scrollable list** (flex: 1, overflow-y: auto) with:
   - Progress summary bar (conditions X/Y, tasks A/B)
   - Conditions section header with "Add" button
   - Condition items (collapsed by default, click to expand inline)
   - Tasks section header with "Add" button
   - Task items with checkbox, name, due date, assignee
3. **KPI strip** (bottom, sticky): Loan amount, LTV, Close date from deal data

#### URGENCY-RANKED SORTING (Critical Feature)

Both conditions and tasks MUST be auto-sorted by urgency. This is not optional. The rail is a "what needs my attention right now" list, not a creation-order dump.

**Condition sort priority (top to bottom):**
```
1. OVERDUE:    status='pending' AND due_date < today          -> Red indicator
2. DUE SOON:   status='pending' AND due_date within 3 days    -> Amber indicator
3. PENDING:    status='pending' (no due date or due date > 3d) -> Yellow dot
4. ORDERED:    status='ordered' or 'in_review'                 -> Blue dot
5. RECEIVED:   status='received'                               -> Green dot (collapsed by default)
6. WAIVED:     status='waived'                                 -> Gray dot (collapsed by default)
```

**Task sort priority (top to bottom):**
```
1. OVERDUE:    status != 'done' AND due_date < today           -> Red text
2. DUE TODAY:  status != 'done' AND due_date = today           -> Amber text
3. UPCOMING:   status != 'done' AND due_date is future         -> Normal
4. NO DUE DATE: status != 'done' AND due_date is null          -> Normal (after upcoming)
5. COMPLETED:  status = 'done'                                 -> Strikethrough, collapsed group at bottom
```

**Received/Waived conditions and Completed tasks** should be in a collapsible "Done" section at the bottom of each group, collapsed by default with a "Show 4 completed" toggle. This keeps the rail focused on what needs action.

Create a `sortByUrgency` utility function in the hook that applies these rules. The sort must be deterministic (secondary sort by `sort_order` then `created_at`).

Add a small urgency indicator next to overdue items: a subtle red pulse dot (use `.rq-animate-pulse-once` from globals.css) that fires once on mount to draw the eye.

**Condition item (collapsed):**
- Status dot (color by urgency tier, not just status), name, meta (vendor, ETA), status label, note count, chevron

**Condition item (expanded):**
- Description text
- 2-column grid: Vendor, ETA, Assigned To, custom fields
- Documents list (from `unified_deal_documents` where `condition_id` matches)
- Action buttons: Mark Received, Upload, Waive, Edit
- Comments thread (filter `notes` where `unified_condition_id` = condition.id)
- Reply input

**Status updates**: Copy the optimistic update pattern from `ConditionsTab.tsx`. Update `unified_deal_conditions.status` directly via Supabase. Also insert a `unified_deal_activity` record for the status change.

**Task item:**
- Checkbox (toggle `unified_deal_tasks.status` between 'open' and 'done')
- Task name (strikethrough when done)
- Due date (red if overdue)
- Assignee avatar
- Note count + chevron for expand

### Phase 4: Integration into DealDetailPage

In `DealDetailPage.tsx`:

1. Import `ActionCenterTab`
2. Add it as the FIRST tab in the tab array:
```typescript
// Change tab order - Action Center is first
{ id: 'action-center', label: 'Action Center', icon: Zap, badge: unreadCount, component: ActionCenterTab }
// Then existing tabs: Overview, Property, Analysis, Underwriting, Borrower, Forms, Diligence
```
3. Set default active tab to 'action-center' instead of current default
4. Pass `dealId` and `deal` data to ActionCenterTab

**Do NOT remove any existing tabs.** They all stay. We are just adding one and reordering.

### Phase 5: Cleanup and Polish

1. When Action Center tab is active, auto-collapse the DealActivitySidebar if it's open (to avoid duplicate activity views)
2. Add `error.tsx` and `loading.tsx` skeletons for the new tab
3. Wrap ActionCenterStream and ActionCenterRail in `<SectionErrorBoundary>`
4. Empty states: Use `<EmptyState>` component for empty feed and empty conditions/tasks
5. All financial figures use `.num` class
6. All dates go through `@/lib/format` (formatDate, timeAgo, etc.)
7. All toasts use `@/lib/toast` helpers
8. All confirmations use `useConfirm()` hook
9. Run `pnpm build` and fix all TypeScript errors

### Phase 6: AI Deal Brief

This is a collapsible card pinned to the **top of the stream** (above the filter bar). It gives a 3-5 sentence natural language summary of the deal's current status so anyone opening this deal immediately knows where things stand without reading the entire stream.

#### Component: `DealBrief.tsx`

**Layout:**
- Collapsible card with subtle background (`bg-card` with a thin left accent border in `primary`)
- Header row: sparkle/AI icon + "Deal Brief" label + "Updated 2h ago" timestamp + collapse chevron
- Body: 3-5 sentences of plain text summarizing the deal
- Footer: "Refresh" button (ghost, small) to regenerate on demand

**Data inputs (all already available from existing hooks):**
- Deal metadata: amount, stage, days in stage, expected close date, assigned team
- Conditions: total count, received count, pending count, overdue count, names of overdue/blocking conditions
- Tasks: total, done, overdue, names of overdue tasks
- Recent stream activity: last 10 items (who did what, when was last borrower communication)
- Stage history: how long in each stage, when last advanced

**Generation approach:**

Create an API route: `apps/requity-os/app/api/deals/[id]/brief/route.ts`

```typescript
// POST /api/deals/[id]/brief
// 1. Fetch deal data, conditions, tasks, recent activity, stage history from Supabase
// 2. Construct a structured prompt with all the data
// 3. Call Anthropic API (Claude Haiku for speed/cost) with the prompt
// 4. Return the generated summary text
// 5. Cache the result in the deal's metadata or a simple cache table/JSONB field
```

**Prompt template for the AI (embed this in the route):**

```
You are a senior loan officer's assistant at Requity Group, a commercial bridge lender. Generate a concise deal status brief (3-5 sentences, no bullet points, no em dashes) for this deal. Focus on: what is blocking close, what happened recently, what needs attention next, and overall deal health. Be direct and specific. Use actual names, dates, and numbers.

Deal: {name} | {asset_class} | {loan_amount} | Stage: {stage} ({days_in_stage}d) | Close: {expected_close}
Team: {assigned_names}
Conditions: {received}/{total} received. Overdue: {overdue_names}. Pending: {pending_names}.
Tasks: {done}/{total} done. Overdue: {overdue_task_names}.
Last borrower contact: {last_borrower_activity_date} ({days_since} days ago)
Recent activity: {last_5_items_summary}
```

**Example output:**
"Phase 1 Environmental vendor selection is the critical blocker, overdue by 2 days. Appraisal is ordered through ValuTech with ETA 3/28. Borrower responded to term sheet yesterday with counter-points on exit fee and extension fee that need your response. 4 of 8 conditions outstanding. Title is on track, insurance binder received today."

**Caching strategy:**
- Store generated brief in `unified_deals.uw_data` under a `_deal_brief` key: `{ text, generated_at, inputs_hash }`
- On load: if brief exists and is < 4 hours old, show cached version
- If stale or missing: show skeleton, fetch in background, update
- "Refresh" button forces regeneration regardless of cache
- The brief should also regenerate automatically when a condition status changes or stage advances (trigger from the condition/task update functions)

**Fallback if AI is unavailable:**
- If the API call fails or Anthropic key is not configured, show a deterministic template-based summary instead:
  `"{received}/{total} conditions received. {overdue_count} overdue. {pending_tasks} tasks pending. Last activity: {timeAgo(last_activity)}. {days_in_stage} days in {stage}."`
- This ensures the brief always renders something useful even without AI

**Styling:**
```
- Container: rounded-lg border border-border bg-card p-4, with 3px left border in primary color
- AI icon: use Sparkles from lucide-react, 14px, text-primary
- Title: "Deal Brief" in 12px font-semibold
- Timestamp: "Updated {timeAgo}" in 10.5px text-muted-foreground
- Body text: 13.5px text-secondary, line-height 1.6
- Collapse: smooth height transition using rq-transition-panel
- When collapsed: show only first sentence truncated with "..." and expand chevron
```

**Important:** The Deal Brief must NOT block the rest of the Action Center from rendering. Load it asynchronously. Show a 2-line skeleton while loading. If it fails, show the deterministic fallback. The stream and rail must render immediately regardless of brief status.

---

## Critical Rules

1. **No database migrations.** All tables exist. If a column is missing, use JSONB or skip the feature.
2. **No modifications to existing tab components.** This is additive only.
3. **Optimistic updates for all inline saves.** Never call `revalidateDeal` after inline saves.
4. **Use global CSS classes** from globals.css. No inline className constants.
5. **All formatting through `lib/format.ts`**. No raw `toLocaleDateString()`.
6. **All toasts through `lib/toast.ts`**. No direct sonner/useToast imports.
7. **All confirmations through `useConfirm()`**. No inline AlertDialog JSX.
8. **Test dark mode.** The design system is dark-first.
9. **No em dashes** in any text. Use commas, periods, semicolons.
10. **shadcn/ui primitives only.** No custom components where shadcn covers it.
11. **Motion tokens only.** No hardcoded `duration-150` or `ease-in-out`. Use `.rq-transition`, `duration-fast`, etc.
12. **Build after every phase.** Run `pnpm build` after each phase and fix errors immediately.

---

## Dev Docs

Create these files before starting implementation:

```bash
mkdir -p dev/active/action-center/
```

Create the three standard dev doc files (plan, context, tasks) per CLAUDE.md workflow.

---

## Success Criteria

1. Action Center tab loads as the first tab on the deal page
2. Stream shows notes, emails, calls, stage changes merged chronologically
3. Composer creates new notes that appear in the stream immediately (optimistic)
4. Conditions rail shows all deal conditions with correct statuses
5. Clicking a condition expands it inline showing details, documents, and comments
6. Status updates on conditions work (Mark Received, Waive, etc.)
7. Tasks rail shows all deal tasks with checkbox toggle
8. No TypeScript errors on `pnpm build`
9. No regressions on existing tabs (Overview, Property, etc.)
10. Dark mode renders correctly
11. Empty states display properly when no data exists
12. **Conditions are sorted by urgency**: overdue at top, pending next, received/waived collapsed at bottom
13. **Tasks are sorted by urgency**: overdue at top, upcoming next, completed collapsed at bottom
14. **AI Deal Brief** renders at top of stream with deal summary (or deterministic fallback if AI unavailable)
15. Deal Brief loads asynchronously and does not block stream/rail rendering
16. Deal Brief "Refresh" button triggers regeneration

---

## Reference Mockup

See `/deal-workspace-concept.html` in the project root for the interactive design mockup showing exact visual targets for:
- Email cards (inbound/outbound with subject, body preview, attachments)
- SMS bubbles (blue outgoing, gray incoming, delivery status)
- Call cards (answered/missed, duration, recording button)
- Stage change pills (from -> to with strikethrough)
- Condition expanded view (details, documents, actions, comments)
- Task items (checkbox, due date, assignee)
- KPI strip
- Urgency indicators on overdue items
