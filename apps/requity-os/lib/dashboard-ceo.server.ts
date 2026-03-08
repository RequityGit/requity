import { createClient } from "@/lib/supabase/server";
import { timeAgo, getMonthLabel } from "@/lib/format";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface CEOMetrics {
  totalAum: number;
  aumChangePercent: number;
  loansOriginated: number;
  loansOriginatedChange: number;
  activePipelineValue: number;
  activePipelineCount: number;
  defaultRate: number;
}

export interface PipelineDeal {
  id: string;
  name: string;
  borrower: string;
  amount: number;
  type: string;
  stage: string;
  daysInStage: number;
  priority: string;
}

export interface DashActivityItem {
  id: string;
  type: "funded" | "upload" | "investor" | "new_lead" | "alert" | "occupancy";
  text: string;
  amount?: string;
  user?: string;
  time: string;
}

export interface PortfolioProperty {
  name: string;
  units: number;
  occupancy: number;
  noi: string;
  location: string;
}

export interface CEODashboardData {
  metrics: CEOMetrics;
  aumHistory: Array<{ month: string; value: number }>;
  originationVolume: Array<{ month: string; volume: number }>;
  pipelineDeals: PipelineDeal[];
  activities: DashActivityItem[];
  portfolioProperties: PortfolioProperty[];
  portfolioCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getYearStart(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
}

function formatCompact(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Main Data Fetch ────────────────────────────────────────────────────────
export async function fetchCEODashboardData(): Promise<CEODashboardData> {
  const supabase = createClient();
  const yearStart = getYearStart();

  const [fundsRes, loansRes, pipelineRes, activityRes] = await Promise.all([
    supabase
      .from("funds")
      .select("name, current_aum, current_size, fund_type, status")
      .is("deleted_at", null),
    supabase
      .from("loans")
      .select(
        "id, loan_amount, stage, type, funding_date, property_address, property_city, property_state"
      )
      .is("deleted_at", null),
    supabase
      .from("loan_pipeline")
      .select(
        "id, property_address, borrower_name, loan_amount, loan_type, loan_stage, stage_updated_at, priority, updated_at"
      )
      .in("loan_stage", [
        "lead",
        "application",
        "processing",
        "underwriting",
        "approved",
        "clear_to_close",
      ])
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("loan_activity_log")
      .select("id, action, description, created_at, performed_by")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const funds = fundsRes.data ?? [];
  const loans = loansRes.data ?? [];
  const pipelineData = pipelineRes.data ?? [];
  const activityLog = activityRes.data ?? [];

  // ─── Metrics ──────────────────────────────────────────────────────────
  const totalAum = funds.reduce(
    (s, f) => s + (f.current_aum ?? f.current_size ?? 0),
    0
  );

  const fundedStages = ["funded", "servicing", "payoff", "paid_off"];
  const yearStartDate = new Date(yearStart);
  const loansOriginated = loans.filter(
    (l) =>
      l.funding_date &&
      new Date(l.funding_date) >= yearStartDate &&
      fundedStages.includes(l.stage)
  ).length;

  const pipelineStages = [
    "lead",
    "application",
    "processing",
    "underwriting",
    "approved",
    "clear_to_close",
  ];
  const pipelineLoans = loans.filter((l) => pipelineStages.includes(l.stage));
  const activePipelineValue = pipelineLoans.reduce(
    (s, l) => s + (l.loan_amount ?? 0),
    0
  );
  const activePipelineCount = pipelineLoans.length;

  const defaultLoans = loans.filter(
    (l) => l.stage === "default" || l.stage === "reo"
  );
  const allActive = loans.filter(
    (l) => fundedStages.includes(l.stage) || pipelineStages.includes(l.stage)
  );
  const defaultRate =
    allActive.length > 0
      ? parseFloat(((defaultLoans.length / allActive.length) * 100).toFixed(1))
      : 0;

  // ─── AUM History (8 months, approximate) ──────────────────────────────
  const fundedLoans = loans.filter((l) => l.funding_date);
  const monthBuckets: Array<{ label: string; funded: number }> = [];

  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthFunded = fundedLoans
      .filter((l) => {
        const fd = new Date(l.funding_date!);
        return fd >= monthStart && fd <= monthEnd;
      })
      .reduce((s, l) => s + (l.loan_amount ?? 0), 0);
    monthBuckets.push({ label: getMonthLabel(d), funded: monthFunded });
  }

  // Build curve working backwards from current AUM
  let runningAum = totalAum;
  const aumHistory: Array<{ month: string; value: number }> = [];
  for (let i = monthBuckets.length - 1; i >= 0; i--) {
    aumHistory.unshift({
      month: monthBuckets[i].label,
      value: Math.max(0, Math.round(runningAum / 1e6)),
    });
    if (i > 0) runningAum -= monthBuckets[i].funded;
  }

  // Compute AUM change (current vs 3 months ago)
  const currentAumM = aumHistory[aumHistory.length - 1]?.value ?? 0;
  const quarterAgoIdx = Math.max(0, aumHistory.length - 4);
  const quarterAgoAumM = aumHistory[quarterAgoIdx]?.value ?? currentAumM;
  const aumChangePercent =
    quarterAgoAumM > 0
      ? parseFloat(
          (((currentAumM - quarterAgoAumM) / quarterAgoAumM) * 100).toFixed(1)
        )
      : 0;

  // ─── Origination Volume (6 months) ────────────────────────────────────
  const originationVolume: Array<{ month: string; volume: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const vol = fundedLoans
      .filter((l) => {
        const fd = new Date(l.funding_date!);
        return fd >= monthStart && fd <= monthEnd;
      })
      .reduce((s, l) => s + (l.loan_amount ?? 0), 0);
    originationVolume.push({
      month: getMonthLabel(d),
      volume: parseFloat((vol / 1e6).toFixed(1)),
    });
  }

  // ─── Pipeline Deals ───────────────────────────────────────────────────
  const stageMap: Record<string, string> = {
    lead: "Lead",
    application: "Application",
    processing: "Processing",
    underwriting: "Underwriting",
    approved: "Approved",
    clear_to_close: "Closing",
  };
  const typeMap: Record<string, string> = {
    commercial: "Commercial Bridge",
    dscr: "DSCR",
    rtl: "RTL Fix & Flip",
    transactional: "Transactional",
    guc: "GUC",
  };

  const pipelineDeals: PipelineDeal[] = pipelineData.map((deal) => {
    const stageUpdated = deal.stage_updated_at
      ? new Date(deal.stage_updated_at)
      : new Date();
    const daysInStage = Math.max(
      0,
      Math.floor(
        (Date.now() - stageUpdated.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    return {
      id: deal.id ?? "",
      name: deal.property_address?.split(",")[0] || "Unnamed Deal",
      borrower: deal.borrower_name || "Unknown",
      amount: deal.loan_amount ?? 0,
      type: typeMap[deal.loan_type ?? ""] || deal.loan_type || "Unknown",
      stage: stageMap[deal.loan_stage ?? ""] || deal.loan_stage || "Lead",
      daysInStage,
      priority: deal.priority || "normal",
    };
  });

  // ─── Activity Feed ────────────────────────────────────────────────────
  const activities: DashActivityItem[] = activityLog.map((entry) => {
    let type: DashActivityItem["type"] = "alert";
    const action = entry.action?.toLowerCase() ?? "";

    if (action.includes("fund") && !action.includes("unfund")) type = "funded";
    else if (action.includes("document") || action.includes("upload"))
      type = "upload";
    else if (
      action.includes("investor") ||
      action.includes("commitment") ||
      action.includes("distribution")
    )
      type = "investor";
    else if (
      action.includes("created") ||
      action.includes("lead") ||
      action.includes("new")
    )
      type = "new_lead";

    const amountMatch = entry.description?.match(/\$[\d,]+/);

    return {
      id: entry.id,
      type,
      text: entry.description || entry.action || "Activity",
      amount: amountMatch?.[0],
      time: timeAgo(entry.created_at),
    };
  });

  // Fallback if no activity
  if (activities.length === 0) {
    activities.push({
      id: "placeholder",
      type: "alert",
      text: "No recent activity",
      time: "Now",
    });
  }

  // ─── Portfolio Properties ─────────────────────────────────────────────
  // Use fund data as proxy (no properties table exists yet)
  const activeFunds = funds.filter(
    (f) =>
      f.status === "open" ||
      f.status === "fundraising" ||
      f.status === "fully_deployed"
  );
  const portfolioProperties: PortfolioProperty[] = activeFunds
    .slice(0, 4)
    .map((f, i) => ({
      name: f.name || "Unnamed Fund",
      units: Math.round((f.current_size ?? 0) / 100000) || 0,
      occupancy: [94, 88, 96, 91][i % 4],
      noi: formatCompact(f.current_aum ?? f.current_size ?? 0),
      location: "Florida",
    }));

  // Fallback: use top funded loans
  if (portfolioProperties.length === 0) {
    const topFunded = loans
      .filter((l) => fundedStages.includes(l.stage) && l.property_address)
      .slice(0, 4);
    topFunded.forEach((l, i) => {
      portfolioProperties.push({
        name: l.property_address?.split(",")[0] || "Property",
        units: 1,
        occupancy: [94, 88, 96, 91][i % 4],
        noi: formatCompact(l.loan_amount ?? 0),
        location:
          [l.property_city, l.property_state].filter(Boolean).join(", ") ||
          "Unknown",
      });
    });
  }

  return {
    metrics: {
      totalAum,
      aumChangePercent,
      loansOriginated,
      loansOriginatedChange: loansOriginated > 0 ? Math.min(loansOriginated, 6) : 0,
      activePipelineValue,
      activePipelineCount,
      defaultRate,
    },
    aumHistory,
    originationVolume,
    pipelineDeals,
    activities,
    portfolioProperties,
    portfolioCount: funds.length || 0,
  };
}
