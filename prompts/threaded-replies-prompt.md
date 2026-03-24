# Prompt: Threaded Replies for Notes/Messages

## Objective

Add threaded reply support to the UnifiedNotes system. Users can reply to any note, and replies are grouped under the parent note in a collapsible thread. This works across all entity types (contacts, companies, deals, tasks, projects, approvals, conditions).

## Context

The `notes` table already has a `parent_note_id` column (nullable UUID). The `NoteData` type already includes `parent_note_id: string | null`. The database schema is ready. We just need the UI and query logic.

### Current State
- `notes` table has `parent_note_id` column (FK to `notes.id`, currently always null)
- `NoteData` interface already has `parent_note_id: string | null`
- `NoteCard` has a hover toolbar with Like, Pin, Edit, Delete actions
- `UnifiedNotes/index.tsx` fetches all notes flat, ordered by `created_at desc` (or pinned first for deals)
- Notes are displayed as a flat list with no grouping
- Chat mode (tasks) shows newest at bottom with date dividers

### Key Files
- `apps/requity-os/components/shared/UnifiedNotes/index.tsx` — orchestrator, fetch, post, realtime
- `apps/requity-os/components/shared/UnifiedNotes/NoteCard.tsx` — individual note display + hover toolbar
- `apps/requity-os/components/shared/UnifiedNotes/NoteComposer.tsx` — input (recently redesigned with single-surface pattern)
- `apps/requity-os/components/shared/UnifiedNotes/types.ts` — NoteData, NoteEntityType, etc.
- `apps/requity-os/components/shared/mention-input.tsx` — textarea with @mention support (recently redesigned, uses `forwardRef` with `MentionInputHandle`, has `comment-surface` class pattern)
- `apps/requity-os/app/globals/globals.css` — has `.comment-composer`, `.comment-surface`, `.comment-surface-textarea`, `.comment-toolbar`, `.activity-message`, `.hover-toolbar` classes

### Current Composer Design (Do Not Break)
The NoteComposer and MentionInput were recently redesigned to a single-surface pattern:
- Avatar sits outside, input surface uses `.comment-surface` class
- Borderless textarea blends into the container
- Toolbar (Internal toggle, Paperclip, @, Send) sits inside bottom of the surface
- MentionInput is a `forwardRef` component exposing `MentionInputHandle` with `focus()` and `insertAt()` methods
- Send button is icon-only (arrow icon, no text)
- The `.comment-composer` class is the outer flex container (avatar + surface)

---

## Part 1: Query & Data Grouping

### 1A. Update fetch in `UnifiedNotes/index.tsx`

The fetch query stays the same (get all notes for the entity). The grouping happens client-side.

After fetching, separate notes into two groups:
```typescript
const topLevelNotes = fetchedNotes.filter(n => !n.parent_note_id);
const replyMap = new Map<string, NoteData[]>();

for (const note of fetchedNotes) {
  if (note.parent_note_id) {
    const existing = replyMap.get(note.parent_note_id) || [];
    existing.push(note);
    replyMap.set(note.parent_note_id, existing);
  }
}

// Sort replies oldest-first (chronological conversation flow)
for (const [, replies] of replyMap) {
  replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
```

Store both `topLevelNotes` and `replyMap` in state (or compute them from the flat `notes` array with `useMemo`).

### 1B. Update display loop

Instead of rendering flat `displayNotes`, render `topLevelNotes` and pass each note's replies:

```tsx
{topLevelNotes.map((note) => (
  <NoteThread
    key={note.id}
    note={note}
    replies={replyMap.get(note.id) || []}
    currentUserId={currentUserId}
    showPinning={showPinning}
    compact={isCompact}
    onPin={handlePin}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onToggleLike={handleToggleLike}
    onReply={handleReply}
  />
))}
```

### 1C. Chat mode consideration

In chat mode (tasks), threading still works the same way. Top-level notes are reversed (oldest first), and replies nest under their parent. The reply composer appears at the bottom of the thread, inline.

---

## Part 2: New Component — `NoteThread.tsx`

Create `apps/requity-os/components/shared/UnifiedNotes/NoteThread.tsx`

This component wraps a parent NoteCard and its replies.

**Props:**
```typescript
interface NoteThreadProps {
  note: NoteData;
  replies: NoteData[];
  currentUserId: string;
  showPinning: boolean;
  compact: boolean;
  onPin: (noteId: string, isPinned: boolean) => void;
  onEdit: (noteId: string, body: string, mentionIds: string[]) => void;
  onDelete: (noteId: string) => void;
  onToggleLike: (noteId: string, isLiked: boolean) => void;
  onReply: (parentNoteId: string, body: string, isInternal: boolean, mentionIds: string[]) => Promise<void>;
  currentUserName: string;
  showInternalToggle: boolean;
  defaultInternal: boolean;
}
```

