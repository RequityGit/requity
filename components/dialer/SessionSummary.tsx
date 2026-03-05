"use client";

import { CheckCircle2, ArrowLeft, Plus } from "lucide-react";
import { useDialer } from "@/lib/dialer/dialer-context";
import { formatDuration, calculateCallsPerHour, calculateAbandonedRate } from "@/lib/dialer/dialer-engine";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SessionSummary() {
  const { session, resetDialer } = useDialer();

  if (session.state !== "completed") return null;

  const elapsed = session.sessionStartedAt
    ? Math.floor((Date.now() - new Date(session.sessionStartedAt).getTime()) / 1000)
    : 0;
  const { progress, totalDials } = session;
  const callsPerHour = calculateCallsPerHour(totalDials, elapsed);
  const abandonedRate = calculateAbandonedRate(progress.abandoned, progress.connected + progress.abandoned);

  const stats = [
    { label: "Connected (human)", value: progress.connected, pct: progress.total > 0 ? ((progress.connected / progress.total) * 100).toFixed(1) : "0", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "No Answer", value: progress.noAnswer, pct: progress.total > 0 ? ((progress.noAnswer / progress.total) * 100).toFixed(1) : "0", color: "text-muted-foreground" },
    { label: "Answering Machine", value: progress.answeringMachine, pct: progress.total > 0 ? ((progress.answeringMachine / progress.total) * 100).toFixed(1) : "0", color: "text-muted-foreground" },
    { label: "Busy", value: progress.busy, pct: progress.total > 0 ? ((progress.busy / progress.total) * 100).toFixed(1) : "0", color: "text-muted-foreground" },
    { label: "Failed", value: progress.failed, pct: progress.total > 0 ? ((progress.failed / progress.total) * 100).toFixed(1) : "0", color: "text-muted-foreground" },
    { label: "DNC Skipped", value: progress.dncSkipped, pct: progress.total > 0 ? ((progress.dncSkipped / progress.total) * 100).toFixed(1) : "0", color: "text-red-500" },
    { label: "Skipped", value: progress.skipped, pct: progress.total > 0 ? ((progress.skipped / progress.total) * 100).toFixed(1) : "0", color: "text-muted-foreground" },
  ];

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Session Complete</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{session.listName}</p>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold font-mono text-foreground">{formatDuration(elapsed)}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Dials</p>
            <p className="text-lg font-semibold font-mono text-foreground">{totalDials}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Contacts</p>
            <p className="text-lg font-semibold font-mono text-foreground">{progress.total}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Calls/Hour</p>
            <p className="text-lg font-semibold font-mono text-foreground">{callsPerHour}</p>
          </div>
        </div>

        {/* Outcomes */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Outcomes
          </h3>
          <div className="space-y-1">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-mono font-medium", s.color)}>{s.value}</span>
                  <span className="text-xs text-muted-foreground">({s.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extra stats */}
        <div className="space-y-1 pt-2 border-t border-border">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Callbacks Scheduled</span>
            <span className="text-sm font-mono font-medium text-foreground">{progress.callbacks}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Abandoned Call Rate</span>
            <span
              className={cn(
                "text-sm font-mono font-medium",
                abandonedRate >= 0.03 ? "text-red-500" : "text-emerald-500"
              )}
            >
              {(abandonedRate * 100).toFixed(1)}%
              {abandonedRate < 0.03 ? " (OK)" : " (OVER LIMIT)"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Link
            href="/admin/dialer"
            onClick={resetDialer}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to Lists
          </Link>
          <Link
            href="/admin/dialer"
            onClick={resetDialer}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            New Session
          </Link>
        </div>
      </div>
    </div>
  );
}
