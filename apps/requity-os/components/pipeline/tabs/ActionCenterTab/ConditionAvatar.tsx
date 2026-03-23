"use client";

import { getUserColor, colorVariants } from "@/lib/user-colors";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConditionProfile } from "./useActionCenterData";

interface ConditionAvatarProps {
  profile: ConditionProfile | null;
  role: "Collector" | "Approver";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (
    (parts[0][0]?.toUpperCase() ?? "") + (parts[parts.length - 1][0]?.toUpperCase() ?? "")
  );
}

export function ConditionAvatar({ profile, role }: ConditionAvatarProps) {
  if (!profile) return null;

  const color = getUserColor({ id: profile.id, accent_color: profile.accent_color });
  const variants = colorVariants(color);
  const initials = getInitials(profile.full_name);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-semibold"
          style={{
            backgroundColor: variants.bg,
            border: `1.5px solid ${variants.border}`,
            color: variants.base,
          }}
        >
          {initials}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {profile.full_name ?? "Unknown"} ({role})
      </TooltipContent>
    </Tooltip>
  );
}
