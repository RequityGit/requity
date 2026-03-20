"use client";

import { Pause, Play, Square, PhoneCall } from "lucide-react";
import { useDialer } from "@/lib/dialer/dialer-context";
import { formatDuration, calculateCallsPerHour, calculateAbandonedRate } from "@/lib/dialer/dialer-engine";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function DialerToolbar() {
  const { session, pauseSession, resumeSession, endSession, fireNextGroup } = useDialer();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session.sessionStartedAt || session.state === "completed" || session.state === "idle") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session.sessionStartedAt!).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.sessionStartedAt, session.state]);

  const { progress, totalDials } = session;
  const callsPerHour = calculateCallsPerHour(totalDials, elapsed);
  const abandonedRate = calculateAbandonedRate(progress.abandoned, progress.connected + progress.abandoned);
  const progressPct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  const stateLabel: Record<string, string> = {
    ready: "Ready",
    dialing: "Dialing...",
    on_call: "On Call",
    dispositioning: "Disposition",
    paused: "Paused",
    completed: "Complete",
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-card rounded-t-xl">
      {/* State indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            session.state === "on_call" && "bg-emerald-500 animate-pulse",
            session.state === "dialing" && "bg-amber-500 animate-pulse",
            session.state === "paused" && "bg-muted-foreground",
            session.state === "ready" && "bg-blue-500",
            session.state === "dispositioning" && "bg-purple-500",
            session.state === "completed" && "bg-muted-foreground"
          )}
        />
        <span className="text-sm font-medium text-foreground">
          {stateLabel[session.state] || session.state}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Progress */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-mono">
          {progress.processed}/{progress.total}
        </span>
        <span>({progressPct}%)</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>
          Connected: <span className="font-mono text-emerald-600 dark:text-emerald-400">{progress.connected}</span>
        </span>
        <span>
          No Answer: <span className="font-mono">{progress.noAnswer}</span>
        </span>
        <span>
          AMD: <span className="font-mono">{progress.answeringMachine}</span>
        </span>
        <span>
          Busy: <span className="font-mono">{progress.busy}</span>
        </span>
        {progress.dncSkipped > 0 && (
          <span>
            DNC: <span className="font-mono text-red-500">{progress.dncSkipped}</span>
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Duration & calls/hr */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{formatDuration(elapsed)}</span>
        <span>
          <span className="font-mono">{callsPerHour}</span> calls/hr
        </span>
      </div>

      {/* Abandoned rate compliance */}
      {abandonedRate > 0.02 && (
        <>
          <div className="h-4 w-px bg-border" />
          <span
            className={cn(
              "text-xs font-medium",
              abandonedRate >= 0.03 ? "text-red-500" : "text-amber-500"
            )}
          >
            Abandoned: {(abandonedRate * 100).toFixed(1)}%
            {abandonedRate >= 0.03 && " (LIMIT)"}
          </span>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {session.state === "paused" ? (
          <button
            onClick={resumeSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
            Resume
          </button>
        ) : session.state === "ready" ? (
          <>
            <button
              onClick={pauseSession}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <Pause className="h-3.5 w-3.5" strokeWidth={1.5} />
              Pause
            </button>
            <button
              onClick={() => fireNextGroup()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              <PhoneCall className="h-3.5 w-3.5" strokeWidth={1.5} />
              Dial Next
            </button>
          </>
        ) : (
          <button
            onClick={pauseSession}
            disabled={session.state === "on_call" || session.state === "dispositioning"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Pause className="h-3.5 w-3.5" strokeWidth={1.5} />
            Pause
          </button>
        )}

        <button
          onClick={endSession}
          disabled={session.state === "on_call"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-40"
        >
          <Square className="h-3.5 w-3.5" strokeWidth={1.5} />
          End
        </button>
      </div>
    </div>
  );
}
