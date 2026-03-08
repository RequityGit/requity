import { createClient } from "@/lib/supabase/server";
import { timeAgo, getMonthLabel } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────
export interface HeroMetrics {
  totalAum: number;
  lendingAum: number;
  investmentAum: number;
  activeLoansCount: number;
  activeLoansOutstanding: number;
  investorCapital: number;
  investorCount: number;
  propertiesCount: number;
  totalUnits: number;
}

export interface SecondaryMetrics {
  wtdAvgRate: number;
  pipelineTotal: number;
  avgOccupancy: number | null;
  mtdDistributions: number;
  pendingDraws: number;
  capitalQtd: number;
}

export interface ActionItem {
  severity: "high" | "med";
  type: "draw" | "contribution" | "docs" | "application" | "distribution";
  label: string;
  detail: string;
  time: string;
  assignee: string;
}

export interface MaturityLoan {
  id: string;
  property: string;
  borrower: string;
  amount: number;
  rate: number;
  maturityDate: string;
  daysLeft: number;
  status: string;
}

export interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  value: number;
}

export interface OriginationMonth {
  month: string;
  volume: number;
}

export interface CapitalMonth {
  month: string;
  raised: number;
}

export interface ActivityEntry {
  id: string;
  person: string;
  initials: string;
  action: string;
  detail: string;
  time: string;
  color: string;
}

export interface DashboardData {
  hero: HeroMetrics;
  secondary: SecondaryMetrics;
  actions: ActionItem[];
  maturities: MaturityLoan[];
  pipeline: PipelineStage[];
  originations: OriginationMonth[];
  capitalRaised: CapitalMonth[];
  activities: ActivityEntry[];
  totalPipelineValue: number;
  totalPipelineDeals: number;
  ytdCapital: number;
  qtdCapital: number;
  prospectCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function getQuarterStart(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split("T")[0];
}

function getYearStart(): string {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

function getSixMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().split("T")[0];
}

function getDaysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const PIPELINE_STAGES = [
  { key: "lead", label: "Lead" },
  { key: "application", label: "Application" },
  { key: "underwriting", label: "UW" },
  { key: "approved", label: "Approved" },
  { key: "clear_to_close", label: "Closing" },
  { key: "funded", label: "Funded" },
] as const;

const STAGE_COLORS: Record<string, string> = {
  lead: "#9FAAB5",
  application: "#2E6EA6",
  underwriting: "#B8822A",
  approved: "#C5975B",
  clear_to_close: "#1A3355",
  funded: "#1B7A44",
};

// ─── Main Data Fetch ──────────────────────────────────────────
export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient();

  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  // Run all queries in parallel
  const [
    fundsResult,
    loansResult,
    commitmentsResult,
    investorCountResult,
    distributionsResult,
    drawRequestsResult,
    maturityLoansResult,
    activityResult,
    capitalQtdResult,
    capitalYtdResult,
    prospectsResult,
  ] = await Promise.all([
    // Total AUM from funds
    supabase
      .from("funds")
      .select("current_aum, fund_type")
      .is("deleted_at", null),
    // All loans (for pipeline, active count, etc.)
    supabase
      .from("loans")
      .select("id, loan_amount, interest_rate, stage, type, funding_date, property_address, maturity_date, borrower_id")
      .is("deleted_at", null),
    // Investor commitments
    supabase
      .from("investor_commitments")
      .select("commitment_amount, funded_amount, investor_id, status")
      .eq("status", "active"),
    // Distinct investor count
    supabase
      .from("investors")
      .select("id", { count: "exact", head: true }),
    // MTD distributions
    supabase
      .from("distributions")
      .select("amount, distribution_date")
      .gte("distribution_date", getMonthStart()),
    // Pending draw requests
    supabase
      .from("draw_requests")
      .select("id, amount_requested, status, created_at, loan_id")
      .in("status", ["submitted", "under_review"]),
    // Upcoming maturities (loans with maturity in next 60 days)
    supabase
      .from("loan_pipeline")
      .select("id, property_address, borrower_name, loan_amount, interest_rate, maturity_date, loan_stage")
      .not("maturity_date", "is", null)
      .gte("maturity_date", now.toISOString().split("T")[0])
      .lte("maturity_date", sixtyDaysFromNow.toISOString().split("T")[0])
      .order("maturity_date", { ascending: true })
      .limit(5),
    // Recent loan activity
    supabase
      .from("loan_activity_log")
      .select("id, action, description, created_at, performed_by, metadata")
      .order("created_at", { ascending: false })
      .limit(6),
    // Capital QTD (commitment_date in current quarter)
    supabase
      .from("investor_commitments")
      .select("commitment_amount, commitment_date")
      .gte("commitment_date", getQuarterStart()),
    // Capital YTD
    supabase
      .from("investor_commitments")
      .select("commitment_amount, commitment_date")
      .gte("commitment_date", getYearStart()),
    // Prospect count from CRM
    supabase
      .from("crm_contacts")
      .select("id", { count: "exact", head: true })
      .in("status", ["active"])
      .in("type", ["lead", "prospect"]),
  ]);

