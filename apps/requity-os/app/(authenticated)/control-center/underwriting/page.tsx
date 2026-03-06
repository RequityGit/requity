import { createClient } from "@/lib/supabase/server";
import { UnderwritingAssumptionsClient } from "@/components/control-center/underwriting-assumptions-client";

export default async function ControlCenterUnderwritingPage() {
  const supabase = createClient();

  const [{ data: assumptions }, { data: expenseDefaults }] = await Promise.all([
    supabase
      .from("commercial_uw_assumptions")
      .select("*")
      .order("property_type"),
    supabase
      .from("commercial_expense_defaults")
      .select("*")
      .order("property_type")
      .order("expense_category"),
  ]);

  return (
    <UnderwritingAssumptionsClient
      assumptions={assumptions ?? []}
      expenseDefaults={expenseDefaults ?? []}
    />
  );
}
