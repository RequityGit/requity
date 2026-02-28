import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { BorrowerEntityList } from "@/components/admin/borrower-entity-list";
import { BorrowerEditDialog } from "@/components/admin/borrower-edit-dialog";

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
  const admin = createAdminClient();

  const { data: borrower } = await admin
    .from("borrowers")
    .select("*")
    .eq("id", id)
    .single();

  if (!borrower) notFound();

  // Fetch related data in parallel
  const [entitiesResult, loansResult] = await Promise.all([
    admin
      .from("borrower_entities")
      .select("*")
      .eq("borrower_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("loans")
      .select("*")
      .eq("borrower_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const entities = entitiesResult.data ?? [];
  const loans = loansResult.data ?? [];

  const loanColumns: Column<any>[] = [
    {
      key: "loan_number",
      header: "Loan #",
      cell: (row) => (
        <Link
          href={`/admin/loans/${row.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.loan_number || "—"}
        </Link>
      ),
    },
    {
      key: "property_address",
      header: "Property",
      cell: (row) =>
        row.property_address
          ? `${row.property_address}, ${row.property_city || ""} ${row.property_state || ""}`
          : "—",
    },
    {
      key: "loan_type",
      header: "Type",
      cell: (row) =>
        row.loan_type ? (
          <span className="capitalize">{row.loan_type.replace(/_/g, " ")}</span>
        ) : (
          "—"
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
      cell: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: "origination_date",
      header: "Originated",
      cell: (row) => formatDate(row.origination_date),
    },
  ];

  const fullName = `${borrower.first_name} ${borrower.last_name}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description="Borrower profile, entities, and loan activity"
        action={<BorrowerEditDialog borrower={borrower} />}
      />

      {/* Borrower Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">
                  {borrower.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">
                  {borrower.phone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">
                  {borrower.city && borrower.state
                    ? `${borrower.city}, ${borrower.state}`
                    : borrower.state || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="text-sm font-medium">
                  {formatDate(borrower.date_of_birth)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Credit Score</p>
                <p className="text-sm font-medium">
                  {borrower.credit_score ? (
                    <span
                      className={`${
                        borrower.credit_score >= 740
                          ? "text-green-600"
                          : borrower.credit_score >= 680
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {borrower.credit_score}
                    </span>
                  ) : (
                    "—"
                  )}
                  {borrower.credit_report_date && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatDate(borrower.credit_report_date)})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="text-sm font-medium">
                  {borrower.experience_count}{" "}
                  {borrower.experience_count === 1 ? "deal" : "deals"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">US Citizen</p>
                <p className="text-sm font-medium">
                  {borrower.is_us_citizen ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Added</p>
                <p className="text-sm font-medium">
                  {formatDate(borrower.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          {borrower.address_line1 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="text-sm">
                {borrower.address_line1}
                {borrower.address_line2 && `, ${borrower.address_line2}`}
                {borrower.city && `, ${borrower.city}`}
                {borrower.state && `, ${borrower.state}`}{" "}
                {borrower.zip && borrower.zip}
              </p>
            </div>
          )}

          {/* Notes */}
          {borrower.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{borrower.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Data */}
      <Tabs defaultValue="entities">
        <TabsList>
          <TabsTrigger value="entities">
            Entities ({entities.length})
          </TabsTrigger>
          <TabsTrigger value="loans">Loans ({loans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="mt-4">
          <BorrowerEntityList
            borrowerId={borrower.id}
            entities={entities}
          />
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <DataTable
            columns={loanColumns}
            data={loans}
            emptyMessage="No loans found for this borrower."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
