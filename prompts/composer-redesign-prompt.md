# Prompt: Note Composer UI Redesign

## Objective

Redesign the NoteComposer and MentionInput components to use a modern single-surface pattern. Remove the "box inside a box" layout (bordered card wrapping a bordered textarea) and replace it with a unified input surface where the textarea blends into the container and the toolbar lives inside the bottom edge.

## Reference

See `composer-mockup.jsx` in the repo root for the approved design mockup with both CRM notes and task chat variants. Use it as the visual target.

## Design Spec

### Current Problem
- `.comment-composer` CSS class adds `rounded-xl border border-border bg-card` (outer box)
- Inside that, the `<textarea>` in MentionInput has its own `border border-input bg-background` (inner box)
- Controls (Internal toggle, Post button) sit in a separate row below the textarea, disconnected
- Result: looks like a form field, not a modern message input

### New Design
- **Single surface**: One `rounded-xl border` container holds everything. Avatar sits OUTSIDE to the left.
- **Borderless textarea**: The textarea inside has `bg-transparent border-0 outline-none`. It fills the container naturally.
- **Integrated toolbar**: Below the textarea, inside the same surface, a slim toolbar row separated by `border-t border-border/50` contains: Internal toggle (left), Paperclip icon button (left), AtSign icon button (left), Send icon-only button (right).
- **Focus elevates the whole surface**: `:focus-within` on the container adds `border-primary/40 bg-background ring-1 ring-primary/15 shadow-sm`. The textarea itself has NO focus ring.
- **Send button is icon-only** (Send arrow icon from lucide-react, no text label) for both CRM notes and task chat mode. Small rounded-lg button, `bg-primary text-primary-foreground` when there's text, `bg-muted text-muted-foreground` when empty.
- **Internal toggle is leaner**: No bordered pill with background at rest. Just icon + text ("Internal" not "Internal Only"), with `hover:bg-amber-500/10` on hover. Color: `text-amber-600 dark:text-amber-400` for internal, `text-emerald-600 dark:text-emerald-400` for visible.
- **Paperclip icon**: Non-functional placeholder for now (upcoming attachment feature). Just renders the icon button with `title="Attach file"`. No onClick handler yet.
- **@ icon**: Triggers focus into the textarea and inserts an `@` character to open the mention dropdown. `title="Mention someone"`.
- **Chat mode hint**: In `enterToSend` mode, show `"Enter to send, Shift+Enter for new line"` as `text-[10px] text-muted-foreground/60` inside the toolbar (between left icons and send button), NOT below the composer.

### Visual States
```
Rest:     border-border bg-card (subtle, blends with page)
Hover:    border-border/80 (slightly brighter border)
Focus:    border-primary/40 bg-background ring-1 ring-primary/15 shadow-sm (elevated)
Posting:  Send button shows Loader2 spinner, textarea disabled
```

## Files to Modify

### 1. `apps/requity-os/app/globals/globals.css`
Update the `.comment-composer` CSS class. The class should now only be used as a layout wrapper (flex gap), NOT as the bordered surface. The bordered surface is the new inner container. Alternatively, repurpose `.comment-composer` to be the outer flex row (avatar + surface) and add a new `.comment-surface` class for the unified input container:

```css
.comment-composer {
  /* Outer layout: avatar + surface side by side */
  @apply flex gap-3 items-start;
}

.comment-surface {
  @apply flex-1 min-w-0 rounded-xl border border-border bg-card transition-all duration-normal;
}
.comment-surface:focus-within {
  @apply border-primary/40 bg-background shadow-sm;
  box-shadow: 0 0 0 1px rgba(var(--primary-rgb, 0 0 0) / 0.15), 0 2px 8px rgba(0,0,0,0.08);
}

.comment-surface-textarea {
  @apply w-full bg-transparent border-0 outline-none resize-none
    text-xs text-foreground placeholder:text-muted-foreground
    focus:ring-0 focus:outline-none;
}

.comment-toolbar {
  @apply flex items-center justify-between gap-2 border-t border-border/50;
}
```

### 2. `apps/requity-os/components/shared/mention-input.tsx`
This is the biggest change. Restructure the JSX layout:

**Current structure:**
```
<div space-y-2>
  <div relative>
    <textarea border border-input bg-background />
    {mention dropdown}
  </div>
  <div flex justify-between>
    {extraControls}
    <button>Post</button>
  </div>
</div>
```

**New structure:**
```
<div comment-surface>
  <div relative>
    <textarea comment-surface-textarea px-4 pt-3.5 pb-2 />
    {mention dropdown}
  </div>
  <div comment-toolbar px-3.5 py-2.5>
    <div left>
      {extraControls}
      <button paperclip icon />
      <button @ icon />
      {enterToSend hint text}
    </div>
    <button send icon-only />
  </div>
</div>
```