**Behavior:**
- Always renders the parent `NoteCard`
- If replies exist, shows a "N replies" collapse toggle below the parent note
- When expanded, renders reply NoteCards indented under the parent
- At the bottom of the expanded thread, shows a compact inline reply composer
- A "Reply" button in the parent's hover toolbar opens the thread and focuses the reply composer

**Layout:**
```
┌─ Parent NoteCard ──────────────────────────────────────────┐
│  [Avatar]  Author Name  ·  5h ago                          │
│  Note body text here...                                    │
│                                                            │
│  💬 3 replies  ·  Last reply 2h ago          [collapse ▾]  │
│                                                            │
│  ┌─ Reply thread (indented) ─────────────────────────────┐ │
│  │  [Av]  Reply Author  ·  4h ago                        │ │
│  │  Reply body text...                                   │ │
│  │                                                       │ │
│  │  [Av]  Reply Author 2  ·  3h ago                      │ │
│  │  Reply body text...                                   │ │
│  │                                                       │ │
│  │  [Av]  Reply Author 3  ·  2h ago                      │ │
│  │  Reply body text...                                   │ │
│  │                                                       │ │
│  │  [DM]  ┌─ reply composer ──────────────────────────┐  │ │
│  │        │  Reply...                                 │  │ │
│  │        │  ──────────────────────────────────────── │  │ │
│  │        │  [📎] [@ ]                        [Send]  │  │ │
│  │        └───────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Visual Details:**

Reply count line (below parent note, above thread):
```tsx
<button
  type="button"
  onClick={() => setExpanded(!expanded)}
  className="flex items-center gap-2 px-2 py-1.5 ml-[44px] text-[11px] text-muted-foreground hover:text-foreground rq-transition cursor-pointer group"
>
  <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
  <span className="font-medium">
    {replies.length} {replies.length === 1 ? "reply" : "replies"}
  </span>
  <span className="text-muted-foreground/50">·</span>
  <span className="text-muted-foreground/50">
    Last reply {relativeTime(replies[replies.length - 1].created_at)}
  </span>
  <ChevronDown className={`h-3 w-3 rq-transition-transform ${expanded ? "rotate-180" : ""}`} />
</button>
```

The `ml-[44px]` offset aligns with the parent note body (past the avatar + gap). Adjust if compact (use `ml-[36px]` for compact where avatar is 24px + 12px gap).

Reply thread indentation:
```tsx
<div className="ml-[44px] border-l-2 border-border/40 pl-4 mt-1 space-y-0">
  {replies.map(reply => (
    <NoteCard
      key={reply.id}
      note={reply}
      currentUserId={currentUserId}
      showPinning={false}        // No pinning on replies
      compact={true}             // Replies are always compact
      onPin={onPin}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleLike={onToggleLike}
    />
  ))}
  {/* Inline reply composer */}
  {expanded && <ThreadReplyComposer ... />}
</div>
```

Compact offset: `ml-[36px]`

**Collapse behavior:**
- 0 replies: no toggle shown, but "Reply" action in hover toolbar still works (creates first reply)
- 1-2 replies: auto-expanded by default (collapsed takes more effort than it saves)
- 3+ replies: collapsed by default, shows count toggle
- When user clicks "Reply" from hover toolbar: expand thread + focus reply composer

---

## Part 3: Reply Action in Hover Toolbar

### Update `NoteCard.tsx`

Add a "Reply" button to the hover toolbar, ONLY for top-level notes (not for replies):

```tsx
// Add to NoteCardProps:
onReply?: () => void;  // Optional: only passed for top-level notes

