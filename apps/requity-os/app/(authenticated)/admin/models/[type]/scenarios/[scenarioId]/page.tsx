import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { UWEditorClient } from "@/components/admin/underwriting/uw-editor-client";
import type { UWVersionData } from "@/components/admin/underwriting/uw-editor-client";
import type { UWModelType } from "@/lib/constants/uw-model-types";
import {
  saveScenarioVersion,
  cloneScenarioVersion,
  createScenarioVersion,
} from "../actions";
import { ScenarioHeader } from "./scenario-header";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["rtl", "dscr", "commercial"] as const;

export default async function ScenarioEditorPage({
  params,
}: {
  params: Promise<{ type: string; scenarioId: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { type, scenarioId } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    redirect("/admin/models");
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  // Fetch scenario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scenario } = await (admin as any)
    .from("model_scenarios")
    .select("*")
    .eq("id", scenarioId)
    .is("deleted_at", null)
    .single();

  if (!scenario) notFound();

  // Fetch all versions for this scenario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: uwRaw } = await (admin as any)
    .from("loan_underwriting_versions")
    .select("*")
    .eq("scenario_id", scenarioId)
    .order("version_number", { ascending: false });

  // Resolve author names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uwVersions = (uwRaw ?? []) as any[];
  const authorIds = Array.from(
    new Set(uwVersions.map((v) => v.created_by).filter(Boolean))
  );
  // Include scenario creator
  if (scenario.created_by && !authorIds.includes(scenario.created_by)) {
    authorIds.push(scenario.created_by);
  }

  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).forEach((p: any) => {
      authorMap[p.id] = p.full_name ?? "Unknown";
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versions: UWVersionData[] = uwVersions.map((v: any) => ({
    id: v.id,
    loan_id: v.loan_id ?? "",
    version_number: v.version_number,
    is_active: v.is_active ?? false,
    created_by: v.created_by,
    label: v.label ?? null,
    notes: v.notes ?? null,
    model_type: type as UWModelType,
    calculator_inputs: v.calculator_inputs ?? {},
    calculator_outputs: v.calculator_outputs ?? {},
    status: v.status ?? "draft",
    created_at: v.created_at,
    _author_name: v.created_by ? authorMap[v.created_by] ?? null : null,
  }));

  const activeVersionId = scenario.active_version_id ?? versions.find((v) => v.is_active)?.id ?? null;

  // Current user info
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const currentUserName = profile?.full_name ?? "Unknown";

  // Resolve linked deal info
  let linkedDealName: string | null = null;
  let linkedDealType: "opportunity" | "loan" | null = null;
  let linkedDealId: string | null = null;

  if (scenario.opportunity_id) {
    linkedDealType = "opportunity";
    linkedDealId = scenario.opportunity_id;
    const { data: opp } = await admin
      .from("opportunities")
      .select("deal_name")
      .eq("id", scenario.opportunity_id)
      .single();
    linkedDealName = opp?.deal_name || "Unnamed Deal";
  } else if (scenario.loan_id) {
    linkedDealType = "loan";
    linkedDealId = scenario.loan_id;
    const { data: loan } = await admin
      .from("loans")
      .select("loan_number, property_address")
      .eq("id", scenario.loan_id)
      .single();
    linkedDealName = loan?.property_address || loan?.loan_number || "Unnamed Loan";
  }

  // Fetch available deals for linking
  const { data: availableOpps } = await admin
    .from("opportunities")
    .select("id, deal_name, loan_type, stage")
    .not("stage", "in", '("closed_lost")')
    .order("created_at", { ascending: false })
    .limit(50);

  // Bind the create action with the scenarioId
  async function createVersionAction(
    _loanId: string,
    userId: string,
    modelType: string,
    isOpportunity: boolean
  ) {
    "use server";
    return createScenarioVersion(scenarioId, userId, modelType, isOpportunity);
  }

  return (
    <div>
      <ScenarioHeader
        scenario={{
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
          model_type: scenario.model_type,
          status: scenario.status,
          created_by: scenario.created_by,
          created_at: scenario.created_at,
        }}
        modelType={type}
        linkedDealName={linkedDealName}
        linkedDealType={linkedDealType}
        linkedDealId={linkedDealId}
        availableDeals={(availableOpps ?? []).map((o: { id: string; deal_name: string | null; loan_type: string | null; stage: string }) => ({
          id: o.id,
          name: o.deal_name || "Unnamed",
          loanType: o.loan_type,
          stage: o.stage,
          type: "opportunity" as const,
        }))}
        authorName={authorMap[scenario.created_by] || "Unknown"}
      />

      <UWEditorClient
        dealId={scenarioId}
        dealName={scenario.name}
        modelType={type as UWModelType}
        versions={versions}
        activeVersionId={activeVersionId}
        currentUserId={user.id}
        currentUserName={currentUserName}
        saveVersionAction={saveScenarioVersion}
        cloneVersionAction={cloneScenarioVersion}
        createVersionAction={createVersionAction}
        isOpportunity={false}
        isSandbox={false}
        linkedDealId={linkedDealId}
        linkedDealType={linkedDealType}
      />
    </div>
  );
}
