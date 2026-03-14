import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LendingPipelineTable } from "@/components/admin/pipeline/lending-pipeline-table";
import { CreateLoanDialog } from "@/components/admin/create-loan-dialog";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export const dynamic = "force-dynamic";

export default async function AdminLoansPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Core data: loans, team, borrowers, documents
  const [loansResult, teamResult, borrowersResult, documentsResult] =
    await Promise.all([
      supabase
        .from("loans")
        .select(`*`)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "admin")
        .order("full_name"),
      (admin as any)
        .from("borrowers")
        .select("id, first_name, last_name, email")
        .order("last_name"),
      supabase
        .from("documents")
        .select("loan_id")
        .not("loan_id", "is", null),
    ]);

  if (borrowersResult.error) {
    console.error("Failed to fetch borrowers:", borrowersResult.error);
  }

  // Condition counts
  let conditionsResult: { data: any[] | null } = { data: [] };
  try {
    conditionsResult = await supabase
      .from("loan_conditions")
      .select("loan_id, status");
  } catch {
    // table may not exist yet
  }

  // Build profiles lookup
  const allProfiles: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null }) => {
      allProfiles[t.id] = t.full_name ?? "Unknown";
    }
  );

  const loans = loansResult.data ?? [];
  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name ?? "Unknown",
    })
  );
  const borrowers: {
    id: string;
    full_name: string;
    email: string;
    company_name: string | null;
  }[] = (borrowersResult.data ?? []).map((b: any) => ({
    id: b.id,
    full_name:
      `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || "Unknown",
    email: b.email ?? "",
    company_name: null as string | null,
  }));

  // Count documents per loan
  const docCounts: Record<string, number> = {};
  (documentsResult.data ?? []).forEach((d: { loan_id: string | null }) => {
    if (d.loan_id) {
      docCounts[d.loan_id] = (docCounts[d.loan_id] ?? 0) + 1;
    }
  });

  // Count conditions per loan
  const conditionTotals: Record<string, number> = {};
  (conditionsResult.data ?? []).forEach(
    (c: { loan_id: string; status: string }) => {
      conditionTotals[c.loan_id] = (conditionTotals[c.loan_id] ?? 0) + 1;
    }
  );

  // Build borrower lookup
  const borrowerLookup: Record<string, string> = {};
  borrowers.forEach((b) => {
    borrowerLookup[b.id] = b.full_name;
  });

  const loanRows = loans.map((l: any) => ({
    id: l.id,
    loan_number: l.loan_number,
    property_address: l.property_address,
    property_city: l.property_city,
    property_state: l.property_state,
    borrower_name: borrowerLookup[l.borrower_id] ?? "--",
    borrower_id: l.borrower_id,
    loan_type: l.type,
    loan_amount: l.loan_amount,
    stage: l.stage,
    stage_updated_at: l.stage_updated_at,
    created_at: l.created_at,
    next_action: l.next_action,
    originator_name:
      (l.originator_id && allProfiles[l.originator_id]) ??
      l.originator ??
      null,
    processor_name:
      (l.processor_id && allProfiles[l.processor_id]) ?? null,
    document_count: docCounts[l.id] ?? 0,
    total_conditions: conditionTotals[l.id] ?? 0,
    interest_rate: l.interest_rate,
    loan_term_months: l.loan_term_months,
    ltv: l.ltv,
    appraised_value: l.appraised_value,
    property_type: l.property_type,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Pipeline"
        description="Manage all loans from lead to funding."
        action={
          <CreateLoanDialog
            teamMembers={teamMembers}
            borrowers={borrowers}
            currentUserId={user.id}
            initialOpen={resolvedSearchParams.new_loan === "true"}
            initialBorrowerId={resolvedSearchParams.borrower_id}
          />
        }
      />

      <LendingPipelineTable data={loanRows} teamMembers={teamMembers} />
    </div>
  );
}
