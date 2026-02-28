import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CapitalCallForm } from "@/components/admin/capital-call-form";
import { CapitalCallListTable } from "@/components/admin/capital-call-list-table";

export default async function AdminCapitalCallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: capitalCalls } = await supabase
    .from("capital_calls")
    .select(
      "*, funds(name), profiles(full_name), investor_commitments(commitment_amount)"
    )
    .order("due_date", { ascending: false });

  const { data: funds } = await supabase
    .from("funds")
    .select("id, name")
    .order("name");

  const callRows = (capitalCalls ?? []).map((cc) => ({
    id: cc.id,
    fund_name: (cc as any).funds?.name ?? "—",
    investor_name: (cc as any).profiles?.full_name ?? "Unknown",
    call_amount: cc.call_amount,
    due_date: cc.due_date,
    paid_date: cc.paid_date,
    status: cc.status,
    commitment_amount:
      (cc as any).investor_commitments?.commitment_amount ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capital Calls"
        description="Create and manage capital calls across funds."
        action={<CapitalCallForm funds={funds ?? []} />}
      />

      <CapitalCallListTable data={callRows} />
    </div>
  );
}
