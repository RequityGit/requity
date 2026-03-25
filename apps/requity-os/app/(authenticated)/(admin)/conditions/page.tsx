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

  // Fetch active loans first
  const activeStages = [
    "lead",
    "application",
    "processing",
    "underwriting",
    "approved",
    "clear_to_close",
    "funded",
  ] as const;

  const { data: activeLoans } = await supabase
    .from("loans")
    .select("id, loan_number, property_address, stage, borrower_id, loan_amount")
    .in("stage", activeStages)
    .is("deleted_at", null);

  const loanIds = (activeLoans ?? []).map((l: any) => l.id);

  // Fetch conditions for active loans
  let conditions: any[] = [];
  if (loanIds.length > 0) {
    try {
      const { data } = await supabase
        .from("loan_conditions")
        .select("*")
        .in("loan_id", loanIds)
        .order("due_date", { ascending: true });
      conditions = data ?? [];
    } catch {
      // table may not exist
    }
  }

  // Fetch borrower names for the loans (borrower_id now references borrowers table)
  const borrowerIds = Array.from(new Set((activeLoans ?? []).map((l: any) => l.borrower_id).filter(Boolean)));
  let borrowerNames: Record<string, string> = {};
  if (borrowerIds.length > 0) {
    const { data: borrowerRows } = await supabase
      .from("borrowers")
      .select("id, first_name, last_name")
      .in("id", borrowerIds);
    (borrowerRows ?? []).forEach((b: any) => {
      borrowerNames[b.id] = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "Unknown";
    });
  }

  // Build loan lookup and attach to conditions
  const loanLookup: Record<string, any> = {};
  (activeLoans ?? []).forEach((l: any) => {
    loanLookup[l.id] = {
      ...l,
      borrower: { full_name: borrowerNames[l.borrower_id] ?? "Unknown" },
    };
  });

  const conditionsWithLoan = conditions.map((c: any) => ({
    ...c,
    loan: loanLookup[c.loan_id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conditions Dashboard"
        description="Track outstanding conditions across all active loans"
      />
      <ConditionsDashboard
        conditions={conditionsWithLoan}
        currentUserId={user.id}
      />
    </div>
  );
}
