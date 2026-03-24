import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { InvestmentForm } from "@/components/admin/investment-form";
import { FundListTable } from "@/components/admin/fund-list-table";
import { ContributionForm } from "@/components/admin/contribution-form";
import { ContributionListTable } from "@/components/admin/contribution-list-table";
import { DistributionForm } from "@/components/admin/distribution-form";
import { DistributionListTable } from "@/components/admin/distribution-list-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to extract investor name, with fallback to profile names
function getInvestorName(
  row: Record<string, unknown>,
  profileNames?: Map<string, string>
): string {
  const investors = row.investors as Record<string, unknown> | null;
  if (!investors) return "Unknown";
  const crm = investors.crm_contacts as Record<string, unknown> | null;
  if (crm) {
    if (crm.name) return crm.name as string;
    const first = (crm.first_name as string) ?? "";
    const last = (crm.last_name as string) ?? "";
    const crmName = `${first} ${last}`.trim();
    if (crmName) return crmName;
  }
  const userId = investors.user_id as string | null;
  if (userId && profileNames?.has(userId)) return profileNames.get(userId)!;
  return "Unknown";
}

export default async function AdminFundsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [fundsResult, contributionsResult, distributionsResult] =
    await Promise.all([
      supabase
        .from("funds")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("capital_calls")
        .select(
          "*, funds!capital_calls_fund_id_fkey(name), investors!capital_calls_investor_id_fkey(user_id, crm_contacts(name, first_name, last_name)), investor_commitments!capital_calls_commitment_id_fkey(commitment_amount)"
        )
        .order("due_date", { ascending: false }),
      supabase
        .from("distributions")
        .select("*, funds!distributions_fund_id_fkey(name), investors!distributions_investor_id_fkey(user_id, crm_contacts(name, first_name, last_name))")
        .order("distribution_date", { ascending: false }),
    ]);

  if (fundsResult.error) {
    console.error("Error fetching funds:", fundsResult.error);
  }
  if (contributionsResult.error) {
    console.error("Error fetching contributions:", contributionsResult.error);
  }
  if (distributionsResult.error) {
    console.error("Error fetching distributions:", distributionsResult.error);
  }

  const funds = fundsResult.data ?? [];
  const contributions = contributionsResult.data ?? [];
  const distributions = distributionsResult.data ?? [];

  // Build profile name fallback for investors without crm_contact_id
  const investorUserIds = new Set<string>();
  [...contributions, ...distributions].forEach((row) => {
    const inv = (row as Record<string, unknown>).investors as Record<string, unknown> | null;
    if (inv?.user_id) investorUserIds.add(inv.user_id as string);
  });
  const profileNames = new Map<string, string>();
  if (investorUserIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(investorUserIds));
    (profiles ?? []).forEach((p) => {
      if (p.full_name) profileNames.set(p.id, p.full_name);
    });
  }

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

  const contributionRows = contributions.map((cc) => ({
    id: cc.id,
    fund_name: (cc as any).funds?.name ?? "---",
    investor_name: getInvestorName(cc as unknown as Record<string, unknown>, profileNames),
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
    investor_name: getInvestorName(d as unknown as Record<string, unknown>, profileNames),
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
      />

      <Tabs defaultValue="investments">
        <div className="flex items-center gap-3">
          <TabsList>
          <TabsTrigger value="investments">
            Investments ({fundRows.length})
          </TabsTrigger>
          <TabsTrigger value="contributions">
            Contributions ({contributionRows.length})
          </TabsTrigger>
          <TabsTrigger value="distributions">
            Distributions ({distRows.length})
          </TabsTrigger>
        </TabsList>
          <div className="flex-1" />
          <InvestmentForm />
        </div>

        <TabsContent value="investments" className="mt-4">
          <FundListTable data={fundRows} />
        </TabsContent>

        <TabsContent value="contributions" className="mt-4">
          <div className="flex justify-end mb-4">
            <ContributionForm funds={fundOptions} />
          </div>
          <ContributionListTable data={contributionRows} />
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
