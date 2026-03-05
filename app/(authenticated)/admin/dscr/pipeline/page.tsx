import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/kpi-card";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DSCRPipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let runs: any[] = [];
  try {
    const { data } = await (supabase as any)
      .from("dscr_pricing_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    runs = data ?? [];
  } catch { /* table may not exist */ }

  const quoted = runs.filter((r: any) => r.status === "quoted");
  const totalVolume = runs.reduce((sum: number, r: any) => sum + (r.loan_amount || 0), 0);
  const avgLtv =
    runs.length > 0
      ? runs.reduce((sum: number, r: any) => sum + (r.ltv || 0), 0) / runs.length
      : 0;

  const statusColors: Record<string, string> = {
    draft: "secondary",
    quoted: "default",
    submitted: "outline",
    locked: "default",
    closed: "default",
    dead: "destructive",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSCR Pipeline"
        description="View and manage all priced DSCR deals"
        action={
          <div className="flex gap-2">
            <Link href="/admin/dscr">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to DSCR
              </Button>
            </Link>
            <Link href="/admin/dscr/price">
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                Price a Deal
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Deals" value={runs.length} />
        <KpiCard title="Quoted" value={quoted.length} />
        <KpiCard title="Pipeline Volume" value={formatCurrency(totalVolume)} />
        <KpiCard title="Avg LTV" value={`${avgLtv.toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pricing Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No deals priced yet.</p>
              <Link href="/admin/dscr/price">
                <Button className="mt-4">
                  <Calculator className="h-4 w-4 mr-2" />
                  Price Your First Deal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Borrower</th>
                    <th className="text-left p-3 font-medium">State</th>
                    <th className="text-left p-3 font-medium">Purpose</th>
                    <th className="text-right p-3 font-medium">Loan Amt</th>
                    <th className="text-right p-3 font-medium">LTV</th>
                    <th className="text-right p-3 font-medium">FICO</th>
                    <th className="text-left p-3 font-medium">Best Rate</th>
                    <th className="text-left p-3 font-medium">Best Lender</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r: any) => (
                    <tr
                      key={r.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="p-3 font-medium">
                        {r.borrower_name || "Unnamed"}
                      </td>
                      <td className="p-3">{r.property_state}</td>
                      <td className="p-3 capitalize">
                        {r.loan_purpose?.replace(/_/g, " ")}
                      </td>
                      <td className="p-3 text-right num">
                        {formatCurrency(r.loan_amount)}
                      </td>
                      <td className="p-3 text-right num">
                        {r.ltv ? `${r.ltv.toFixed(1)}%` : "—"}
                      </td>
                      <td className="p-3 text-right num">{r.fico_score}</td>
                      <td className="p-3 num">
                        {r.best_execution_rate
                          ? `${r.best_execution_rate}%`
                          : "—"}
                      </td>
                      <td className="p-3">
                        {r.best_execution_lender || "—"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            (statusColors[r.status] as any) || "secondary"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
