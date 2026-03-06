import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { DSCRTabsClient } from "./dscr-tabs-client";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DSCRModelPage() {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [lendersRes, productsRes, uploadsRes, runsRes] = await Promise.all([
    (admin as any)
      .from("dscr_lenders")
      .select("*")
      .order("name"),
    (admin as any)
      .from("dscr_lender_products")
      .select("*, dscr_lenders(name, short_name)")
      .order("product_name"),
    (admin as any)
      .from("dscr_rate_sheet_uploads")
      .select("*, dscr_lenders(name, short_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    (admin as any)
      .from("dscr_pricing_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const lenders = lendersRes.data ?? [];
  const products = productsRes.data ?? [];
  const uploads = uploadsRes.data ?? [];
  const runs = runsRes.data ?? [];

  return (
    <div className="space-y-0 p-6">
      <PageHeader
        title="DSCR Pricing Engine"
        description="Run deals through wholesale lender pricing grids, manage rate sheets, and find best execution"
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/models/dscr/sandbox">
                <FlaskConical size={14} className="mr-1.5" strokeWidth={1.5} />
                Open Sandbox
              </Link>
            </Button>
          </div>
        }
      />

      <DSCRTabsClient
        lenders={lenders}
        products={products}
        uploads={uploads}
        runs={runs}
      />
    </div>
  );
}
