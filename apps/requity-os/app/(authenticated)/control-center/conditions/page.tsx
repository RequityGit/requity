import { createClient } from "@/lib/supabase/server";
import { ConditionsClient } from "@/components/control-center/conditions-client";

export default async function ControlCenterConditionsPage() {
  const supabase = createClient();

  const { data: templates } = await supabase
    .from("loan_condition_templates")
    .select("*")
    .order("category")
    .order("sort_order");

  return <ConditionsClient templates={templates ?? []} />;
}
