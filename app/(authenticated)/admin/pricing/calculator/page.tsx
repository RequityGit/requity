import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PricingCalculator } from "@/components/admin/pricing-calculator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function PricingCalculatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch current programs and adjusters
  const [programsResult, adjustersResult] = await Promise.all([
    supabase
      .from("pricing_programs")
      .select("*")
      .eq("is_current", true)
      .order("program_id"),
    supabase
      .from("leverage_adjusters")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const programs = programsResult.data ?? [];
  const adjusters = adjustersResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deal Pricing Calculator"
        description="Run deal analysis without creating a loan record"
        action={
          <Link href="/admin/pricing">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Button>
          </Link>
        }
      />

      <PricingCalculator programs={programs} adjusters={adjusters} />
    </div>
  );
}
