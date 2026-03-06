import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/shared/kpi-card";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { PricingProgramsManager } from "@/components/admin/pricing-programs-manager";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AdminPricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch programs and adjusters — tables may not exist yet
  let programs: any[] = [];
  let adjusters: any[] = [];
  let versions: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("pricing_programs")
      .select("*")
      .order("program_id")
      .order("version", { ascending: false });
    programs = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("leverage_adjusters")
      .select("*")
      .order("sort_order");
    adjusters = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("pricing_program_versions")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(20);
    versions = data ?? [];
  } catch { /* table may not exist */ }

  const currentPrograms = programs.filter((p) => p.is_current);
  const activeAdjusters = adjusters.filter((a) => a.is_active);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Engine"
        description="Manage RTL Fix & Flip loan programs, rates, and leverage adjusters"
        action={
          <Link href="/admin/pricing/calculator">
            <Button>
              <Calculator className="h-4 w-4 mr-2" />
              Deal Calculator
            </Button>
          </Link>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Active Programs"
          value={currentPrograms.length}
        />
        <KpiCard
          title="Leverage Adjusters"
          value={activeAdjusters.length}
        />
        <KpiCard
          title="Premier Rate"
          value={`${currentPrograms.find((p) => p.program_id === "ff_premier")?.interest_rate ?? "—"}%`}
        />
        <KpiCard
          title="Balance Sheet Rate"
          value={`${currentPrograms.find((p) => p.program_id === "ff_balance")?.interest_rate ?? "—"}%`}
        />
      </div>

      {/* Programs + Adjusters + Version History */}
      <PricingProgramsManager
        programs={programs}
        adjusters={adjusters}
        versions={versions}
      />
    </div>
  );
}
