import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { EquityDealDetail } from "./equity-deal-detail";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquityDealDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch the deal with property info from the pipeline view
  const [dealResult, propertyResult, tasksResult, stageHistoryResult] =
    await Promise.all([
      admin
        .from("equity_deals")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single(),
      admin
        .from("equity_deals")
        .select("property_id")
        .eq("id", id)
        .single()
        .then(async (res) => {
          if (res.data?.property_id) {
            return admin
              .from("properties")
              .select("*")
              .eq("id", res.data.property_id)
              .single();
          }
          return { data: null, error: null };
        }),
      admin
        .from("equity_deal_tasks")
        .select("*")
        .eq("deal_id", id)
        .order("sort_order"),
      admin
        .from("equity_deal_stage_history")
        .select("*")
        .eq("deal_id", id)
        .order("changed_at", { ascending: false }),
    ]);

  if (dealResult.error || !dealResult.data) {
    notFound();
  }

  const deal = dealResult.data;
  const property = propertyResult?.data ?? null;
  const tasks = tasksResult.data ?? [];
  const stageHistory = stageHistoryResult.data ?? [];

  // Fetch assigned user profile
  let assignedToName: string | null = null;
  if (deal.assigned_to) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", deal.assigned_to)
      .single();
    assignedToName = profile?.full_name ?? null;
  }

  return (
    <EquityDealDetail
      deal={deal}
      property={property}
      tasks={tasks}
      stageHistory={stageHistory}
      assignedToName={assignedToName}
    />
  );
}
