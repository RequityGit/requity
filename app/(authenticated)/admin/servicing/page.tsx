import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ServicingTabs } from "@/components/admin/servicing/servicing-tabs";
import { AddServicingLoanDialog } from "@/components/admin/servicing/add-servicing-loan-dialog";
import { formatCurrency } from "@/lib/format";
import {
  Banknote,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  DollarSign,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AdminServicingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Cast to any — servicing tables/views are not in generated types yet
  const db = supabase as any;

  // Check if current user is super_admin
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .limit(1)
    .single();

  const isSuperAdmin = !!superAdminRole;

  // Fetch all servicing data in parallel
  const [portfolioResult, loansResult, maturityResult, drawsResult, paymentsResult] =
    await Promise.all([
      db.from("servicing_portfolio_summary").select("*").single(),
      db
        .from("servicing_loans")
        .select("*")
        .order("loan_id"),
      db.from("servicing_maturity_schedule").select("*"),
      db
        .from("servicing_draws")
        .select("*")
        .order("draw_number"),
      db
        .from("servicing_payments")
        .select("*")
        .order("date", { ascending: false }),
    ]);

  const portfolio = portfolioResult.data;
  const loans = loansResult.data ?? [];
  const maturities = maturityResult.data ?? [];
  const draws = drawsResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const maturityAlerts = maturities.filter(
    (m: any) =>
      m.maturity_status === "MATURED" || m.maturity_status === "MATURING_30"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Servicing"
        description="Portfolio management, interest billing, draws, and payment tracking."
        action={
          <div className="flex items-center gap-2">
            <AddServicingLoanDialog isSuperAdmin={isSuperAdmin} />
            <Link href="/admin/servicing/billing">
              <Button variant="outline" className="gap-2">
                <Receipt className="h-4 w-4" />
                Billing & Collections
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Active Loans"
          value={portfolio?.total_active_loans?.toString() ?? "0"}
          description={`${formatCurrency(portfolio?.total_outstanding_balance)} outstanding`}
          icon={<Banknote className="h-5 w-5" />}
        />
        <KpiCard
          title="Avg Loan Size"
          value={formatCurrency(portfolio?.average_loan_size)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          title="RTL Active"
          value={portfolio?.rtl_active_count?.toString() ?? "0"}
          description={formatCurrency(portfolio?.rtl_outstanding_balance)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Commercial Active"
          value={portfolio?.commercial_active_count?.toString() ?? "0"}
          description={formatCurrency(portfolio?.commercial_outstanding_balance)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Maturity Alerts"
          value={maturityAlerts.toString()}
          description="Matured or within 30 days"
          icon={
            maturityAlerts > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <CalendarClock className="h-5 w-5" />
            )
          }
        />
      </div>

      {/* Tabbed Content */}
      <ServicingTabs
        loans={loans}
        draws={draws}
        payments={payments}
        maturities={maturities}
        portfolio={portfolio}
      />
    </div>
  );
}