Key changes to MentionInput:
- Remove the outer `space-y-2` div
- Replace it with a div using `comment-surface` class
- Textarea gets `comment-surface-textarea` class instead of the current border/bg classes
- Add padding props: accept `compact` prop to control `px-3 pt-3 pb-2` vs `px-4 pt-3.5 pb-2`
- Bottom row uses `comment-toolbar` class
- The submit button becomes icon-only: just the `submitIcon` rendered in a small square button, no `submitLabel` text
- Add new prop: `toolbarButtons?: React.ReactNode` for the Paperclip and @ buttons (rendered in the left side of toolbar, after extraControls)
- Remove the old submit button styling, replace with:
  - Has text: `bg-primary text-primary-foreground hover:bg-primary/90 h-7 w-7 rounded-lg inline-flex items-center justify-center`
  - Empty: `bg-muted text-muted-foreground h-7 w-7 rounded-lg inline-flex items-center justify-center`
- When `enterToSend` is true, render the hint text `"Enter to send, Shift+Enter for new line"` as a `<span>` inside the toolbar between left controls and send button (using `flex-1 text-right` or similar), NOT outside the component

### 3. `apps/requity-os/components/shared/UnifiedNotes/NoteComposer.tsx`
Update to use the new layout:

- The Avatar now sits OUTSIDE the `comment-surface`, in the `comment-composer` flex row
- Remove the `comment-composer` className from the outer div, replace with the new flex layout
- Structure becomes:
```tsx
<div className="flex gap-3 items-start">
  <Avatar ... />
  <MentionInput ... /> {/* MentionInput now renders its own comment-surface wrapper */}
</div>
```
- The Internal toggle moves into MentionInput's `extraControls` prop (same as now, but with updated styling)
- Add Paperclip and AtSign icon buttons via MentionInput's new `toolbarButtons` prop
- Internal toggle styling update: remove `border` and `bg-*` at rest. Just `inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium` with color only, plus `hover:bg-amber-500/10` or `hover:bg-emerald-500/10`
- Change label from "Internal Only" to "Internal" and "Visible to Borrower" to "Visible"
- Remove the `enterToSend && <p>` hint below MentionInput (it now renders inside the toolbar)
- Pass `enterToSend` through to MentionInput (already done)
- The `compact` prop controls padding: compact uses `px-3 pt-3 pb-2` and `px-3 py-2` toolbar, non-compact uses `px-4 pt-3.5 pb-2` and `px-3.5 py-2.5` toolbar. Pass this through as a prop to MentionInput.

### 4. Icon buttons to add in NoteComposer

```tsx
import { Paperclip, AtSign } from "lucide-react";

// In the toolbarButtons prop:
<>
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
    title="Attach file"
    disabled
  >
    <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
  </button>
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
    title="Mention someone"
    onClick={() => {
      // Focus textarea and insert @ to trigger mention dropdown
      // This requires a ref forwarded from MentionInput
    }}
  >
    <AtSign className="h-3.5 w-3.5" strokeWidth={1.5} />
  </button>
</>
```

For the @ button to work, MentionInput needs to expose a method or ref to focus the textarea and insert an `@`. Options:
- Forward a ref from MentionInput that exposes `{ focus: () => void, insertAt: () => void }`
- Or accept an `onMentionClick` callback prop that MentionInput handles internally
- Simplest: add a `mentionTriggerRef` prop that MentionInput attaches to an internal function, so the parent can call it

## Constraints

- Do NOT change any logic (posting, mentions, likes, pins, realtime). Only restructure JSX and CSS.
- Do NOT change NoteCard, NoteFilters, or the UnifiedNotes index orchestration logic.
- Maintain all existing props and callbacks on NoteComposer and MentionInput. Adding new optional props is fine.
- Ensure dark mode works (all colors use CSS variables or Tailwind dark: variants).
- Use motion tokens from globals.css (`duration-normal`, `rq-transition`) where applicable.
- The `comment-composer` CSS class is used in one place only (NoteComposer.tsx). Safe to repurpose.
- Test both modes: standard CRM notes (with Internal toggle, no enterToSend) and task chat mode (compact, enterToSend, no Internal toggle).
- Run `pnpm build` after changes to verify TypeScript.

## Success Criteria

1. No double borders. One surface contains the textarea and toolbar.
2. Avatar sits outside the surface to the left.
3. Textarea is borderless and transparent at rest.
4. Focus-within elevates the entire surface (not just the textarea).
5. Send button is icon-only (arrow) in both modes.
6. Internal toggle has no border/background at rest, just colored text + icon.
7. Paperclip and @ icons render in the toolbar (Paperclip is non-functional placeholder).
8. "Enter to send" hint renders inside the toolbar in chat mode.
9. Both light and dark mode work correctly.
10. No regressions in posting, editing, mentions, likes, pins.
