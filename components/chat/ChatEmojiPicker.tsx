"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// 40 commonly used emojis organized in a grid
const EMOJI_GRID = [
  "😀", "😂", "🥲", "😊", "😍", "🤩", "😎", "🤔",
  "😅", "🙂", "😏", "😢", "😤", "🤯", "🥳", "😱",
  "👍", "👎", "👏", "🙌", "🤝", "💪", "✌️", "🤞",
  "❤️", "🔥", "⭐", "💯", "✅", "❌", "🎉", "💡",
  "🚀", "💰", "📈", "📉", "🏠", "📋", "🔑", "⏰",
];

const QUICK_REACTIONS = ["❤️", "🙌", "👍"];

interface ChatEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

export function ChatEmojiPicker({
  onSelect,
  onClose,
  className,
}: ChatEmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-[#1A2535] border border-[rgba(255,255,255,0.12)] rounded-lg shadow-xl p-3 z-50",
        "w-[280px]",
        className
      )}
    >
      {/* Frequently used */}
      <div className="text-[10px] uppercase tracking-wider text-[#8A8680] mb-1.5 px-0.5">
        Frequently Used
      </div>
      <div className="grid grid-cols-8 gap-0.5 mb-2">
        {EMOJI_GRID.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200 text-lg leading-none"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

interface QuickReactionBarProps {
  onReact: (emoji: string) => void;
}

export function QuickReactionBar({ onReact }: QuickReactionBarProps) {
  return (
    <div className="flex items-center gap-0.5">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200 text-base leading-none"
          onClick={() => onReact(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// Group icon picker — opens when clicking a group's emoji icon
interface GroupIconPickerProps {
  currentIcon?: string | null;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const GROUP_ICONS = [
  "💼", "📊", "🏦", "💰", "📈", "🏠", "🔑", "📋",
  "⭐", "🎯", "🚀", "💡", "🤝", "👥", "💬", "📌",
  "🔔", "📂", "✅", "🏗️", "💎", "🌟", "📝", "🔒",
];

export function GroupIconPicker({
  currentIcon,
  onSelect,
  onClose,
  className,
}: GroupIconPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-[#1A2535] border border-[rgba(255,255,255,0.12)] rounded-lg shadow-xl p-3 z-50",
        "w-[240px]",
        className
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-[#8A8680] mb-1.5 px-0.5">
        Choose Group Icon
      </div>
      <div className="grid grid-cols-8 gap-0.5">
        {GROUP_ICONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={cn(
              "p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200 text-lg leading-none",
              currentIcon === emoji && "bg-[rgba(197,151,91,0.15)] ring-1 ring-[#C5975B]"
            )}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
