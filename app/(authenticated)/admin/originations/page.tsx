import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { CreateLoanDialog } from "@/components/admin/create-loan-dialog";
import { OriginationsTabs } from "@/components/admin/originations/originations-tabs";
import { Home, ClipboardList, Calculator, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AdminOriginationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // ── Fetch all data in parallel ──────────────────────────────────────

  const [
    loansResult,
    teamResult,
    borrowersResult,
    documentsResult,
  ] = await Promise.all([
    // Pipeline data
    supabase
      .from("loans")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    admin
      .from("borrowers")
      .select("id, first_name, last_name, email")
      .order("last_name"),
    supabase
      .from("documents")
      .select("loan_id")
      .not("loan_id", "is", null),
  ]);

  if (borrowersResult.error) {
    console.error("Failed to fetch borrowers:", borrowersResult.error);
  }

  // RTL Pricing data — tables may not exist yet
  let programsData: any[] = [];
  let adjustersData: any[] = [];
  let versionsData: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("pricing_programs")
      .select("*")
      .order("program_id")
      .order("version", { ascending: false });
    programsData = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("leverage_adjusters")
      .select("*")
      .order("sort_order");
    adjustersData = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("pricing_program_versions")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(20);
    versionsData = data ?? [];
  } catch { /* table may not exist */ }

  // DSCR Pricing data — tables may not exist yet
  let dscrLendersData: any[] = [];
  let dscrProductsData: any[] = [];
  let dscrAdjustmentsData: any[] = [];
  let dscrVersionsData: any[] = [];
  let dscrUploadsData: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("dscr_lenders")
      .select("*")
      .order("name");
    dscrLendersData = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_lender_products")
      .select("*, dscr_lenders(name, short_name)")
      .order("product_name");
    dscrProductsData = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_price_adjustments")
      .select("*")
      .order("category")
      .order("sort_order");
    dscrAdjustmentsData = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_pricing_versions")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(30);
    dscrVersionsData = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("dscr_rate_sheet_uploads")
      .select("*, dscr_lenders(name, short_name), dscr_lender_products(product_name)")
      .order("created_at", { ascending: false })
      .limit(30);
    dscrUploadsData = data ?? [];
  } catch { /* table may not exist */ }

  // Condition counts — separate query so it won't break if the table doesn't exist yet
  let conditionsResult: { data: any[] | null } = { data: [] };
  try {
    conditionsResult = await supabase
      .from("loan_conditions")
      .select("loan_id, status");
  } catch {
    // table may not exist yet
  }

  // ── Build Pipeline tab data ────────────────────────────────────────

  const allProfiles: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null }) => {
      allProfiles[t.id] = t.full_name ?? "Unknown";
    }
  );

  const loans = loansResult.data ?? [];
  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );
  const borrowers = (borrowersResult.data ?? []).map(
    (b: {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
    }) => ({
      id: b.id,
      full_name: `${b.first_name} ${b.last_name}`.trim() || "Unknown",
      email: b.email ?? "",
      company_name: null as string | null,
    })
  );

  const docCounts: Record<string, number> = {};
  (documentsResult.data ?? []).forEach((d: { loan_id: string | null }) => {
    if (d.loan_id) {
      docCounts[d.loan_id] = (docCounts[d.loan_id] ?? 0) + 1;
    }
  });

  const conditionTotals: Record<string, number> = {};
  const conditionReceived: Record<string, number> = {};
  (conditionsResult.data ?? []).forEach(
    (c: { loan_id: string; status: string }) => {
      conditionTotals[c.loan_id] = (conditionTotals[c.loan_id] ?? 0) + 1;
      if (
        ["submitted", "under_review", "approved", "waived"].includes(c.status)
      ) {
        conditionReceived[c.loan_id] =
          (conditionReceived[c.loan_id] ?? 0) + 1;
      }
    }
  );

  const borrowerLookup: Record<string, string> = {};
  borrowers.forEach((b) => {
    borrowerLookup[b.id] = b.full_name;
  });

  const loanRows = loans.map((l: any) => ({
    id: l.id,
    loan_number: l.loan_number,
    property_address: l.property_address,
    property_city: l.property_city,
    property_state: l.property_state,
    borrower_name: borrowerLookup[l.borrower_id] ?? "—",
    borrower_id: l.borrower_id,
    loan_type: l.type,
    loan_amount: l.loan_amount,
    stage: l.stage,
    stage_updated_at: l.stage_updated_at,
    created_at: l.created_at,
    priority: l.priority ?? "normal",
    next_action: l.next_action,
    originator_name:
      (l.originator_id && allProfiles[l.originator_id]) ??
      l.originator ??
      null,
    processor_name:
      (l.processor_id && allProfiles[l.processor_id]) ?? null,
    document_count: docCounts[l.id] ?? 0,
    total_conditions: conditionTotals[l.id] ?? 0,
  }));

  // ── Build Conditions tab data ──────────────────────────────────────

  const activeStages = [
    "lead",
    "application",
    "processing",
    "underwriting",
    "approved",
    "clear_to_close",
    "funded",
  ] as const;

  const activeLoans = loans.filter((l: any) =>
    (activeStages as readonly string[]).includes(l.stage)
  );
  const activeLoanIds = activeLoans.map((l: any) => l.id);

  let conditionsForDashboard: any[] = [];
  if (activeLoanIds.length > 0) {
    try {
      const { data } = await supabase
        .from("loan_conditions")
        .select("*")
        .in("loan_id", activeLoanIds)
        .order("due_date", { ascending: true });
      conditionsForDashboard = data ?? [];
    } catch {
      // table may not exist
    }
  }

  // Build loan lookup for conditions
  const borrowerIds = Array.from(
    new Set(activeLoans.map((l: any) => l.borrower_id).filter(Boolean))
  );
  let borrowerNames: Record<string, string> = {};
  if (borrowerIds.length > 0) {
    const { data: borrowerRows } = await supabase
      .from("borrowers")
      .select("id, first_name, last_name")
      .in("id", borrowerIds);
    (borrowerRows ?? []).forEach((b: any) => {
      borrowerNames[b.id] =
        `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "Unknown";
    });
  }

  const loanLookup: Record<string, any> = {};
  activeLoans.forEach((l: any) => {
    loanLookup[l.id] = {
      ...l,
      borrower: {
        full_name: borrowerNames[l.borrower_id] ?? "Unknown",
      },
    };
  });

  const conditionsWithLoan = conditionsForDashboard.map((c: any) => ({
    ...c,
    loan: loanLookup[c.loan_id] ?? null,
  }));

  // ── Build Pricing tab data ─────────────────────────────────────────

  const programs = programsData;
  const adjusters = adjustersData;
  const versions = versionsData;

  // ── KPI calculations ──────────────────────────────────────────────

  const pipelineCount = loanRows.length;
  const pendingConditionsCount = conditionsWithLoan.filter(
    (c: any) => c.status === "pending"
  ).length;
  const activePrograms = programs.filter((p: any) => p.is_current).length;
  const activeDscrProducts = dscrProductsData.filter((p: any) => p.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Originations"
        description="Loan pipeline, conditions tracking, and pricing management."
        action={
          <CreateLoanDialog
            teamMembers={teamMembers}
            borrowers={borrowers}
            currentUserId={user.id}
          />
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Pipeline Loans"
          value={pipelineCount}
          icon={<Home className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Conditions"
          value={pendingConditionsCount}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="RTL Programs"
          value={activePrograms}
          icon={<Calculator className="h-5 w-5" />}
        />
        <KpiCard
          title="DSCR Products"
          value={activeDscrProducts}
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      {/* Tabbed Content */}
      <OriginationsTabs
        loanRows={loanRows}
        teamMembers={teamMembers}
        currentUserId={user.id}
        conditions={conditionsWithLoan}
        programs={programs}
        adjusters={adjusters}
        versions={versions}
        dscrLenders={dscrLendersData}
        dscrProducts={dscrProductsData}
        dscrAdjustments={dscrAdjustmentsData}
        dscrVersions={dscrVersionsData}
        dscrUploads={dscrUploadsData}
        pipelineCount={pipelineCount}
        pendingConditionsCount={pendingConditionsCount}
      />
    </div>
  );
}
