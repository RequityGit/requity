# Prompt: Remove 15-Minute Edit Time Limit on Notes

## Objective

Remove the 15-minute edit time limit on notes so users can always edit their own notes, matching Slack's behavior. Show "(edited)" label when a note has been modified.

## Context

Currently in `NoteCard.tsx`, the `canEdit` variable restricts editing to notes created within the last 15 minutes:

```typescript
const canEdit =
  isOwn &&
  Date.now() - new Date(note.created_at).getTime() < 15 * 60 * 1000;
```

This is too restrictive. Users should always be able to edit their own notes. The "(edited)" indicator already exists and works correctly.

## File to Modify

`apps/requity-os/components/shared/UnifiedNotes/NoteCard.tsx`

## Change

Line ~63-65, replace:

```typescript
const canEdit =
  isOwn &&
  Date.now() - new Date(note.created_at).getTime() < 15 * 60 * 1000;
```

With:

```typescript
const canEdit = isOwn;
```

That's it. One line. The rest of the edit flow (Edit button in hover toolbar dropdown, inline MentionInput editor, `handleEdit` in the parent) all works correctly and doesn't reference the time limit.

## Verify

- The Edit option appears in the three-dot dropdown menu for ALL of the current user's notes, regardless of age
- The "(edited)" badge still shows after editing
- Notes authored by other users still cannot be edited
- `pnpm build` passes
