import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { InvestmentForm } from "@/components/admin/investment-form";
import { FundListTable } from "@/components/admin/fund-list-table";
import { CapitalCallForm } from "@/components/admin/capital-call-form";
import { CapitalCallListTable } from "@/components/admin/capital-call-list-table";
import { DistributionForm } from "@/components/admin/distribution-form";
import { DistributionListTable } from "@/components/admin/distribution-list-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to extract investor name from nested join chain
function getInvestorName(row: Record<string, unknown>): string {
  const investors = row.investors as Record<string, unknown> | null;
  if (!investors) return "Unknown";
  const crm = investors.crm_contacts as Record<string, unknown> | null;
  if (!crm) return "Unknown";
  if (crm.name) return crm.name as string;
  const first = (crm.first_name as string) ?? "";
  const last = (crm.last_name as string) ?? "";
  return `${first} ${last}`.trim() || "Unknown";
}

export default async function AdminFundsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [fundsResult, capitalCallsResult, distributionsResult] =
    await Promise.all([
      supabase
        .from("funds")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("capital_calls")
        .select(
          "*, funds(name), investors(crm_contacts(name, first_name, last_name)), investor_commitments(commitment_amount)"
        )
        .order("due_date", { ascending: false }),
      supabase
        .from("distributions")
        .select("*, funds(name), investors(crm_contacts(name, first_name, last_name))")
        .order("distribution_date", { ascending: false }),
    ]);

  const funds = fundsResult.data ?? [];
  const capitalCalls = capitalCallsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];

  const fundRows = funds.map((f) => ({
    id: f.id,
    name: f.name,
    fund_type: f.fund_type ?? "debt",
    target_size: f.target_size ?? 0,
    current_aum: f.current_aum,
    vintage_year: f.vintage_year ?? null,
    status: f.status,
    irr_target: f.irr_target ?? null,
    preferred_return: f.preferred_return ?? null,
    management_fee: f.management_fee ?? null,
  }));

  const fundOptions = funds.map((f) => ({ id: f.id, name: f.name }));

  const callRows = capitalCalls.map((cc) => ({
    id: cc.id,
    fund_name: (cc as any).funds?.name ?? "---",
    investor_name: getInvestorName(cc as unknown as Record<string, unknown>),
    call_amount: cc.call_amount,
    due_date: cc.due_date,
    paid_date: cc.paid_date,
    status: cc.status,
    commitment_amount:
      (cc as any).investor_commitments?.commitment_amount ?? null,
  }));

  const distRows = distributions.map((d) => ({
    id: d.id,
    fund_name: (d as any).funds?.name ?? "---",
    investor_name: getInvestorName(d as unknown as Record<string, unknown>),
    distribution_type: d.distribution_type ?? "income",
    amount: d.amount,
    distribution_date: d.distribution_date,
    description: d.description,
    status: d.status,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments"
        description="Manage all investments, contributions, and distributions."
        action={<InvestmentForm />}
      />

      <Tabs defaultValue="investments">
        <TabsList>
          <TabsTrigger value="investments">
            Investments ({fundRows.length})
          </TabsTrigger>
          <TabsTrigger value="contributions">
            Contributions ({callRows.length})
          </TabsTrigger>
          <TabsTrigger value="distributions">
            Distributions ({distRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="mt-4">
          <FundListTable data={fundRows} />
        </TabsContent>

        <TabsContent value="contributions" className="mt-4">
          <div className="flex justify-end mb-4">
            <CapitalCallForm funds={fundOptions} />
          </div>
          <CapitalCallListTable data={callRows} />
        </TabsContent>

        <TabsContent value="distributions" className="mt-4">
          <div className="flex justify-end mb-4">
            <DistributionForm funds={fundOptions} />
          </div>
          <DistributionListTable data={distRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
