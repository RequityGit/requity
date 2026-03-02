"use client";

import type { TypingUser } from "@/lib/chat-types";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.full_name || "Someone");
  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground bg-secondary">
      <span className="flex gap-0.5">
        <span
          className="animate-bounce inline-block h-1.5 w-1.5 rounded-full bg-[#C5975B]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="animate-bounce inline-block h-1.5 w-1.5 rounded-full bg-[#C5975B]"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="animate-bounce inline-block h-1.5 w-1.5 rounded-full bg-[#C5975B]"
          style={{ animationDelay: "300ms" }}
        />
      </span>
      <span>{text}</span>
    </div>
  );
}
