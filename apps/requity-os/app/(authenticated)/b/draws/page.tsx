import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatCurrencyDetailed, formatDate } from "@/lib/format";
import { NewDrawForm } from "@/components/borrower/new-draw-form";
import { getEffectiveAuth, getBorrowerId } from "@/lib/impersonation";
import { PenTool } from "lucide-react";

interface DrawWithLoan {
  id: string;
  loan_id: string;
  borrower_id: string;
  draw_number: number;
  amount_requested: number;
  amount_approved: number | null;
  description: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  loans: {
    property_address: string;
    loan_number: string;
  } | null;
}

export default async function BorrowerDrawsPage() {
  let draws: DrawWithLoan[] = [];
  let hasLoans = false;
  let isImpersonating = false;

  try {
    const auth = await getEffectiveAuth();
    isImpersonating = auth.isImpersonating;

    const borrowerId = await getBorrowerId(auth.supabase, auth.userId);

    if (borrowerId) {
      // Check if borrower has any active loans before querying draws
      const { count: loanCount } = await auth.supabase
        .from("loans")
        .select("id", { count: "exact", head: true })
        .eq("borrower_id", borrowerId)
        .is("deleted_at", null);

      hasLoans = (loanCount ?? 0) > 0;

      if (hasLoans) {
        const { data: drawRequests, error } = await auth.supabase
          .from("draw_requests")
          .select(
            `
            *,
            loans (
              property_address,
              loan_number
            )
          `
          )
          .eq("borrower_id", borrowerId)
          .order("submitted_at", { ascending: false });

        if (error) {
          console.error("Failed to fetch draw requests:", error.message);
        } else {
          draws = (drawRequests ?? []) as unknown as DrawWithLoan[];
        }
      }
    }
  } catch (err) {
    console.error("Draws page failed to load data:", err);
  }

  if (!hasLoans) {
    return (
      <div>
        <PageHeader
          title="Draw Requests"
          description="Submit and track draw requests for your loans"
        />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-[#F7F7F8] p-4 mb-4">
            <PenTool className="h-8 w-8 text-[#1A1A1A]/40" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            No Draw Requests
          </h2>
          <p className="text-sm text-[#1A1A1A]/60 text-center max-w-md">
            You don&apos;t have any active loans with construction budgets.
            Draw requests will appear here once your loan is funded.
          </p>
        </div>
      </div>
    );
  }

  const columns: Column<DrawWithLoan>[] = [
    {
      key: "loan",
      header: "Loan",
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">
            {row.loans?.property_address ?? "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.loans?.loan_number ?? ""}
          </p>
        </div>
      ),
    },
    {
      key: "draw_number",
      header: "Draw #",
      cell: (row) => <span className="num font-medium">#{row.draw_number}</span>,
    },
    {
      key: "amount_requested",
      header: "Amount Requested",
      cell: (row) => <span className="num">{formatCurrencyDetailed(row.amount_requested)}</span>,
    },
    {
      key: "amount_approved",
      header: "Amount Approved",
      cell: (row) =>
        row.amount_approved != null
          ? <span className="num">{formatCurrencyDetailed(row.amount_approved)}</span>
          : "\u2014",
    },
    {
      key: "submitted_at",
      header: "Submitted",
      cell: (row) => <span className="num">{formatDate(row.submitted_at)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Draw Requests"
        description="Submit and track draw requests for your loans"
        action={!isImpersonating ? <NewDrawForm /> : undefined}
      />

      <DataTable
        columns={columns}
        data={draws}
        emptyMessage="No draw requests found. Submit your first draw request using the button above."
      />
    </div>
  );
}
