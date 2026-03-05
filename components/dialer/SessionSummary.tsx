"use client";

import { useDialer } from "@/lib/dialer/dialer-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneForwarded,
  PhoneOff,
  Voicemail,
  Ban,
  SkipForward,
  CalendarClock,
  XCircle,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

function formatDuration(startedAt: string | null): string {
  if (!startedAt) return "0:00";
  const diff = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 1000
  );
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function StatRow({
  icon: Icon,
  label,
  value,
  pct,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  pct: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2 text-sm">
        <Icon
          className={`h-4 w-4 ${color || "text-muted-foreground"}`}
          strokeWidth={1.5}
        />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {value}
        </span>
        <span className="text-xs text-muted-foreground w-12 text-right">
          ({pct})
        </span>
      </div>
    </div>
  );
}

export function SessionSummary() {
  const { state } = useDialer();
  const { stats, list } = state;
  const total = stats.callsMade || 1;

  const pct = (val: number) =>
    `${Math.round((val / total) * 100)}%`;

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Session Complete</h2>
        {list && (
          <p className="text-muted-foreground text-sm">{list.name}</p>
        )}
        <Badge variant="secondary" className="mt-1">
          Duration: {formatDuration(state.sessionStartedAt)}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Total Contacts</span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {stats.totalContacts}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Calls Made</span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {stats.callsMade}
            </span>
          </div>

          <div className="pt-2">
            <StatRow
              icon={PhoneForwarded}
              label="Connected"
              value={stats.connected}
              pct={pct(stats.connected)}
              color="text-green-600 dark:text-green-400"
            />
            <StatRow
              icon={PhoneOff}
              label="No Answer"
              value={stats.noAnswer}
              pct={pct(stats.noAnswer)}
            />
            <StatRow
              icon={Voicemail}
              label="Answering Machine"
              value={stats.answeringMachine}
              pct={pct(stats.answeringMachine)}
            />
            <StatRow
              icon={Phone}
              label="Busy"
              value={stats.busy}
              pct={pct(stats.busy)}
            />
            <StatRow
              icon={SkipForward}
              label="Skipped"
              value={stats.skipped}
              pct={pct(stats.skipped)}
            />
            <StatRow
              icon={Ban}
              label="DNC Flagged"
              value={stats.dncFlagged}
              pct={pct(stats.dncFlagged)}
              color="text-red-600 dark:text-red-400"
            />
            <StatRow
              icon={CalendarClock}
              label="Callbacks Scheduled"
              value={stats.callbacks}
              pct={pct(stats.callbacks)}
            />
            <StatRow
              icon={XCircle}
              label="Failed"
              value={stats.failed}
              pct={pct(stats.failed)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center">
        <Link href="/admin/dialer">
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to Lists
          </Button>
        </Link>
      </div>
    </div>
  );
}