// In the hover toolbar, add before the Like button:
{onReply && (
  <HoverToolbarButton
    onClick={onReply}
    title="Reply"
  >
    <Reply className="h-3.5 w-3.5" strokeWidth={1.5} />
  </HoverToolbarButton>
)}
```

Import `Reply` from `lucide-react` (the reply/arrow-bend icon, or use `MessageSquare` if Reply isn't available — check lucide icon set).

The `onReply` callback in `NoteThread` should:
1. Set `expanded = true`
2. Focus the reply composer

---

## Part 4: Inline Reply Composer — `ThreadReplyComposer`

This can be a small sub-component inside `NoteThread.tsx` or a separate file.

It's a simplified version of the NoteComposer: same single-surface pattern but more compact.

```tsx
function ThreadReplyComposer({
  currentUserName,
  showInternalToggle,
  defaultInternal,
  onPost,
  composerRef,
}: {
  currentUserName: string;
  showInternalToggle: boolean;
  defaultInternal: boolean;
  onPost: (body: string, isInternal: boolean, mentionIds: string[]) => Promise<void>;
  composerRef?: React.RefObject<MentionInputHandle | null>;
}) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [posting, setPosting] = useState(false);
  const mentionRef = useRef<MentionInputHandle>(null);

  // Forward ref so parent NoteThread can focus this composer
  useEffect(() => {
    if (composerRef) {
      (composerRef as React.MutableRefObject<MentionInputHandle | null>).current = mentionRef.current;
    }
  }, [composerRef]);

  async function handleSubmit(body: string, mentionIds: string[]) {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      await onPost(body, isInternal, mentionIds);
      setText("");
    } finally {
      setPosting(false);
    }
  }

  const initials = currentUserName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-2 items-start mt-2">
      <div className="h-6 w-6 rounded-lg bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
        <span className="text-[9px] font-semibold text-foreground">{initials}</span>
      </div>
      <MentionInput
        ref={mentionRef}
        value={text}
        onChange={setText}
        onSubmit={handleSubmit}
        placeholder="Reply..."
        disabled={posting}
        submitIcon={
          posting
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Send className="h-3 w-3" />
        }
        rows={1}
        enterToSend={true}
        compact={true}
        extraControls={
          showInternalToggle ? (
            <button
              type="button"
              onClick={() => setIsInternal(!isInternal)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer rq-transition ${
                isInternal
                  ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {isInternal ? <Lock className="h-3 w-3" strokeWidth={2} /> : <LockOpen className="h-3 w-3" strokeWidth={2} />}
              {isInternal ? "Internal" : "Visible"}
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
```

Key differences from NoteComposer:
- Always compact
- Always `enterToSend`
- `rows={1}` (single line at rest, grows on input)
- Placeholder: "Reply..." instead of "Write a note..."
- Smaller avatar (h-6 w-6)
- No Paperclip or @ toolbar buttons (keep it minimal for replies — users can still type @ to mention)

---

## Part 5: Post Reply in `UnifiedNotes/index.tsx`

Add a `handleReply` function:

```typescript
async function handleReply(
  parentNoteId: string,
  body: string,
  isInternal: boolean,
  mentionIds: string[]
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {
    body,
    author_id: currentUserId,
    author_name: currentUserName,
    mentions: mentionIds,
    is_internal: isInternal,
    parent_note_id: parentNoteId,  // <-- THIS IS THE KEY ADDITION
  };

  // Set entity FKs same as handlePost (use the same switch/case logic)
  switch (entityType) {
    case "contact":
      row.contact_id = entityId;
      break;
    case "company":
      row.company_id = entityId;
      break;
    case "deal":
      if (dealId) row.deal_id = dealId;
      if (loanId) row.loan_id = loanId;
      if (opportunityId) row.opportunity_id = opportunityId;
      break;
    case "task":
      row.task_id = entityId;
      break;
    case "project":
      row.project_id = entityId;
      break;
    case "approval":
      row.approval_id = entityId;
      break;
    case "condition":
      row.condition_id = entityId;
      if (loanId) row.loan_id = loanId;
      break;
    case "unified_condition":
      row.unified_condition_id = entityId;
      if (dealId) row.deal_id = dealId;
      if (loanId) row.loan_id = loanId;
      break;
  }

  const { data, error } = await supabase
    .from("notes")
    .insert(row)
    .select()
    .single();

  if (error) {
    toast({
      title: "Failed to post reply",
      description: error.message,
      variant: "destructive",
    });
    return;
  }

  // Optimistic: add reply to the correct parent in the flat notes array
  if (data) {
    const newNote = { ...(data as unknown as NoteData), note_likes: [] };
    setNotes(prev => [...prev, newNote]);
  }

  // Insert mention records (same as handlePost)
  if (data && mentionIds.length > 0) {
    const noteId = (data as unknown as NoteData).id;
    await supabase.from("note_mentions").insert(
      mentionIds.map(userId => ({
        note_id: noteId,
        mentioned_user_id: userId,
      }))
    );
  }

  toast({ title: "Reply posted" });
}
```

Note: This is almost identical to `handlePost` but with `parent_note_id` set. Consider refactoring `handlePost` and `handleReply` to share a common `createNote` function to avoid duplication:

```typescript
async function createNote(
  body: string,
  isInternal: boolean,
  mentionIds: string[],
  parentNoteId?: string
) {
  // ... shared logic ...
  if (parentNoteId) row.parent_note_id = parentNoteId;
  // ... rest of insert + mentions + toast ...
}

// Then:
async function handlePost(body, isInternal, mentionIds) {
  await createNote(body, isInternal, mentionIds);
}
async function handleReply(parentNoteId, body, isInternal, mentionIds) {
  await createNote(body, isInternal, mentionIds, parentNoteId);
}
```

---

## Part 6: Pass Props Through

Update the display loop in `UnifiedNotes/index.tsx` to pass reply-related props:

```tsx
{topLevelNotes.map((note) => (
  <NoteThread
    key={note.id}
    note={note}
    replies={replyMap.get(note.id) || []}
    currentUserId={currentUserId}
    currentUserName={currentUserName}
    showPinning={showPinning}
    showInternalToggle={shouldShowInternalToggle}
    defaultInternal={defaultInternal}
    compact={isCompact}
    onPin={handlePin}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onToggleLike={handleToggleLike}
    onReply={handleReply}
  />
))}
```

---

## Part 7: Realtime

The existing realtime subscription already refetches all notes on any change to the `notes` table for the entity. Since replies have the same entity FK (e.g., `task_id`), they'll be picked up automatically. No changes needed to the realtime subscription.

---

## Part 8: Filters

NoteFilters (Internal Only / External Only) should filter both top-level notes AND replies. Apply the filter before grouping:

```typescript
const filteredNotes = filter === "internal"
  ? notes.filter(n => n.is_internal)
  : filter === "external"
    ? notes.filter(n => !n.is_internal)
    : notes;

// Then group filteredNotes into topLevel + replyMap
```

If a parent note is filtered out but its replies are not (e.g., parent is external, filter is "internal only", reply is internal), the reply becomes orphaned. In this case, simply don't show orphaned replies. The user can switch filter to "All" to see the full thread.

---

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `components/shared/UnifiedNotes/NoteThread.tsx` | Thread wrapper: parent note + collapsible replies + inline reply composer |

### Modified Files
| File | Change |
|------|--------|
| `components/shared/UnifiedNotes/index.tsx` | Group notes by parent_note_id, render NoteThread instead of flat NoteCard, add handleReply (or refactor handlePost to accept parentNoteId) |
| `components/shared/UnifiedNotes/NoteCard.tsx` | Add optional `onReply` prop, add Reply button to hover toolbar |
| `components/shared/UnifiedNotes/types.ts` | No changes needed (parent_note_id already exists on NoteData) |

### Database
No schema changes needed. `parent_note_id` column already exists on the `notes` table.

---

## Constraints

- Do NOT change the NoteComposer or MentionInput design (recently redesigned). The thread reply composer follows the same pattern but is a separate lighter component.
- Replies cannot have replies (single-level threading only). If `parent_note_id` is set, don't show the Reply button in the hover toolbar for that note.
- Replies inherit the entity FKs from the parent (same contact_id, task_id, etc.)
- Replies can have their own `is_internal` flag independent of the parent
- Replies cannot be pinned (showPinning=false for reply NoteCards)
- Replies are always rendered compact (even if the parent is not)
- When a parent note is deleted (soft delete), its replies should still be fetched but the parent shows as "[deleted]". Actually, simpler: since we filter `deleted_at IS NULL`, deleted parents and their replies just disappear. This is fine.
- The hover toolbar's Reply icon: use `Reply` from lucide-react. If not available, use `CornerDownRight` or `MessageSquareReply`. Check what's in the installed lucide version.
- Run `pnpm build` after all changes
- Dark mode must work

## Edge Cases

1. **Note with 0 replies:** No thread toggle shown. Reply button in hover toolbar creates the first reply and auto-expands.
2. **Note with 1-2 replies:** Auto-expanded by default (set initial state based on count).
3. **Note with 3+ replies:** Collapsed by default, shows "N replies" toggle.
4. **Pinned note with replies:** Pinned note still shows at top. Thread expands normally.
5. **Chat mode (tasks):** Threading works the same. The main composer at the bottom posts top-level. Reply composers are inside threads.
6. **Filter hides parent but not reply:** Don't show orphaned replies.
7. **Deleting a parent with replies:** All disappear (soft-delete filter handles this). Replies stay in DB but aren't shown since parent is deleted.

## Success Criteria

1. Users can click "Reply" on any top-level note's hover toolbar
2. The thread expands showing existing replies and an inline reply composer
3. Reply composer uses the same single-surface pattern (compact, enter-to-send)
4. Replies are indented with a left border line under the parent
5. "N replies" toggle shows count and last reply time
6. Threads with 3+ replies are collapsed by default
7. Replies appear in chronological order (oldest first within a thread)
8. Top-level notes stay in their normal order (newest first, or pinned first for deals)
9. Realtime updates work (new replies from other users appear via the existing subscription)
10. All existing features (mentions, likes, pins, edit, delete, internal/external) still work
11. Replies cannot be replied to (single-level threading)
12. No TypeScript errors on `pnpm build`