  // ─── Hero Metrics ────────────────────────────────────────
  const funds = fundsResult.data ?? [];
  const totalAum = funds.reduce((s, f) => s + (f.current_aum ?? 0), 0);
  const investmentAum = funds
    .filter((f) => f.fund_type === "equity" || f.fund_type === "hybrid")
    .reduce((s, f) => s + (f.current_aum ?? 0), 0);
  const lendingAum = totalAum - investmentAum;

  const loans = loansResult.data ?? [];
  const activeStages = ["funded", "servicing"];
  const activeLoans = loans.filter((l) => activeStages.includes(l.stage));
  const activeLoansCount = activeLoans.length;
  const activeLoansOutstanding = activeLoans.reduce(
    (s, l) => s + (l.loan_amount ?? 0),
    0
  );

  const commitments = commitmentsResult.data ?? [];
  const investorCapital = commitments.reduce(
    (s, c) => s + (c.commitment_amount ?? 0),
    0
  );
  const investorCount = investorCountResult.count ?? 0;

  // Properties: count via site_portfolio_properties or estimate from loans
  const propertiesCount = activeLoans.filter((l) => l.property_address).length;
  const totalUnits = propertiesCount; // Approximate

  // ─── Secondary Metrics ────────────────────────────────────
  const loansWithRate = activeLoans.filter(
    (l) => l.interest_rate && l.loan_amount
  );
  const totalWeightedRate = loansWithRate.reduce(
    (s, l) => s + (l.interest_rate ?? 0) * (l.loan_amount ?? 0),
    0
  );
  const totalWeightedAmount = loansWithRate.reduce(
    (s, l) => s + (l.loan_amount ?? 0),
    0
  );
  const wtdAvgRate =
    totalWeightedAmount > 0 ? totalWeightedRate / totalWeightedAmount : 0;

  const pipelineStageKeys = [
    "lead",
    "application",
    "processing",
    "underwriting",
    "approved",
    "clear_to_close",
  ];
  const pipelineLoans = loans.filter((l) => pipelineStageKeys.includes(l.stage));
  const pipelineTotal = pipelineLoans.reduce(
    (s, l) => s + (l.loan_amount ?? 0),
    0
  );

  const mtdDistributions =
    distributionsResult.data?.reduce((s, d) => s + (d.amount ?? 0), 0) ?? 0;
  const pendingDraws = drawRequestsResult.data?.length ?? 0;

  const capitalQtd =
    capitalQtdResult.data?.reduce(
      (s, c) => s + (c.commitment_amount ?? 0),
      0
    ) ?? 0;
  const capitalYtd =
    capitalYtdResult.data?.reduce(
      (s, c) => s + (c.commitment_amount ?? 0),
      0
    ) ?? 0;

  // ─── Action Items ─────────────────────────────────────────
  const actions: ActionItem[] = [];

  // Pending draw requests
  const draws = drawRequestsResult.data ?? [];
  if (draws.length > 0) {
    actions.push({
      severity: "high",
      type: "draw",
      label: `${draws.length} draw request${draws.length > 1 ? "s" : ""} pending review`,
      detail: `Total: $${Math.round(draws.reduce((s, d) => s + d.amount_requested, 0) / 1000)}K requested`,
      time: draws[0] ? timeAgo(draws[0].created_at) : "Today",
      assignee: "Dylan",
    });
  }

  // Capital QTD pending
  if (capitalQtd > 0) {
    actions.push({
      severity: "high",
      type: "contribution",
      label: "Investor contributions need allocation",
      detail: `$${(capitalQtd / 1000).toFixed(0)}K QTD commitments`,
      time: "This quarter",
      assignee: "Grethel",
    });
  }

  // Loans needing docs (in processing)
  const processingLoans = loans.filter((l) => l.stage === "processing");
  if (processingLoans.length > 0) {
    actions.push({
      severity: "med",
      type: "docs",
      label: `${processingLoans.length} loan${processingLoans.length > 1 ? "s" : ""} awaiting doc verification`,
      detail: processingLoans
        .slice(0, 3)
        .map((l) => l.property_address?.split(",")[0] || "Unknown")
        .join(", "),
      time: "Today",
      assignee: "Estefania",
    });
  }

