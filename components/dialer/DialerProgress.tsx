"use client";

import { useDialer } from "@/lib/dialer/dialer-context";
import { Pause, Square, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDuration(startedAt: string | null): string {
  if (!startedAt) return "0:00";
  const diff = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 1000
  );
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function DialerProgress() {
  const { state, pauseSession, resumeSession, endSession } = useDialer();
  const { stats, list } = state;

  const progressPct =
    stats.totalContacts > 0
      ? Math.round((stats.completedContacts / stats.totalContacts) * 100)
      : 0;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        {state.phase === "paused" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => resumeSession()}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            Resume
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => pauseSession()}
            className="gap-1.5"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => endSession()}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Square className="h-3.5 w-3.5" />
          End Session
        </Button>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Progress:</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums">
              {stats.completedContacts}/{stats.totalContacts} ({progressPct}%)
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-muted-foreground">
          <span>Duration:</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {formatDuration(state.sessionStartedAt)}
          </span>
        </div>

        {list && (
          <div className="hidden lg:block text-muted-foreground truncate max-w-[200px]">
            {list.name}
          </div>
        )}
      </div>
    </div>
  );
}
