import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatCurrencyDetailed, formatDate } from "@/lib/format";
import { NewDrawForm } from "@/components/borrower/new-draw-form";
import { getEffectiveAuth } from "@/lib/impersonation";

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

  const { data: drawRequests } = await supabase
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
    .eq("borrower_id", userId)
    .order("submitted_at", { ascending: false });

  const draws = (drawRequests ?? []) as unknown as DrawWithLoan[];

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
      cell: (row) => <span className="font-medium">#{row.draw_number}</span>,
    },
    {
      key: "amount_requested",
      header: "Amount Requested",
      cell: (row) => formatCurrencyDetailed(row.amount_requested),
    },
    {
      key: "amount_approved",
      header: "Amount Approved",
      cell: (row) =>
        row.amount_approved != null
          ? formatCurrencyDetailed(row.amount_approved)
          : "\u2014",
    },
    {
      key: "submitted_at",
      header: "Submitted",
      cell: (row) => formatDate(row.submitted_at),
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
