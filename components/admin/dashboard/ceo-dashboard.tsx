"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
  Target,
  Plus,
  Filter,
  MapPin,
} from "lucide-react";
import {
  CEOThemeProvider,
  useCEOTheme,
  CEOStagePill,
  CEOPriorityDot,
  CEOChartTooltip,
  type ThemeTokens,
} from "./ceo-theme";
import type {
  CEODashboardData,
  CEOMetrics,
  PipelineDeal,
  DashActivityItem,
  PortfolioProperty,
} from "@/lib/dashboard-ceo.server";
import "@/app/globals/dashboard-ceo.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardProps {
  data: CEODashboardData;
  userName: string;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
function fmtCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtAmount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function CEODashboard({ data, userName }: DashboardProps) {
  return (
    <CEOThemeProvider>
      <DashboardInner data={data} userName={userName} />
    </CEOThemeProvider>
  );
}

// ─── Inner Dashboard (needs theme context) ────────────────────────────────────
function DashboardInner({ data, userName }: DashboardProps) {
  const { t, mode } = useCEOTheme();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div
      className="-m-6 min-h-full font-inter"
      style={{
        background: t.bg,
        color: t.text,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div className="max-w-[1120px] mx-auto px-7 py-6 pb-10">
        {/* Greeting */}
        <div className="ceo-fade-up ceo-delay-0 mb-6">
          <h1
            className="text-2xl font-bold font-inter"
            style={{ letterSpacing: "-0.04em" }}
          >
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Here&apos;s what&apos;s happening across Requity today.
          </p>
        </div>

        {/* Hero Metrics */}
        <HeroMetricsSection metrics={data.metrics} t={t} />

        {/* Charts */}
        <ChartsSection
          aumHistory={data.aumHistory}
          originationVolume={data.originationVolume}
          aumChangePercent={data.metrics.aumChangePercent}
          t={t}
          mode={mode}
        />

        {/* Pipeline + Activity */}
        <PipelineActivitySection
          deals={data.pipelineDeals}
          activities={data.activities}
          t={t}
          mode={mode}
        />

        {/* Portfolio */}
        <PortfolioSection
          properties={data.portfolioProperties}
          count={data.portfolioCount}
          t={t}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO METRICS
// ═══════════════════════════════════════════════════════════════════════════════
function HeroMetricsSection({
  metrics,
  t,
}: {
  metrics: CEOMetrics;
  t: ThemeTokens;
}) {
  const cards = [
    {
      label: "Assets Under Management",
      value: fmtCurrency(metrics.totalAum),
      change: `+${metrics.aumChangePercent}%`,
      up: true,
      sub: "vs. last quarter",
    },
    {
      label: "Loans Originated",
      value: String(metrics.loansOriginated),
      change: `+${metrics.loansOriginatedChange}`,
      up: true,
      sub: "this year",
    },
    {
      label: "Active Pipeline",
      value: fmtCurrency(metrics.activePipelineValue),
      change: `${metrics.activePipelineCount} deals`,
      up: null,
      sub: "in progress",
    },
    {
      label: "Default Rate",
      value: `${metrics.defaultRate.toFixed(1)}%`,
      change: metrics.defaultRate === 0 ? "Zero defaults" : `${metrics.defaultRate}%`,
      up: metrics.defaultRate === 0 ? true : false,
      sub: "all-time track record",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((m, i) => (
        <div
          key={m.label}
          className={`ceo-fade-up ceo-delay-${i + 1} ceo-card-hover rounded-xl cursor-default`}
          style={{
            padding: "18px 20px",
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            boxShadow: t.shadow,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = t.shadowHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = t.shadow;
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase mb-2"
            style={{
              color: t.textTertiary,
              letterSpacing: "0.05em",
            }}
          >
            {m.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-[28px] font-bold num"
              style={{ letterSpacing: "-0.04em" }}
            >
              {m.value}
            </span>
            {m.up !== null && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-semibold"
                style={{ color: m.up ? t.success : t.danger }}
              >
                {m.up ? (
                  <ArrowUpRight size={13} strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight size={13} strokeWidth={2.5} />
                )}
                {m.change}
              </span>
            )}
            {m.up === null && (
              <span
                className="text-xs font-medium"
                style={{ color: t.textTertiary }}
              >
                {m.change}
              </span>
            )}
          </div>
          <div className="text-[11px] mt-1" style={{ color: t.textMuted }}>
            {m.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════════════════════
function ChartsSection({
  aumHistory,
  originationVolume,
  aumChangePercent,
  t,
  mode,
}: {
  aumHistory: CEODashboardData["aumHistory"];
  originationVolume: CEODashboardData["originationVolume"];
  aumChangePercent: number;
  t: ThemeTokens;
  mode: string;
}) {
  const gradientId = `aumGrad-${mode}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
      {/* AUM Growth */}
      <div
        className="ceo-fade-up ceo-delay-5 rounded-xl p-5"
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[13px] font-semibold">AUM Growth</div>
            <div className="text-[11px] mt-0.5" style={{ color: t.textTertiary }}>
              Last 8 months
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-md"
            style={{ background: t.successSoft }}
          >
            <TrendingUp size={13} strokeWidth={2} color={t.success} />
            <span
              className="text-xs font-semibold num"
              style={{ color: t.success }}
            >
              +{Math.abs(aumChangePercent)}%
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={aumHistory}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.chartLine} stopOpacity={0.08} />
                <stop
                  offset="100%"
                  stopColor={t.chartLine}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={t.chartGrid}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{
                fill: t.textTertiary,
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: t.textTertiary,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}M`}
              width={50}
            />
            <Tooltip
              content={<CEOChartTooltip t={t} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={t.chartLine}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: t.chartLine,
                stroke: t.bg,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Originations */}
      <div
        className="ceo-fade-up ceo-delay-6 rounded-xl p-5"
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[13px] font-semibold">
              Monthly Originations
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: t.textTertiary }}>
              Loan volume ($M)
            </div>
          </div>
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border-none cursor-pointer"
            style={{
              background: t.accentSoft,
              color: t.textSecondary,
            }}
          >
            6 months <ChevronDown size={12} strokeWidth={2} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={originationVolume} barSize={28}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={t.chartGrid}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{
                fill: t.textTertiary,
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: t.textTertiary,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}M`}
              width={50}
            />
            <Tooltip
              content={<CEOChartTooltip t={t} />}
            />
            <Bar
              dataKey="volume"
              fill={t.text}
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE + ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════
function PipelineActivitySection({
  deals,
  activities,
  t,
  mode,
}: {
  deals: PipelineDeal[];
  activities: DashActivityItem[];
  t: ThemeTokens;
  mode: string;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3 mb-6">
      {/* Pipeline Table */}
      <div
        className="ceo-fade-up ceo-delay-7 rounded-xl overflow-hidden"
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow,
        }}
      >
        <div
          className="flex justify-between items-center px-5 py-4"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">Lending Pipeline</span>
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: t.textTertiary,
                background: t.accentSoft,
              }}
            >
              {deals.length}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer transition-colors"
              style={{
                background: t.accentSoft,
                color: t.textSecondary,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = t.accentSoft)
              }
            >
              <Filter size={12} strokeWidth={2} /> Filter
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer"
              style={{
                background: t.text,
                color: t.invertedText,
              }}
            >
              <Plus size={12} strokeWidth={2.5} /> New Deal
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: t.bgSecondary }}>
                {["", "Deal", "Borrower", "Amount", "Type", "Stage", "Days"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold uppercase px-3 py-2"
                      style={{
                        color: t.textTertiary,
                        letterSpacing: "0.05em",
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="ceo-row-hover cursor-pointer"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = t.bgHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    className="pl-3 pr-1 py-2.5"
                    style={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    <CEOPriorityDot priority={deal.priority} t={t} />
                  </td>
                  <td
                    className="px-3 py-2.5 text-[13px] font-semibold"
                    style={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    {deal.name}
                  </td>
                  <td
                    className="px-3 py-2.5 text-[13px]"
                    style={{
                      color: t.textSecondary,
                      borderBottom: `1px solid ${t.borderLight}`,
                    }}
                  >
                    {deal.borrower}
                  </td>
                  <td
                    className="px-3 py-2.5 text-[13px] font-semibold num"
                    style={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    {fmtAmount(deal.amount)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs"
                    style={{
                      color: t.textTertiary,
                      borderBottom: `1px solid ${t.borderLight}`,
                    }}
                  >
                    {deal.type}
                  </td>
                  <td
                    className="px-3 py-2.5"
                    style={{ borderBottom: `1px solid ${t.borderLight}` }}
                  >
                    <CEOStagePill stage={deal.stage} t={t} />
                  </td>
                  <td
                    className="px-3 py-2.5 text-xs num"
                    style={{
                      color:
                        deal.daysInStage > 7 ? t.warning : t.textTertiary,
                      borderBottom: `1px solid ${t.borderLight}`,
                    }}
                  >
                    {deal.daysInStage}d
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm"
                    style={{ color: t.textTertiary }}
                  >
                    No active pipeline deals
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="flex justify-center py-2.5 px-5"
          style={{ borderTop: deals.length > 0 ? "none" : undefined }}
        >
          <button
            className="flex items-center gap-1 text-xs font-semibold border-none cursor-pointer bg-transparent px-2 py-1 rounded-md transition-colors"
            style={{ color: t.textSecondary }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = t.text)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = t.textSecondary)
            }
          >
            View full pipeline <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} t={t} />
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
const ACTIVITY_ICON_MAP: Record<
  DashActivityItem["type"],
  {
    icon: typeof CheckCircle;
    colorKey: keyof ThemeTokens;
    bgKey: keyof ThemeTokens;
  }
> = {
  funded: { icon: CheckCircle, colorKey: "success", bgKey: "successSoft" },
  upload: { icon: FileText, colorKey: "blue", bgKey: "blueSoft" },
  investor: { icon: ArrowDownRight, colorKey: "gold", bgKey: "goldSoft" },
  new_lead: { icon: Zap, colorKey: "text", bgKey: "accentSoft" },
  alert: { icon: AlertCircle, colorKey: "warning", bgKey: "warningSoft" },
  occupancy: { icon: Target, colorKey: "success", bgKey: "successSoft" },
};

function ActivityFeed({
  activities,
  t,
}: {
  activities: DashActivityItem[];
  t: ThemeTokens;
}) {
  return (
    <div
      className="ceo-fade-up ceo-delay-8 rounded-xl flex flex-col"
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
      }}
    >
      <div
        className="flex justify-between items-center px-[18px] py-4"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <span className="text-[13px] font-semibold">Activity</span>
        <button
          className="bg-transparent border-none cursor-pointer text-xs font-medium"
          style={{ color: t.textTertiary }}
        >
          View all
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {activities.map((item) => {
          const config = ACTIVITY_ICON_MAP[item.type] || ACTIVITY_ICON_MAP.alert;
          const Icon = config.icon;
          const iconColor = t[config.colorKey] as string;
          const iconBg = t[config.bgKey] as string;

          return (
            <div
              key={item.id}
              className="flex gap-3 items-start px-[18px] py-3 cursor-pointer ceo-row-hover"
              style={{ borderBottom: `1px solid ${t.borderLight}` }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.bgHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
                style={{ background: iconBg }}
              >
                <Icon size={14} strokeWidth={2} color={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium leading-snug">
                  {item.text}
                  {item.amount && (
                    <span className="num font-semibold ml-1">
                      {item.amount}
                    </span>
                  )}
                </div>
                <div
                  className="text-[11px] mt-1 flex gap-1.5"
                  style={{ color: t.textMuted }}
                >
                  <span>{item.time}</span>
                  {item.user && (
                    <>
                      <span>·</span>
                      <span>{item.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTFOLIO
// ═══════════════════════════════════════════════════════════════════════════════
function PortfolioSection({
  properties,
  count,
  t,
}: {
  properties: PortfolioProperty[];
  count: number;
  t: ThemeTokens;
}) {
  if (properties.length === 0) return null;

  return (
    <div
      className="ceo-fade-up ceo-delay-9 rounded-xl overflow-hidden"
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
      }}
    >
      <div
        className="flex justify-between items-center px-5 py-4"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">
            Investment Portfolio
          </span>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ color: t.textTertiary, background: t.accentSoft }}
          >
            {count} {count === 1 ? "fund" : "funds"}
          </span>
        </div>
        <button
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer"
          style={{ background: t.accentSoft, color: t.textSecondary }}
        >
          View all <ChevronRight size={12} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {properties.map((prop, i) => {
          const occColor =
            prop.occupancy >= 93
              ? t.success
              : prop.occupancy >= 85
                ? t.text
                : t.warning;

          return (
            <div
              key={prop.name}
              className="cursor-pointer ceo-row-hover"
              style={{
                padding: "18px 20px",
                borderRight:
                  i < properties.length - 1
                    ? `1px solid ${t.borderLight}`
                    : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.bgHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div className="text-[13px] font-semibold mb-0.5">
                {prop.name}
              </div>
              <div
                className="text-[11px] flex items-center gap-1 mb-3.5"
                style={{ color: t.textTertiary }}
              >
                <MapPin size={10} strokeWidth={2} /> {prop.location}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div
                    className="text-[10px] font-semibold uppercase"
                    style={{
                      color: t.textMuted,
                      letterSpacing: "0.05em",
                    }}
                  >
                    Units
                  </div>
                  <div className="text-base font-bold num mt-0.5">
                    {prop.units}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[10px] font-semibold uppercase"
                    style={{
                      color: t.textMuted,
                      letterSpacing: "0.05em",
                    }}
                  >
                    Occ.
                  </div>
                  <div
                    className="text-base font-bold num mt-0.5"
                    style={{ color: occColor }}
                  >
                    {prop.occupancy}%
                  </div>
                </div>
                <div className="col-span-2">
                  <div
                    className="text-[10px] font-semibold uppercase"
                    style={{
                      color: t.textMuted,
                      letterSpacing: "0.05em",
                    }}
                  >
                    NOI
                  </div>
                  <div className="text-base font-bold num mt-0.5">
                    {prop.noi}
                  </div>
                </div>
              </div>

              {/* Occupancy bar */}
              <div
                className="mt-3 h-[3px] rounded-sm overflow-hidden"
                style={{ background: t.bgTertiary }}
              >
                <div
                  className="h-full rounded-sm ceo-bar-fill"
                  style={{
                    width: `${prop.occupancy}%`,
                    background: occColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
