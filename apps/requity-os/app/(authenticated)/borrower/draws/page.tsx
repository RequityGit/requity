import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatCurrencyDetailed, formatDate } from "@/lib/format";
import { NewDrawForm } from "@/components/borrower/new-draw-form";
import { getEffectiveAuth, getBorrowerId } from "@/lib/impersonation";

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
  const { supabase, userId, isImpersonating } = await getEffectiveAuth();

  // Resolve auth user to borrowers.id
  const borrowerId = await getBorrowerId(supabase, userId);

  let draws: DrawWithLoan[] = [];

  if (borrowerId) {
    const { data: drawRequests, error } = await supabase
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
