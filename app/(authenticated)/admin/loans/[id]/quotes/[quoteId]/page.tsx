import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { QuoteDetailClient } from "@/components/admin/quote-detail-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { id: string; quoteId: string };
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id: loanId, quoteId } = await params;

  // Fetch quote, loan, activities, and companies in parallel
  const [quoteResult, loanResult, activitiesResult, companiesResult] =
    await Promise.all([
      supabase
        .from("lender_quotes")
        .select("*")
        .eq("id", quoteId)
        .single(),
      supabase
        .from("loans")
        .select(
          "id, loan_number, property_address, borrower:borrowers!loans_borrower_id_fkey(first_name, last_name)"
        )
        .eq("id", loanId)
        .single(),
      supabase
        .from("lender_quote_activities")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id, name")
        .order("name"),
    ]);

  const quote = quoteResult.data;
  if (!quote) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loan = loanResult.data as any;
  const activities = activitiesResult.data ?? [];
  const companies = (companiesResult.data ?? []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

  // Get company name for the quote's lender
  const lenderCompanyName = quote.lender_company_id
    ? companies.find((c: { id: string; name: string }) => c.id === quote.lender_company_id)?.name ?? "Unknown"
    : null;

  const borrowerName = loan?.borrower
    ? `${loan.borrower.first_name ?? ""} ${loan.borrower.last_name ?? ""}`.trim() || "—"
    : "—";

  // Requity fee income calculation
  const requityFeeIncome =
    quote.loan_amount != null && quote.requity_lending_fee != null
      ? quote.loan_amount * (quote.requity_lending_fee / 100)
      : null;

  // Fetch profile names for activity creators
  const creatorIds = Array.from(
    new Set(activities.map((a: { created_by: string | null }) => a.created_by).filter(Boolean))
  );
  let creatorNames: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", creatorIds as string[]);
    (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => {
      creatorNames[p.id] = p.full_name ?? "Unknown";
    });
  }

  const activitiesWithNames = activities.map((a: {
    id: string;
    created_at: string;
    quote_id: string;
    activity_type: string;
    description: string;
    old_status: string | null;
    new_status: string | null;
    created_by: string | null;
  }) => ({
    ...a,
    creator_name: a.created_by ? creatorNames[a.created_by] ?? "System" : "System",
  }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href={`/admin/loans/${loanId}?tab=quotes`}>
        <Button variant="ghost" size="sm" className="gap-1 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to {loan?.loan_number ?? "Loan"} Quotes
        </Button>
      </Link>

      <PageHeader
        title={quote.quote_name}
        description={
          lenderCompanyName
            ? `Lender: ${lenderCompanyName} | Loan: ${loan?.loan_number ?? "—"}`
            : `Loan: ${loan?.loan_number ?? "—"}`
        }
      />

      <QuoteDetailClient
        quote={quote}
        loanId={loanId}
        loanNumber={loan?.loan_number}
        borrowerName={borrowerName}
        lenderCompanyName={lenderCompanyName}
        companies={companies}
        activities={activitiesWithNames}
        requityFeeIncome={requityFeeIncome}
        currentUserId={user.id}
      />
    </div>
  );
}
