# Prompt: Inline Emoji Picker for Note Composer

## Objective

Add a small smiley face icon button to the note composer toolbar that opens a lightweight emoji picker popover, allowing users to insert emojis directly into their note text at the cursor position. No database changes. Pure UI enhancement to the existing composer.

## Context

The `MentionInput` component already supports unicode emoji (users can paste them or use system shortcuts like Cmd+Ctrl+Space on Mac). But there is no in-app way to browse and insert emojis. Adding a smiley button to the toolbar makes emoji insertion frictionless and visible, which drives engagement in the notes system.

### Current Toolbar Layout

The composer toolbar (`.comment-toolbar` in `mention-input.tsx`) renders left-to-right:

```
[Internal/Visible toggle] [Paperclip] [@mention] [Enter to send hint]     [Send button]
 (extraControls)           (toolbarButtons)                                 (right side)
```

The emoji button should be added as a new `toolbarButtons` item, placed between the Paperclip and @mention buttons.

## Architecture

### New Component

| Component | Path | Purpose |
|-----------|------|---------|
| `EmojiPicker` | `components/shared/EmojiPicker.tsx` | Popover with categorized emoji grid |

### Modified Components

| Component | Change |
|-----------|--------|
| `components/shared/UnifiedNotes/NoteComposer.tsx` | Add emoji button to `toolbarButtons`, wire insertion |
| `components/shared/mention-input.tsx` | Add `insertText` method to `MentionInputHandle` |

### No New Dependencies

Do NOT add `emoji-mart` or any third-party emoji picker library. Build a lightweight, curated picker to keep the bundle small. This is a team of ~6 people; they don't need 3,000+ emojis. A curated set of ~80-100 commonly used emojis across 6 categories is perfect.

---

## Changes

### 1. Add `insertText` to `MentionInputHandle`

The `MentionInput` already exposes `focus()` and `insertAt()` (for @ mentions) via `useImperativeHandle`. Add a new `insertText(text: string)` method that inserts arbitrary text at the current cursor position:

**File:** `components/shared/mention-input.tsx`

```typescript
// Add to the MentionInputHandle interface:
export interface MentionInputHandle {
  focus: () => void;
  insertAt: () => void;
  insertText: (text: string) => void;  // NEW
}

// Add to useImperativeHandle:
useImperativeHandle(ref, () => ({
  focus() { /* existing */ },
  insertAt() { /* existing */ },
  insertText(text: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const pos = ta.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const after = value.slice(pos);
    const newValue = before + text + after;
    onChange(newValue);
    // Move cursor after inserted text
    setTimeout(() => {
      const newPos = pos + text.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  },
}));
```

### 2. Create `EmojiPicker` component

**File:** `components/shared/EmojiPicker.tsx`

A popover that displays a grid of emojis organized by category with a simple tab bar.

```tsx
"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Curated emoji categories — commonly used in work/team contexts
const EMOJI_CATEGORIES = [
  {
    key: "recent",
    icon: "clock",  // render as a small clock emoji or icon
    label: "Recent",
    emojis: [],     // populated dynamically from usage
  },
  {
    key: "smileys",
    icon: "😊",
    label: "Smileys",
    emojis: [
      "😊", "😂", "🤣", "😍", "🥰", "😎", "🤔", "😏",
      "😅", "😬", "🙃", "😤", "😢", "🤯", "🥳", "😴",
      "🙄", "😳", "🫡", "🫠", "😮‍💨", "🤝", "🙏", "💪",
    ],
  },
  {
    key: "reactions",
    icon: "👍",
    label: "Reactions",
    emojis: [
      "👍", "👎", "👏", "🎉", "🔥", "💯", "✅", "❌",
      "⭐", "💡", "🚀", "🎯", "💰", "📈", "📉", "⚠️",
      "🏆", "💎", "🙌", "🤞", "👀", "💬", "📌", "🔗",
    ],
  },
  {
    key: "objects",
    icon: "📋",
    label: "Work",
    emojis: [
      "📋", "📎", "📁", "📊", "📝", "🗂️", "📅", "⏰",
      "💼", "🏦", "🏠", "🔑", "📞", "✉️", "🖊️", "💻",
      "🔍", "📐", "🗓️", "📑", "🧾", "💳", "🏗️", "🔒",
    ],
  },
  {
    key: "arrows",
    icon: "➡️",
    label: "Arrows & Symbols",
    emojis: [
      "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "🔄", "↩️",
      "✔️", "❗", "❓", "💲", "📍", "🔴", "🟢", "🟡",
      "🔵", "⚪", "⚫", "🟠", "🔶", "🔷", "▶️", "⏸️",
    ],
  },
  {
    key: "flags",
    icon: "🚩",
    label: "Status",
    emojis: [
      "🚩", "🏁", "🚧", "🛑", "🟩", "🟥", "🟨", "⏳",
      "✨", "💥", "🔔", "🔕", "📢", "🎯", "🏷️", "📌",
    ],
  },
] as const;

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children: React.ReactNode;  // trigger element
}

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("smileys");

  const handleSelect = useCallback((emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  }, [onSelect]);

  const activeEmojis = EMOJI_CATEGORIES.find(c => c.key === activeCategory)?.emojis ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[280px] p-0 rounded-xl"
      >
        {/* Category tabs */}
        <div className="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b">
          {EMOJI_CATEGORIES.filter(c => c.key !== "recent").map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-md text-sm rq-transition cursor-pointer",
                activeCategory === cat.key
                  ? "bg-foreground/[0.06]"
                  : "hover:bg-foreground/[0.04] opacity-60 hover:opacity-100"
              )}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
          {activeEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="flex items-center justify-center h-8 w-8 rounded-md text-lg hover:bg-foreground/[0.06] rq-transition cursor-pointer"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Category label */}
        <div className="px-3 py-1.5 border-t">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {EMOJI_CATEGORIES.find(c => c.key === activeCategory)?.label}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Key design choices:**

- Uses shadcn `Popover` (already available in the project) for positioning
- Opens above the toolbar (`side="top"`) to avoid covering the note feed
- 280px wide, 8-column grid of emoji buttons
- Category tabs at top as small emoji icons
- Max height with scroll for overflow
- No search bar in v1 (keep it simple)
- Curated to ~100 emojis across 5 categories, biased toward work/finance contexts (money, charts, buildings, status indicators)
- Uses existing `rq-transition` class for hover effects

### 3. Add emoji button to `NoteComposer`

**File:** `components/shared/UnifiedNotes/NoteComposer.tsx`

Add the emoji picker button into the `toolbarButtons` prop, between the Paperclip and @mention buttons:

```tsx
// Add import at top:
import { Smile } from "lucide-react";
import { EmojiPicker } from "@/components/shared/EmojiPicker";

