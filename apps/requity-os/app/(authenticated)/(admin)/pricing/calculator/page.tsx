import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PricingCalculator } from "@/components/admin/pricing-calculator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function PricingCalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch current programs and adjusters — tables may not exist yet
  let programs: any[] = [];
  let adjusters: any[] = [];

  try {
    const { data } = await (supabase as any)
      .from("pricing_programs")
      .select("*")
      .eq("is_current", true)
      .order("program_id");
    programs = data ?? [];
  } catch { /* table may not exist */ }

  try {
    const { data } = await (supabase as any)
      .from("leverage_adjusters")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    adjusters = data ?? [];
  } catch { /* table may not exist */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deal Pricing Calculator"
        description="Run deal analysis without creating a loan record"
        action={
          <Link href="/originations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Originations
            </Button>
          </Link>
        }
      />

      <PricingCalculator programs={programs} adjusters={adjusters} />
    </div>
  );
}
