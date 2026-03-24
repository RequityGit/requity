"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
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
  children: React.ReactNode;
}

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("smileys");

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      setOpen(false);
    },
    [onSelect]
  );

  const activeEmojis =
    EMOJI_CATEGORIES.find((c) => c.key === activeCategory)?.emojis ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[280px] p-0 rounded-xl"
      >
        {/* Category tabs */}
        <div className="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b">
          {EMOJI_CATEGORIES.map((cat) => (
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
            {EMOJI_CATEGORIES.find((c) => c.key === activeCategory)?.label}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