  // New applications
  const recentApps = loans.filter((l) => l.stage === "application");
  if (recentApps.length > 0) {
    actions.push({
      severity: "med",
      type: "application",
      label: `${recentApps.length} loan application${recentApps.length > 1 ? "s" : ""} in queue`,
      detail: `$${(recentApps.reduce((s, l) => s + (l.loan_amount ?? 0), 0) / 1e6).toFixed(1)}M total`,
      time: "Active",
      assignee: "Luis",
    });
  }

  // Distributions
  if (mtdDistributions > 0) {
    actions.push({
      severity: "med",
      type: "distribution",
      label: "Monthly distributions processing",
      detail: `$${(mtdDistributions / 1000).toFixed(0)}K MTD`,
      time: "This month",
      assignee: "Mike",
    });
  }

  // Ensure we always have at least some items
  if (actions.length === 0) {
    actions.push({
      severity: "med",
      type: "docs",
      label: "No urgent items",
      detail: "All caught up!",
      time: "Now",
      assignee: "Team",
    });
  }

  // ─── Maturities ───────────────────────────────────────────
  const maturityData = maturityLoansResult.data ?? [];
  const maturities: MaturityLoan[] = maturityData.map((l) => ({
    id: l.id ?? crypto.randomUUID(),
    property: l.property_address || "Unknown Property",
    borrower: l.borrower_name || "Unknown",
    amount: l.loan_amount ?? 0,
    rate: l.interest_rate ?? 0,
    maturityDate: l.maturity_date
      ? new Date(l.maturity_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—",
    daysLeft: l.maturity_date ? getDaysUntil(l.maturity_date) : 999,
    status: l.loan_stage === "servicing" ? "current" : l.loan_stage === "default" ? "overdue" : "current",
  }));

  // ─── Pipeline ─────────────────────────────────────────────
  const pipeline: PipelineStage[] = PIPELINE_STAGES.map(({ key, label }) => {
    const stageLoans = loans.filter((l) => l.stage === key);
    return {
      stage: key,
      label,
      count: stageLoans.length,
      value: stageLoans.reduce((s, l) => s + (l.loan_amount ?? 0), 0),
    };
  });
  const totalPipelineValue = pipeline.reduce((s, p) => s + p.value, 0);
  const totalPipelineDeals = pipeline.reduce((s, p) => s + p.count, 0);

  // ─── Origination Volume (last 6 months) ───────────────────
  const originations: OriginationMonth[] = [];
  const fundedLoans = loans.filter((l) => l.funding_date);
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthLoans = fundedLoans.filter((l) => {
      const fd = new Date(l.funding_date!);
      return fd >= monthStart && fd <= monthEnd;
    });
    originations.push({
      month: getMonthLabel(d),
      volume: monthLoans.reduce((s, l) => s + (l.loan_amount ?? 0), 0),
    });
  }

  // ─── Capital Raised (last 6 months) ───────────────────────
  const capitalRaised: CapitalMonth[] = [];
  const allCommitments = capitalYtdResult.data ?? [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthCommitments = allCommitments.filter((c) => {
      if (!c.commitment_date) return false;
      const cd = new Date(c.commitment_date);
      return cd >= monthStart && cd <= monthEnd;
    });
    capitalRaised.push({
      month: getMonthLabel(d),
      raised: monthCommitments.reduce(
        (s, c) => s + (c.commitment_amount ?? 0),
        0
      ),
    });
  }

  // ─── Team Activity ────────────────────────────────────────
  const activityData = activityResult.data ?? [];
  const teamColors = ["#2E6EA6", "#1B7A44", "#C5975B", "#1A3355", "#9B6B2F", "#B8822A"];
  const activities: ActivityEntry[] = activityData.map((a, i) => ({
    id: a.id,
    person: "Team",
    initials: "RG",
    action: a.action,
    detail: a.description,
    time: timeAgo(a.created_at),
    color: teamColors[i % teamColors.length],
  }));

  // If no activities from DB, show a placeholder
  if (activities.length === 0) {
    activities.push({
      id: "placeholder",
      person: "System",
      initials: "SY",
      action: "No recent activity",
      detail: "Activity will appear here as team members take actions",
      time: "Now",
      color: "#9FAAB5",
    });
  }

  const prospectCount = prospectsResult.count ?? 0;

  return {
    hero: {
      totalAum,
      lendingAum,
      investmentAum,
      activeLoansCount,
      activeLoansOutstanding,
      investorCapital,
      investorCount,
      propertiesCount,
      totalUnits,
    },
    secondary: {
      wtdAvgRate,
      pipelineTotal,
      avgOccupancy: null,
      mtdDistributions,
      pendingDraws,
      capitalQtd: capitalQtd,
    },
    actions,
    maturities,
    pipeline,
    originations,
    capitalRaised,
    activities,
    totalPipelineValue,
    totalPipelineDeals,
    ytdCapital: capitalYtd,
    qtdCapital: capitalQtd,
    prospectCount,
  };
}
