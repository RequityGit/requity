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

  // Fetch all data in parallel
  const [
    dealResult,
    propertyResult,
    tasksResult,
    stageHistoryResult,
    equityUwResult,
    commercialUwResult,
    profilesResult,
  ] = await Promise.all([
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
      .select(
        "*, assigned_to_profile:profiles!equity_deal_tasks_assigned_to_fkey(id, full_name, avatar_url)"
      )
      .eq("deal_id", id)
      .order("sort_order"),
    admin
      .from("equity_deal_stage_history")
      .select("*")
      .eq("deal_id", id)
      .order("changed_at", { ascending: false }),
    admin
      .from("equity_underwriting")
      .select("*")
      .eq("deal_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // commercial_underwriting is linked via loan_id — for equity deals, the deal_id is used as loan_id
    (admin as any)
      .from("commercial_underwriting")
      .select("*")
      .eq("loan_id", id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .not("full_name", "is", null)
      .order("full_name"),
  ]);

  if (dealResult.error || !dealResult.data) {
    notFound();
  }

  const deal = dealResult.data;
  const property = propertyResult?.data ?? null;
  const tasks = tasksResult.data ?? [];
  const stageHistory = stageHistoryResult.data ?? [];
  const equityUw = equityUwResult?.data ?? null;
  const commercialUw = commercialUwResult?.data ?? null;
  const profiles = (profilesResult.data ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name ?? "",
    avatar_url: p.avatar_url ?? null,
  }));

  // Fetch pipeline view data for computed fields (days_in_stage, completed_tasks, etc.)
  const { data: pipelineData } = await (admin as any)
    .from("equity_pipeline")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // Fetch assigned user profile
  let assignedToProfile: { full_name: string | null; id: string } | null = null;
  if (deal.assigned_to) {
    const match = profiles.find((p: any) => p.id === deal.assigned_to);
    if (match) {
      assignedToProfile = { id: match.id, full_name: match.full_name };
    }
  }

  return (
    <EquityDealDetail
      deal={deal}
      property={property}
      tasks={tasks}
      stageHistory={stageHistory}
      equityUw={equityUw}
      commercialUw={commercialUw}
      pipelineData={pipelineData}
      assignedToProfile={assignedToProfile}
      adminProfiles={profiles}
      currentUserId={user.id}
    />
  );
}
