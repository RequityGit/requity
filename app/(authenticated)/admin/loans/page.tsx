import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { LoanListView } from "@/components/admin/loan-list-view";

export const dynamic = "force-dynamic";

export default async function AdminLoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch loans with borrower, originator, and processor names
  const [loansResult, teamResult, documentsResult] = await Promise.all([
    supabase
      .from("loans")
      .select(
        `*,
        borrower:profiles!loans_borrower_id_fkey(full_name),
        originator_profile:profiles!loans_originator_id_fkey(full_name),
        processor_profile:profiles!loans_processor_id_fkey(full_name)`
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    // Fetch admin team members for the filter dropdown
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
    // Fetch document counts per loan
    supabase
      .from("documents")
      .select("loan_id")
      .not("loan_id", "is", null),
  ]);

  const loans = loansResult.data ?? [];
  const teamMembers = (teamResult.data ?? []).map((t: { id: string; full_name: string | null }) => ({
    id: t.id,
    full_name: t.full_name ?? "Unknown",
  }));

  // Count documents per loan
  const docCounts: Record<string, number> = {};
  (documentsResult.data ?? []).forEach((d: { loan_id: string | null }) => {
    if (d.loan_id) {
      docCounts[d.loan_id] = (docCounts[d.loan_id] ?? 0) + 1;
    }
  });

  const loanRows = loans.map((l: any) => ({
    id: l.id,
    loan_number: l.loan_number,
    property_address: l.property_address,
    property_city: l.property_city,
    property_state: l.property_state,
    borrower_name: (l as any).borrower?.full_name ?? "—",
    borrower_id: l.borrower_id,
    loan_type: l.loan_type,
    loan_amount: l.loan_amount,
    stage: l.stage,
    stage_updated_at: l.stage_updated_at,
    created_at: l.created_at,
    priority: l.priority ?? "normal",
    next_action: l.next_action,
    originator_name:
      (l as any).originator_profile?.full_name ?? l.originator ?? null,
    processor_name: (l as any).processor_profile?.full_name ?? null,
    document_count: docCounts[l.id] ?? 0,
    total_conditions: 0, // Will be populated when conditions system is built
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Pipeline"
        description="Manage all loans from lead to funding."
        action={
          <Link href="/admin/loans">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Loan
            </Button>
          </Link>
        }
      />

      <LoanListView
        data={loanRows}
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  );
}
