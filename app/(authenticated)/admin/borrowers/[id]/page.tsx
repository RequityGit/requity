import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { LOAN_STAGE_LABELS } from "@/lib/constants";
import { Mail, Phone, Building2, Calendar } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function AdminBorrowerDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: borrower } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "borrower")
    .single();

  if (!borrower) notFound();

  // Fetch related data in parallel
  const [loansResult, drawRequestsResult, paymentsResult, documentsResult] =
    await Promise.all([
      supabase
        .from("loans")
        .select("*")
        .eq("borrower_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("draw_requests")
        .select("*, loans(property_address)")
        .eq("borrower_id", id)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("loan_payments")
        .select("*, loans(property_address)")
        .eq("borrower_id", id)
        .order("due_date", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("owner_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const loans = loansResult.data ?? [];
  const drawRequests = drawRequestsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const documents = documentsResult.data ?? [];

  const loanColumns: Column<any>[] = [
    {
      key: "loan_number",
      header: "Loan #",
      cell: (row) => (
        <Link
          href={`/admin/loans/${row.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.loan_number}
        </Link>
      ),
    },
    {
      key: "property_address",
      header: "Property",
      cell: (row) => row.property_address,
    },
    {
      key: "loan_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">{row.loan_type.replace(/_/g, " ")}</span>
      ),
    },
    {
      key: "loan_amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.loan_amount),
    },
    {
      key: "stage",
      header: "Stage",
      cell: (row) => (
        <StatusBadge
          status={row.stage}
        />
      ),
    },
    {
      key: "origination_date",
      header: "Originated",
      cell: (row) => formatDate(row.origination_date),
    },
  ];

  const drawRequestColumns: Column<any>[] = [
    {
      key: "loan",
      header: "Loan",
      cell: (row) => (row as any).loans?.loan_number ?? "—",
    },
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

  const paymentColumns: Column<any>[] = [
    {
      key: "loan",
      header: "Loan",
      cell: (row) => (row as any).loans?.loan_number ?? "—",
    },
    {
      key: "payment_number",
      header: "Payment #",
      cell: (row) => row.payment_number,
    },
    {
      key: "amount_due",
      header: "Amount Due",
      cell: (row) => formatCurrency(row.amount_due),
    },
    {
      key: "amount_paid",
      header: "Paid",
      cell: (row) => formatCurrency(row.amount_paid),
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
        title={borrower.full_name || "Borrower"}
        description="Borrower profile and loan activity"
      />

      {/* Borrower Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{borrower.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{borrower.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-sm font-medium">
                  {borrower.company_name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium">
                  {formatDate(borrower.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Data */}
      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans">Loans ({loans.length})</TabsTrigger>
          <TabsTrigger value="draw-requests">
            Draw Requests ({drawRequests.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-4">
          <DataTable
            columns={loanColumns}
            data={loans}
            emptyMessage="No loans found for this borrower."
          />
        </TabsContent>

        <TabsContent value="draw-requests" className="mt-4">
          <DataTable
            columns={drawRequestColumns}
            data={drawRequests}
            emptyMessage="No draw requests for this borrower."
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <DataTable
            columns={paymentColumns}
            data={payments}
            emptyMessage="No payments for this borrower."
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DataTable
            columns={documentColumns}
            data={documents}
            emptyMessage="No documents for this borrower."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
