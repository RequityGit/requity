"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/chat-utils";

type AvatarSize = "sidebar" | "message" | "header" | "footer";

const sizeConfig: Record<
  AvatarSize,
  { size: string; radius: string; text: string; border: string }
> = {
  sidebar: {
    size: "h-[44px] w-[44px]",
    radius: "rounded-[10px]",
    text: "text-sm font-medium",
    border: "border-2",
  },
  message: {
    size: "h-9 w-9",
    radius: "rounded-lg",
    text: "text-xs font-medium",
    border: "border-[1.5px]",
  },
  header: {
    size: "h-7 w-7",
    radius: "rounded-md",
    text: "text-[10px] font-medium",
    border: "border-[1.5px]",
  },
  footer: {
    size: "h-9 w-9",
    radius: "rounded-[10px]",
    text: "text-xs font-medium",
    border: "border-[1.5px]",
  },
};

// Deterministic color based on name string
const fallbackColors = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

function getColorIndex(name: string | null): number {
  if (!name) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % fallbackColors.length;
}

interface ChatAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function ChatAvatar({
  src,
  name,
  size = "message",
  className,
}: ChatAvatarProps) {
  const config = sizeConfig[size];
  const initials = getInitials(name || null);
  const colorIdx = getColorIndex(name ?? null);

  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden flex items-center justify-center",
        config.size,
        config.radius,
        config.border,
        "border-[rgba(197,151,91,0.15)]",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "Avatar"}
          className={cn("w-full h-full object-cover", config.radius)}
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center text-muted-foreground",
            config.text,
            fallbackColors[colorIdx]
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

interface ChatGroupIconProps {
  icon?: string | null;
  size?: AvatarSize;
  onClick?: () => void;
  className?: string;
}

export function ChatGroupIcon({
  icon,
  size = "sidebar",
  onClick,
  className,
}: ChatGroupIconProps) {
  const config = sizeConfig[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 overflow-hidden flex items-center justify-center bg-muted",
        config.size,
        config.radius,
        config.border,
        "border-border",
        "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        onClick && "hover:border-border/80 cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
    >
      <span className={size === "sidebar" ? "text-xl" : size === "header" ? "text-sm" : "text-base"}>
        {icon || "💬"}
      </span>
    </button>
  );
}
