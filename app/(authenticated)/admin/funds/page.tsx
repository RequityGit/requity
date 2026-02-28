import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { FundListTable } from "@/components/admin/fund-list-table";

export default async function AdminFundsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: funds } = await supabase
    .from("funds")
    .select("*")
    .order("created_at", { ascending: false });

  const fundRows = (funds ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    fund_type: f.fund_type ?? "debt",
    target_size: f.target_size ?? 0,
    current_aum: f.current_aum,
    vintage_year: f.vintage_year ?? null,
    status: f.status,
    irr_target: f.irr_target ?? null,
    preferred_return: f.preferred_return ?? null,
    management_fee: f.management_fee ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funds"
        description="Manage all investment funds."
        action={
          <Link href="/admin/funds">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Fund
            </Button>
          </Link>
        }
      />

      <FundListTable data={fundRows} />
    </div>
  );
}
