import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SavedPricingResults } from "@/components/admin/dscr/saved-pricing-results";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function PricingResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { run: runId } = await searchParams;
  if (!runId) {
    redirect("/admin/models/dscr?tab=pipeline");
  }

  const admin = createAdminClient();
  const { data: run } = await (admin as any)
    .from("dscr_pricing_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (!run) {
    redirect("/admin/models/dscr?tab=pipeline");
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Pricing Results"
        description={`${run.borrower_name || "Deal"} — ${run.property_state} — ${run.loan_purpose}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/admin/models/dscr?tab=pipeline">
              <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Back to Pipeline
            </Link>
          </Button>
        }
      />
      <SavedPricingResults run={run} />
    </div>
  );
}
