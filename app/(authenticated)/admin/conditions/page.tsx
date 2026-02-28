import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ConditionsDashboard } from "@/components/admin/conditions-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminConditionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all conditions for active loans (non-terminal stages)
  const activeStages = [
    "lead",
    "application",
    "processing",
    "underwriting",
    "approved",
    "clear_to_close",
    "funded",
  ];

  const { data: conditions } = await supabase
    .from("loan_conditions")
    .select(
      `*,
      loan:loans!loan_conditions_loan_id_fkey(
        id, loan_number, property_address, stage, borrower_id, loan_amount,
        borrower:profiles!loans_borrower_id_fkey(full_name)
      )`
    )
    .in(
      "loan_id",
      (
        await supabase
          .from("loans")
          .select("id")
          .in("stage", activeStages)
          .is("deleted_at", null)
      ).data?.map((l: any) => l.id) ?? []
    )
    .order("due_date", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conditions Dashboard"
        description="Track outstanding conditions across all active loans"
      />
      <ConditionsDashboard
        conditions={conditions ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}
