import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DistributionForm } from "@/components/admin/distribution-form";
import { DistributionListTable } from "@/components/admin/distribution-list-table";

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

export default async function AdminDistributionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: distributions } = await supabase
    .from("distributions")
    .select("*, funds(name), investors(user_id, crm_contacts(name, first_name, last_name))")
    .order("distribution_date", { ascending: false });

  const { data: funds } = await supabase
    .from("funds")
    .select("id, name")
    .order("name");

  // Build profile name fallback
  const investorUserIds = new Set<string>();
  (distributions ?? []).forEach((row) => {
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

  const distRows = (distributions ?? []).map((d) => ({
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
        title="Distributions"
        description="Record and manage investor distributions."
        action={<DistributionForm funds={funds ?? []} />}
      />

      <DistributionListTable data={distRows} />
    </div>
  );
}
