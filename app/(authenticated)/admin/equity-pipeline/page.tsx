import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EquityPipelineTabs } from "@/components/admin/equity/equity-pipeline-tabs";
import { Building2, DollarSign, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function EquityPipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch pipeline data and team profiles in parallel
  const [pipelineResult, teamResult] = await Promise.all([
    admin.from("equity_pipeline").select("*"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const deals = (pipelineResult.data ?? []) as any[];
  const profiles: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null }) => {
      profiles[t.id] = t.full_name ?? "Unknown";
    }
  );

  // Enrich deals with assigned_to_name
  const enrichedDeals = deals.map((d: any) => ({
    ...d,
    assigned_to_name: d.assigned_to ? profiles[d.assigned_to] ?? null : null,
  }));

  // Filter active deals (not dead)
  const activeDeals = enrichedDeals.filter((d: any) => d.stage !== "dead");

  // KPI calculations
  const dealCount = activeDeals.length;
  const totalVolume = activeDeals.reduce(
    (sum: number, d: any) =>
      sum + (d.purchase_price || d.offer_price || d.asking_price || 0),
    0
  );
  const underContractCount = activeDeals.filter(
    (d: any) =>
      d.stage === "under_contract" ||
      d.stage === "closing" ||
      d.stage === "closed"
  ).length;
  const avgTargetIrr =
    activeDeals.filter((d: any) => d.target_irr).length > 0
      ? (
          activeDeals
            .filter((d: any) => d.target_irr)
            .reduce((sum: number, d: any) => sum + d.target_irr, 0) /
          activeDeals.filter((d: any) => d.target_irr).length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equity Pipeline"
        description="Track and manage equity investment deals from sourcing through disposition."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Active Deals"
          value={dealCount}
          icon={<Building2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Volume"
          value={`$${(totalVolume / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Under Contract+"
          value={underContractCount}
          icon={<Target className="h-5 w-5" />}
        />
        <KpiCard
          title="Avg Target IRR"
          value={avgTargetIrr === "—" ? "—" : `${avgTargetIrr}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Pipeline Tabs */}
      <EquityPipelineTabs deals={enrichedDeals} dealCount={dealCount} />
    </div>
  );
}
