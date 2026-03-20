"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

export type Scenario = "base" | "upside" | "stress";

export type KPIData = {
  label: string;
  value: number;
  formatted: string;
  delta: string;
  deltaPositive: boolean;
  spark: number[];
  sub?: string;
};

// ── ScenarioToggle ─────────────────────────────────────────

export function ScenarioToggle({
  active,
  onChange,
}: {
  active: Scenario;
  onChange: (s: Scenario) => void;
}) {
  const scenarios: { key: Scenario; label: string }[] = [
    { key: "base", label: "Base" },
    { key: "upside", label: "Upside" },
    { key: "stress", label: "Stress" },
  ];

  return (
    <div className="inline-flex gap-0.5 rounded-lg p-[2px] bg-muted">
      {scenarios.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-colors",
            active === s.key
              ? s.key === "base"
                ? "bg-background text-foreground shadow-sm"
                : s.key === "upside"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ── MiniSparkline ──────────────────────────────────────────

export function MiniSparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  if (!data.length) return null;

  const color = positive ? "#10b981" : "#ef4444";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 40;
      const y = 20 - ((v - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  const lastX = 40;
  const lastY = 20 - ((data[data.length - 1] - min) / range) * 18;

  return (
    <svg width={40} height={20} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}

// ── KPICell ────────────────────────────────────────────────

export function KPICell({
  kpi,
  scenario,
}: {
  kpi: KPIData;
  scenario: string;
}) {
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setPop(true);
    const t = setTimeout(() => setPop(false), 300);
    return () => clearTimeout(t);
  }, [scenario]);

  return (
    <div className="px-4 py-2.5 text-center">
      <div className="text-[10px] text-muted-foreground mb-0.5">
        {kpi.label}
      </div>
      <div
        className={cn(
          "text-[14px] font-semibold num text-foreground transition-transform duration-300",
          pop && "scale-110"
        )}
      >
        {kpi.formatted}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <MiniSparkline data={kpi.spark} positive={kpi.deltaPositive} />
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5",
            kpi.deltaPositive
              ? "text-emerald-700 bg-emerald-500/10"
              : "text-red-700 bg-red-500/10"
          )}
        >
          {kpi.deltaPositive ? (
            <ArrowUp className="h-2.5 w-2.5" />
          ) : (
            <ArrowDown className="h-2.5 w-2.5" />
          )}
          {kpi.delta}
        </span>
      </div>
      {kpi.sub && (
        <div className="text-[9px] mt-0.5 text-muted-foreground">{kpi.sub}</div>
      )}
    </div>
  );
}

// ── SyncIndicator ──────────────────────────────────────────

export function SyncIndicator({
  isSyncing,
  onRefresh,
}: {
  isSyncing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isSyncing ? "bg-amber-500 animate-ping" : "bg-emerald-500"
        )}
      />
      <span>{isSyncing ? "Syncing..." : "Synced 2m ago"}</span>
      <button
        onClick={onRefresh}
        className="ml-0.5 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
      >
        <RefreshCw
          className={cn("h-3 w-3", isSyncing && "animate-spin")}
        />
      </button>
    </div>
  );
}

// ── AIInsightStrip ─────────────────────────────────────────

export function AIInsightStrip({
  insight,
  type,
}: {
  insight: string;
  type: "positive" | "warning" | "neutral";
}) {
  const Icon = type === "warning" ? AlertTriangle : Sparkles;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]",
        type === "positive" && "bg-emerald-500/10 text-emerald-700",
        type === "warning" && "bg-amber-500/10 text-amber-700",
        type === "neutral" && "bg-card text-muted-foreground border"
      )}
    >
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{insight}</span>
    </div>
  );
}

// ── DealScoreCard ──────────────────────────────────────────

const SCENARIO_SCORES: Record<Scenario, { score: number; label: string }> = {
  base: { score: 78, label: "Strong" },
  upside: { score: 92, label: "Excellent" },
  stress: { score: 41, label: "At Risk" },
};

export function DealScoreCard({ scenario }: { scenario: Scenario }) {
  const { score, label } = SCENARIO_SCORES[scenario];

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : "text-red-500";

  const strokeColor =
    score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={80} height={80} viewBox="0 0 80 80" className="-rotate-90">
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-muted/30"
        />
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-lg font-bold num", color)}>{score}</span>
      </div>
      <span className={cn("text-[10px] font-semibold", color)}>{label}</span>
    </div>
  );
}

// ── UnifiedKPIHeader ───────────────────────────────────────

export function UnifiedKPIHeader({
  kpisExpanded,
  onToggleKpis,
  isSyncing,
  onRefresh,
  onExpand,
  isFullscreen = false,
  sheetUrl,
  activeScenario,
  onScenarioChange,
  scenarioKpis,
}: {
  kpisExpanded: boolean;
  onToggleKpis: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
  onExpand: () => void;
  isFullscreen?: boolean;
  sheetUrl?: string;
  activeScenario: Scenario;
  onScenarioChange: (s: Scenario) => void;
  scenarioKpis: KPIData[];
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Top row */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <ScenarioToggle active={activeScenario} onChange={onScenarioChange} />

        <div className="flex-1" />

        <SyncIndicator isSyncing={isSyncing} onRefresh={onRefresh} />

        <div className="h-4 w-px bg-border/60" />

        <button
          onClick={onToggleKpis}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md px-1.5 py-1 hover:bg-muted"
        >
          <BarChart3 className="h-3 w-3" />
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              !kpisExpanded && "-rotate-90"
            )}
          />
        </button>

        <div className="h-4 w-px bg-border/60" />

        <button
          onClick={onExpand}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>

        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Sheets
          </a>
        )}
      </div>

      {/* Collapsible KPI strip */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: kpisExpanded ? 200 : 0 }}
      >
        <div className="grid grid-cols-6 divide-x divide-border/40 border-t border-border/50">
          {scenarioKpis.map((kpi) => (
            <KPICell key={kpi.label} kpi={kpi} scenario={activeScenario} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SectionHeader ──────────────────────────────────────────

export function SectionHeader({
  title,
  badge,
  action,
}: {
  title: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {badge && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
