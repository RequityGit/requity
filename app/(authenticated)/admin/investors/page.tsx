import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { InvestorListTable } from "@/components/admin/investor-list-table";

export default async function AdminInvestorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all investors from the dedicated investors table
  const { data: investors } = await admin
    .from("investors")
    .select("*")
    .order("last_name");

  // Fetch all commitments grouped by investor
  const { data: commitments } = await admin
    .from("investor_commitments")
    .select("investor_id, commitment_amount, funded_amount, fund_id");

  // Aggregate commitments per investor
  const commitmentsByInvestor = new Map<
    string,
    { totalCommitted: number; totalFunded: number; fundCount: number }
  >();

  commitments?.forEach((c) => {
    const existing = commitmentsByInvestor.get(c.investor_id) || {
      totalCommitted: 0,
      totalFunded: 0,
      fundCount: 0,
    };
    existing.totalCommitted += c.commitment_amount || 0;
    existing.totalFunded += c.funded_amount || 0;
    existing.fundCount += 1;
    commitmentsByInvestor.set(c.investor_id, existing);
  });

  const investorRows = (investors ?? []).map((inv) => {
    const agg = commitmentsByInvestor.get(inv.id) || {
      totalCommitted: 0,
      totalFunded: 0,
      fundCount: 0,
    };
    return {
      id: inv.id,
      first_name: inv.first_name,
      last_name: inv.last_name,
      email: inv.email,
      phone: inv.phone || "—",
      accreditation_status: inv.accreditation_status,
      totalCommitted: agg.totalCommitted,
      totalFunded: agg.totalFunded,
      fundCount: agg.fundCount,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investors"
        description="Manage all investor profiles and their fund commitments."
        action={
          <Link href="/admin/investors/new">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Investor
            </Button>
          </Link>
        }
      />

      <InvestorListTable data={investorRows} />
    </div>
  );
}
