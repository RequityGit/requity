import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ServicingTabs } from "@/components/admin/servicing/servicing-tabs";
import { AddServicingLoanDialog } from "@/components/admin/servicing/add-servicing-loan-dialog";
import {
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
