"use client";

import { Phone, PhoneOff, Bot, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useDialer } from "@/lib/dialer/dialer-context";
import { cn } from "@/lib/utils";
import type { CallGroupCall } from "@/lib/dialer/types";

function CallLineStatus({ call, index }: { call: CallGroupCall; index: number }) {
  const statusConfig: Record<
    string,
    { icon: React.ElementType; label: string; color: string; animate?: boolean }
  > = {
    initiating: {
      icon: Loader2,
      label: "Initiating...",
      color: "text-muted-foreground",
      animate: true,
    },
    ringing: {
      icon: Phone,
      label: "Ringing...",
      color: "text-amber-500",
      animate: true,
    },
    answered: {
      icon: CheckCircle2,
      label: "Connected",
      color: "text-emerald-500",
    },
    completed: {
      icon: PhoneOff,
      label: "Completed",
      color: "text-muted-foreground",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      color: "text-red-500",
    },
    amd_detected: {
      icon: Bot,
      label: "Machine Detected",
      color: "text-purple-500",
    },
    no_answer: {
      icon: PhoneOff,
      label: "No Answer",
      color: "text-muted-foreground",
    },
    busy: {
      icon: PhoneOff,
      label: "Busy",
      color: "text-orange-500",
    },
  };

  const config = statusConfig[call.status] || statusConfig.initiating;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2.5 py-2">
      <div
        className={cn(
          "flex items-center justify-center h-7 w-7 rounded-full border",
          call.status === "answered"
            ? "border-emerald-500/30 bg-emerald-500/10"
            : call.status === "ringing"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-border bg-muted/50"
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            config.color,
            config.animate && "animate-spin"
          )}
          strokeWidth={1.5}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          Line {index + 1}
        </p>
        <p className={cn("text-xs", config.color)}>{config.label}</p>
      </div>
      <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
        {call.phone}
      </span>
    </div>
  );
}

export function TripleLineIndicator() {
  const { currentGroupCalls, session } = useDialer();

  if (session.state !== "dialing" && session.state !== "on_call") return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Active Lines
      </h3>
      {currentGroupCalls.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
          Initiating calls...
        </div>
      ) : (
        currentGroupCalls.map((call, i) => (
          <CallLineStatus key={call.contactId} call={call} index={i} />
        ))
      )}
    </div>
  );
}
