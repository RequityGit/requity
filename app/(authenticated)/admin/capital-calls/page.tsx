import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CapitalCallForm } from "@/components/admin/capital-call-form";
import { CapitalCallListTable } from "@/components/admin/capital-call-list-table";

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

export default async function AdminCapitalCallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: capitalCalls } = await supabase
    .from("capital_calls")
    .select(
      "*, funds(name), investors(crm_contacts(name, first_name, last_name)), investor_commitments(commitment_amount)"
    )
    .order("due_date", { ascending: false });

  const { data: funds } = await supabase
    .from("funds")
    .select("id, name")
    .order("name");

  const callRows = (capitalCalls ?? []).map((cc) => ({
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        description="Create and manage contributions across investments."
        action={<CapitalCallForm funds={funds ?? []} />}
      />

      <CapitalCallListTable data={callRows} />
    </div>
  );
}
