import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoanStageTracker } from "@/components/shared/loan-stage-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { LOAN_STAGE_LABELS } from "@/lib/constants";
import { LoanDetailActions } from "@/components/admin/loan-detail-actions";

interface PageProps {
  params: { id: string };
}

export default async function AdminLoanDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: loan } = await supabase
    .from("loans")
    .select("*, profiles!loans_borrower_id_fkey(full_name, email)")
    .eq("id", id)
    .single();

  if (!loan) notFound();

  // Fetch all related data in parallel
  const [drawRequestsResult, paymentsResult, documentsResult] =
    await Promise.all([
      supabase
        .from("draw_requests")
        .select("*")
        .eq("loan_id", id)
        .order("draw_number", { ascending: false }),
      supabase
        .from("loan_payments")
        .select("*")
        .eq("loan_id", id)
        .order("due_date", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("loan_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const drawRequests = drawRequestsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const documents = documentsResult.data ?? [];

  const borrowerName = (loan as any).profiles?.full_name ?? "—";

  const drawRequestColumns: Column<any>[] = [
    {
      key: "draw_number",
      header: "Draw #",
      cell: (row) => row.draw_number,
    },
    {
      key: "amount_requested",
      header: "Requested",
      cell: (row) => formatCurrency(row.amount_requested),
    },
    {
      key: "amount_approved",
      header: "Approved",
      cell: (row) => formatCurrency(row.amount_approved),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => row.description || "—",
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
    {
      key: "actions",
      header: "",
      cell: () => null, // Actions handled by client component
    },
  ];

  const paymentColumns: Column<any>[] = [
    {
      key: "payment_number",
      header: "Payment #",
      cell: (row) => row.payment_number,
    },
    {
      key: "amount_due",
      header: "Due",
      cell: (row) => formatCurrency(row.amount_due),
    },
    {
      key: "amount_paid",
      header: "Paid",
      cell: (row) => formatCurrency(row.amount_paid),
    },
    {
      key: "principal_amount",
      header: "Principal",
      cell: (row) => formatCurrency(row.principal_amount),
    },
    {
      key: "interest_amount",
      header: "Interest",
      cell: (row) => formatCurrency(row.interest_amount),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => formatDate(row.due_date),
    },
    {
      key: "paid_date",
      header: "Paid Date",
      cell: (row) => formatDate(row.paid_date),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const documentColumns: Column<any>[] = [
    {
      key: "file_name",
      header: "File Name",
      cell: (row) => (
        <span className="font-medium">{row.description || row.file_name}</span>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {row.document_type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Loan ${loan.loan_number}`}
        description={`${loan.property_address} - ${borrowerName}`}
      />

      {/* Stage Tracker */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <LoanStageTracker currentStage={loan.stage} />
        </CardContent>
      </Card>

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
            <DetailField label="Loan Number" value={loan.loan_number ?? "—"} />
            <DetailField label="Borrower" value={borrowerName} />
            <DetailField
              label="Type"
              value={(loan.loan_type ?? "").replace(/_/g, " ") || "—"}
            />
            <DetailField
              label="Stage"
              value={
                LOAN_STAGE_LABELS[
                  loan.stage as keyof typeof LOAN_STAGE_LABELS
                ] || loan.stage
              }
            />
            <DetailField
              label="Loan Amount"
              value={formatCurrency(loan.loan_amount)}
            />
            <DetailField
              label="Interest Rate"
              value={formatPercent(loan.interest_rate)}
            />
            <DetailField label="Term" value={`${loan.term_months} months`} />
            <DetailField label="LTV" value={formatPercent(loan.ltv)} />
            <DetailField
              label="Appraised Value"
              value={formatCurrency(loan.appraised_value)}
            />
            <DetailField
              label="Origination Date"
              value={formatDate(loan.origination_date)}
            />
            <DetailField
              label="Maturity Date"
              value={formatDate(loan.maturity_date)}
            />
          </div>
          {loan.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{loan.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions + Tabbed Data */}
      <LoanDetailActions
        loan={{
          id: loan.id,
          loan_number: loan.loan_number,
          borrower_id: loan.borrower_id,
          borrower_name: borrowerName,
          loan_type: loan.loan_type,
          property_address: loan.property_address,
          property_city: loan.property_city,
          property_state: loan.property_state,
          property_zip: loan.property_zip,
          loan_amount: loan.loan_amount,
          interest_rate: loan.interest_rate,
          term_months: loan.term_months,
          origination_date: loan.origination_date,
          maturity_date: loan.maturity_date,
          stage: loan.stage,
          ltv: loan.ltv,
          appraised_value: loan.appraised_value,
          notes: loan.notes,
        }}
        drawRequests={drawRequests}
        payments={payments}
        documents={documents}
      />
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
