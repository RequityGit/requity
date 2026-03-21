import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { OriginationsTabs } from "@/components/admin/originations/originations-tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ClipboardList, Calculator, Briefcase, Plus } from "lucide-react";

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
    opportunitiesResult,
    stageConfigResult,
  ] = await Promise.all([
    // Legacy loan pipeline data
    supabase
      .from("loans")
      .select("id, loan_number, property_address, property_city, property_state, borrower_id, type, loan_amount, stage, stage_updated_at, created_at, priority, next_action, originator_id, originator, processor_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    (admin as any)
      .from("borrowers")
      .select("id, first_name, last_name, email")
      .order("last_name"),
    supabase
      .from("documents")
      .select("loan_id")
      .not("loan_id", "is", null),
    // Deal pipeline
    admin
      .from("opportunity_pipeline")
      .select("id, deal_name, stage, loan_type, loan_purpose, funding_channel, proposed_loan_amount, proposed_ltv, approval_status, stage_changed_at, created_at, property_address, property_city, property_state, property_type, number_of_units, entity_name, borrower_name, borrower_count, originator, processor")
      .order("created_at", { ascending: false }),
    // Pipeline stage thresholds for kanban coloring
    admin
      .from("pipeline_stages")
      .select("stage_key, warn_days, alert_days")
      .order("stage_order"),
  ]);

  if (borrowersResult.error) {
    console.error("Failed to fetch borrowers:", borrowersResult.error);
  }

  // Pricing and DSCR data — tables may not exist yet, fetch in parallel
  const pricingQueries = await Promise.allSettled([
    // RTL Pricing
    (supabase as any)
      .from("pricing_programs")
      .select("id, program_id, program_name, version, is_current, base_rate, min_loan, max_loan, min_ltv, max_ltv, min_fico, term_months, created_at")
      .order("program_id")
      .order("version", { ascending: false }),
    (supabase as any)
      .from("leverage_adjusters")
      .select("id, adjuster_name, category, adjustment_value, sort_order, is_active")
      .order("sort_order"),
    (supabase as any)
      .from("pricing_program_versions")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(20),
    // DSCR Pricing
    (supabase as any)
      .from("dscr_lenders")
      .select("id, name, short_name, is_active, website, notes, created_at")
      .order("name"),
    (supabase as any)
      .from("dscr_lender_products")
      .select("id, lender_id, product_name, product_type, is_active, min_loan, max_loan, min_fico, min_dscr, max_ltv, created_at, dscr_lenders(name, short_name)")
      .order("product_name"),
    (supabase as any)
      .from("dscr_price_adjustments")
      .select("id, lender_id, product_id, category, label, adjustment_value, sort_order, is_active")
      .order("category")
      .order("sort_order"),
    (supabase as any)
      .from("dscr_pricing_versions")
      .select("id, lender_id, changed_by, change_type, summary, changed_at")
      .order("changed_at", { ascending: false })
      .limit(30),
    (supabase as any)
      .from("dscr_rate_sheet_uploads")
      .select("id, lender_id, product_id, file_name, storage_path, status, uploaded_by, created_at, dscr_lenders(name, short_name), dscr_lender_products(product_name)")
      .order("created_at", { ascending: false })
      .limit(30),
    // Loan conditions — fetch needed fields only
    supabase
      .from("loan_conditions")
      .select("id, loan_id, condition_name, status, category, due_date, description, created_at, updated_at")
      .order("due_date", { ascending: true }),
  ]);

  // Extract results from allSettled (handles errors gracefully)
  // Supabase queries return { data, error } objects
  const programsData = pricingQueries[0].status === "fulfilled" && !pricingQueries[0].value.error && pricingQueries[0].value.data ? pricingQueries[0].value.data : [];
  const adjustersData = pricingQueries[1].status === "fulfilled" && !pricingQueries[1].value.error && pricingQueries[1].value.data ? pricingQueries[1].value.data : [];
  const versionsData = pricingQueries[2].status === "fulfilled" && !pricingQueries[2].value.error && pricingQueries[2].value.data ? pricingQueries[2].value.data : [];
  const dscrLendersData = pricingQueries[3].status === "fulfilled" && !pricingQueries[3].value.error && pricingQueries[3].value.data ? pricingQueries[3].value.data : [];
  const dscrProductsData = pricingQueries[4].status === "fulfilled" && !pricingQueries[4].value.error && pricingQueries[4].value.data ? pricingQueries[4].value.data : [];
  const dscrAdjustmentsData = pricingQueries[5].status === "fulfilled" && !pricingQueries[5].value.error && pricingQueries[5].value.data ? pricingQueries[5].value.data : [];
  const dscrVersionsData = pricingQueries[6].status === "fulfilled" && !pricingQueries[6].value.error && pricingQueries[6].value.data ? pricingQueries[6].value.data : [];
  const dscrUploadsData = pricingQueries[7].status === "fulfilled" && !pricingQueries[7].value.error && pricingQueries[7].value.data ? pricingQueries[7].value.data : [];
  const allConditionsData = pricingQueries[8].status === "fulfilled" && !pricingQueries[8].value.error && pricingQueries[8].value.data ? pricingQueries[8].value.data : [];

  // Condition counts for loan rows (using loan_id and status only)
  const conditionsResult = { data: allConditionsData.map((c: any) => ({ loan_id: c.loan_id, status: c.status })) };

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
  const borrowers: { id: string; full_name: string; email: string; company_name: string | null }[] =
    (borrowersResult.data ?? []).map((b: any) => ({
      id: b.id,
      full_name: `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "Unknown",
      email: b.email ?? "",
      company_name: null as string | null,
    }));

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

  // Filter conditions for active loans (reuse the already-fetched allConditionsData)
  const conditionsForDashboard = allConditionsData.filter((c: any) =>
    activeLoanIds.includes(c.loan_id)
  );

  // Build loan lookup for conditions - reuse borrowersResult instead of fetching again
  const borrowerIds = Array.from(
    new Set(activeLoans.map((l: any) => l.borrower_id).filter(Boolean))
  );
  const borrowerNames: Record<string, string> = {};
  (borrowersResult.data ?? []).forEach((b: any) => {
    if (borrowerIds.includes(b.id)) {
      borrowerNames[b.id] =
        `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "Unknown";
    }
  });

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

  // ── Build Deal Pipeline data ────────────────────────────────────────

  const opportunities = opportunitiesResult.data ?? [];
  const opportunityRows = opportunities.map((o: any) => ({
    id: o.id,
    deal_name: o.deal_name,
    stage: o.stage,
    loan_type: o.loan_type,
    loan_purpose: o.loan_purpose,
    funding_channel: o.funding_channel,
    proposed_loan_amount: o.proposed_loan_amount,
    proposed_ltv: o.proposed_ltv,
    approval_status: o.approval_status,
    stage_changed_at: o.stage_changed_at,
    created_at: o.created_at,
    property_address: o.property_address,
    property_city: o.property_city,
    property_state: o.property_state,
    property_type: o.property_type,
    number_of_units: o.number_of_units,
    entity_name: o.entity_name,
    borrower_name: o.borrower_name,
    borrower_count: o.borrower_count,
    originator_name: o.originator ? allProfiles[o.originator] ?? null : null,
    processor_name: o.processor ? allProfiles[o.processor] ?? null : null,
  }));

  // Filter active opportunities (not closed_lost)
  const activeOpportunities = opportunityRows.filter(
    (o: any) => o.stage !== "closed_lost"
  );

  // ── KPI calculations ──────────────────────────────────────────────

  const pipelineCount = loanRows.length;
  const pendingConditionsCount = conditionsWithLoan.filter(
    (c: any) => c.status === "pending"
  ).length;
  const activePrograms = programs.filter((p: any) => p.is_current).length;
  const dealCount = activeOpportunities.length;
  const dealVolume = activeOpportunities.reduce(
    (sum: number, o: any) => sum + (o.proposed_loan_amount || 0),
    0
  );
  const activeDscrProducts = dscrProductsData.filter((p: any) => p.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Originations"
        description="Deal pipeline, conditions tracking, and pricing management."
        action={
          <Link href="/originations/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </Link>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          title="Active Deals"
          value={dealCount}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <KpiCard
          title="Deal Volume"
          value={`$${(dealVolume / 1000000).toFixed(1)}M`}
          icon={<Home className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Conditions"
          value={pendingConditionsCount}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="Pricing Programs"
          value={activePrograms + activeDscrProducts}
          description={`${activePrograms} RTL · ${activeDscrProducts} DSCR`}
          icon={<Calculator className="h-5 w-5" />}
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
        opportunityRows={opportunityRows}
        opportunityCount={dealCount}
        stageThresholds={stageConfigResult.data ?? []}
      />
    </div>
  );
}
