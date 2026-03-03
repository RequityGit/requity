import { createClient } from "@/lib/supabase/server";
import { PayoffSettingsClient } from "@/components/control-center/payoff-settings-client";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function PayoffSettingsPage() {
  const supabase = await createClient();
  const db = supabase as any;

  // Fetch wire instructions and fee defaults in parallel
  const [wireResult, feesResult] = await Promise.all([
    db.from("company_wire_instructions").select("*").limit(1).single(),
    db.from("payoff_fee_defaults").select("*").order("sort_order"),
  ]);

  return (
    <PayoffSettingsClient
      initialWireInstructions={wireResult.data ?? null}
      initialFeeDefaults={feesResult.data ?? []}
    />
  );
}
