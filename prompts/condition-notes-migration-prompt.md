# Prompt: Migrate Condition Notes to UnifiedNotes

## Objective

Replace the custom `ConditionNoteThread` component in `DiligenceTab.tsx` with the shared `UnifiedNotes` component. This eliminates ~230 lines of duplicated notes logic and brings condition notes up to parity with deal-level notes: new single-surface composer, attachments, threaded replies, pins, likes, editable notes, hover toolbar, and all other features.

## Context

There are currently TWO separate notes implementations for conditions:

1. **`ConditionNoteThread`** (lines 932-1160 in `DiligenceTab.tsx`) — Custom component with its own fetch, realtime subscription, post logic, and inline rendering. Uses the OLD MentionInput directly (without the new `comment-surface` wrapper, no attachments, no threading, no pins, no likes hover toolbar, no edit). This is the old box-in-a-box composer style.

2. **`UnifiedNotes`** (`components/shared/UnifiedNotes/index.tsx`) — The shared system that already supports `entityType: "unified_condition"`. It has the new single-surface composer, attachments, threaded replies, pins, likes, edit, hover toolbar, realtime, and all recent improvements.

`UnifiedNotes` already supports conditions. It maps `entityType: "unified_condition"` to `unified_condition_id` in the entity column mapping. The migration is straightforward: replace the custom component with the shared one.

## Current ConditionNoteThread Usage

In `DiligenceTab.tsx`, inside the expanded condition row (around line ~2300 area), the component is used like:

```tsx
<ConditionNoteThread
  conditionId={condition.id}
  dealId={dealId}
  noteCount={condition.note_count ?? 0}
  currentUserId={currentUserId}
  currentUserName={currentUserName}
/>
```

## Changes

### 1. Replace ConditionNoteThread with UnifiedNotes

Where `ConditionNoteThread` is rendered in the expanded condition row, replace with:

```tsx
<div className="flex flex-col gap-3">
  <div className="flex items-center justify-between">
    <span className="rq-micro-label">Condition Notes</span>
    <span className="text-xs text-muted-foreground num">{condition.note_count ?? 0}</span>
  </div>
  <UnifiedNotes
    entityType="unified_condition"
    entityId={condition.id}
    dealId={dealId}
    loanId={loanId}
    compact
  />
</div>
```

Key props:
- `entityType="unified_condition"` — tells UnifiedNotes to filter by `unified_condition_id`
- `entityId={condition.id}` — the condition's UUID
- `dealId={dealId}` — so notes also get the deal FK (for aggregation in the future sidebar)
- `loanId={loanId}` — if available, pass it through
- `compact` — conditions are in a tight expanded row, compact mode fits better
- `showInternalToggle` — defaults to `true` for condition types (handled automatically in UnifiedNotes)
- `showFilters` — defaults to `true` for condition types (handled automatically in UnifiedNotes)
- `showPinning` — defaults to `true`

### 2. Delete the ConditionNoteThread function

Remove the entire `ConditionNoteThread` function (lines ~932-1160) from `DiligenceTab.tsx`. This removes:
- Custom fetch with its own Supabase query
- Custom realtime subscription
- Custom post logic
- Custom note rendering (no hover toolbar, no likes, no attachments, no threading)
- Custom MentionInput usage with old styling
- Custom internal/visible toggle
- Duplicate `getInitials` function
- Duplicate `segmentsToNodes` function
- All the state management (`notes`, `loading`, `text`, `isInternal`, `posting`)

### 3. Add UnifiedNotes import

At the top of `DiligenceTab.tsx`, add:

```tsx
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
```

### 4. Remove unused imports from DiligenceTab.tsx

After deleting `ConditionNoteThread`, check for imports that were only used by that component and remove them. These likely include:
- `MentionInput` (if not used elsewhere in DiligenceTab)
- `parseComment`, `relativeTime` from comment-utils (if not used elsewhere)
- `NoteData` type (if not used elsewhere)
- `Globe` from lucide-react (if not used elsewhere)
- `Loader2`, `Send`, `Lock` from lucide-react (check if used elsewhere in DiligenceTab)
- `createClient` (check if still needed for other uses in DiligenceTab)

Only remove imports that have zero other usages in the file. DiligenceTab is a large file with many features; some of these imports may be used by other functions.

### 5. Verify currentUserId/currentUserName handling

`ConditionNoteThread` receives `currentUserId` and `currentUserName` as props from the parent. `UnifiedNotes` fetches these internally on mount via `supabase.auth.getUser()`. This means:
- No need to pass user props to `UnifiedNotes`
- If `currentUserId` and `currentUserName` are ONLY used by `ConditionNoteThread` in DiligenceTab, they may become unused. Check if they're used by other parts of the component. If so, keep them. If not, remove them.

## What Users Get After Migration

Condition notes will now have:
- New single-surface composer (borderless textarea, integrated toolbar, icon-only send)
- File attachments via Paperclip button and drag-and-drop
- Threaded replies (reply to any condition note)
- Pin a condition note
- Like/react to condition notes
- Edit own notes (no time limit)
- Hover toolbar (Like, Reply, Pin, Edit/Delete menu)
- @mention with updated dropdown
- Internal/Visible toggle (already existed, now uses the lean amber/emerald style)
- Note filters (All / Internal Only / External Only)
- Realtime updates (already existed, now through UnifiedNotes)

## Files to Modify

| File | Change |
|------|--------|
| `components/pipeline/tabs/DiligenceTab.tsx` | Delete `ConditionNoteThread` (~230 lines), replace usage with `<UnifiedNotes>`, add import, clean up unused imports |

## Files NOT to Modify

- `components/shared/UnifiedNotes/*` — no changes needed, already supports `unified_condition`
- `components/shared/mention-input.tsx` — no changes
- `globals.css` — no changes

## Constraints

- DiligenceTab.tsx is a very large file (~2500+ lines). Be careful with the deletion; only remove the `ConditionNoteThread` function and its usage. Do not modify other functions in the file.
- The "CONDITION NOTES" section header and note count display should be preserved (wrap `UnifiedNotes` in the same header layout).
- Make sure `dealId` and `loanId` are available in the scope where `ConditionNoteThread` was rendered. They should already be available as they're used by other parts of the expanded condition row.
- Run `pnpm build` after changes to verify TypeScript. The deletion of ~230 lines and cleanup of imports could surface unused variable warnings or missing import issues.

## Success Criteria

1. Condition notes in the Diligence tab use the new single-surface composer with all recent features
2. Attachments can be added to condition notes
3. Threaded replies work on condition notes
4. Pin, like, edit, delete all work on condition notes via hover toolbar
5. The "CONDITION NOTES" header and count are still shown
6. Realtime updates still work (new notes appear without refresh)
7. Internal/Visible toggle still works
8. The old `ConditionNoteThread` component is fully removed (no dead code)
9. No unused imports remain
10. `pnpm build` passes with no TypeScript errors
