import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DistributionForm } from "@/components/admin/distribution-form";
import { DistributionListTable } from "@/components/admin/distribution-list-table";

export default async function AdminDistributionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: distributions } = await supabase
    .from("distributions")
    .select("*, funds(name), profiles(full_name)")
    .order("distribution_date", { ascending: false });

  const { data: funds } = await supabase
    .from("funds")
    .select("id, name")
    .order("name");

  const distRows = (distributions ?? []).map((d) => ({
    id: d.id,
    fund_name: (d as any).funds?.name ?? "—",
    investor_name: (d as any).profiles?.full_name ?? "Unknown",
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