// In the toolbarButtons prop, add the EmojiPicker between Paperclip and AtSign:
toolbarButtons={
  <>
    <button
      type="button"
      className={iconBtnClass}
      title="Attach file"
      onClick={() => fileInputRef.current?.click()}
    >
      <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
    </button>
    <input ... />

    {/* NEW: Emoji picker */}
    <EmojiPicker onSelect={(emoji) => mentionInputRef.current?.insertText(emoji)}>
      <button
        type="button"
        className={iconBtnClass}
        title="Add emoji"
      >
        <Smile className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </EmojiPicker>

    <button
      type="button"
      className={iconBtnClass}
      title="Mention someone"
      onClick={() => mentionInputRef.current?.insertAt()}
    >
      <AtSign className="h-3.5 w-3.5" strokeWidth={1.5} />
    </button>
  </>
}
```

The resulting toolbar order will be:
```
[Internal/Visible] [Paperclip] [Smiley] [@mention] [hint text]     [Send]
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/shared/EmojiPicker.tsx` | Lightweight emoji picker popover |

## Files to Modify

| File | Change |
|------|--------|
| `components/shared/mention-input.tsx` | Add `insertText` to `MentionInputHandle` interface and `useImperativeHandle` |
| `components/shared/UnifiedNotes/NoteComposer.tsx` | Add `Smile` icon import, `EmojiPicker` import, and emoji button in `toolbarButtons` |

## Files NOT to Modify

- No database changes
- No `globals.css` changes
- No changes to `NoteCard`, `NoteThread`, `UnifiedNotes/index.tsx`, or any other note display components (emojis in note text already render correctly as unicode)

## Implementation Order

1. Add `insertText` to `MentionInputHandle` in `mention-input.tsx`
2. Create `EmojiPicker.tsx` component
3. Wire emoji button into `NoteComposer.tsx`
4. Test: click smiley, pick emoji, verify it inserts at cursor position in textarea
5. Test: ensure popover closes after selection
6. Test: verify emojis display correctly in posted notes
7. Run `pnpm build` to verify TypeScript

## Constraints

- No third-party emoji picker libraries. Keep bundle lean.
- The popover must open upward (`side="top"`) since the composer is at the bottom of the notes area.
- Emoji insertion must work correctly when the cursor is mid-text (not just appending to end).
- The popover must close when an emoji is selected.
- The picker must work in both light and dark mode. Emoji rendering is OS-native, so no color concerns there. The popover background and hover states must respect the theme.
- Do not modify the `@mention` dropdown behavior. The `insertText` method is separate from `insertAt`.

## Success Criteria

1. A smiley face icon (Smile from lucide-react) appears in the composer toolbar between the paperclip and @mention buttons
2. Clicking it opens a popover above the composer with a grid of emojis organized by category
3. Category tabs at the top allow switching between Smileys, Reactions, Work, Arrows/Symbols, and Status categories
4. Clicking an emoji inserts it at the current cursor position in the textarea
5. The popover closes after selection
6. Emojis display correctly in posted notes (they already do since they are unicode)
7. Works in both light and dark mode
8. No TypeScript errors on `pnpm build`
