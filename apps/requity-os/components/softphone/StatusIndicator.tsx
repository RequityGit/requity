"use client";

import { cn } from "@/lib/utils";
import type { SoftphoneStatus } from "@/lib/twilio/types";

const statusConfig: Record<
  SoftphoneStatus,
  { color: string; pulse: boolean; label: string }
> = {
  offline: { color: "bg-[#D42620] dark:bg-[#EF4444]", pulse: false, label: "Disconnected" },
  ready: { color: "bg-[#1A8754] dark:bg-[#34C77B]", pulse: false, label: "Ready" },
  incoming: { color: "bg-[#CC7A00] dark:bg-[#F0A030]", pulse: true, label: "Incoming Call" },
  connecting: { color: "bg-[#CC7A00] dark:bg-[#F0A030]", pulse: false, label: "Connecting..." },
  "on-call": { color: "bg-[#1A8754] dark:bg-[#34C77B]", pulse: false, label: "On Call" },
};

export function StatusIndicator({
  status,
  showLabel = true,
}: {
  status: SoftphoneStatus;
  showLabel?: boolean;
}) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.color
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            config.color
          )}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-[#6B6B6B] dark:text-[#888888]">
          {config.label}
        </span>
      )}
    </div>
  );
}
