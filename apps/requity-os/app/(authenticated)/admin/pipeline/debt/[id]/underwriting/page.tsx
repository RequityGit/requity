import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { UWEditorClient } from "@/components/admin/underwriting/uw-editor-client";
import { getUWModelForLoanType } from "../components";
import { saveUWVersion, cloneUWVersion, createNewUWVersion } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function UnderwritingEditorPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id: dealId } = await params;

  // Try loans table first, then fall back to opportunities
  let dealName = dealId.slice(0, 8);
  let loanType: string | null = null;
  let isOpportunity = false;

  const { data: loan } = await supabase
    .from("loans")
    .select("id, loan_number, property_address, type, loan_amount")
    .eq("id", dealId)
    .single();

  if (loan) {
    loanType = loan.type;
    dealName = loan.property_address || loan.loan_number || dealName;
  } else {
    // Fallback to opportunities table
    const admin = createAdminClient();
    const { data: opp } = await admin
      .from("opportunities")
      .select("id, deal_name, loan_type, proposed_loan_amount")
      .eq("id", dealId)
      .single();

    if (!opp) notFound();

    isOpportunity = true;
    loanType = opp.loan_type;
    dealName = opp.deal_name || dealName;
  }

  const modelType = getUWModelForLoanType(loanType);

  // Fetch all UW versions — use admin client to bypass RLS, query by appropriate FK
  const admin = createAdminClient();
  const uwQuery = isOpportunity
    ? admin
        .from("loan_underwriting_versions")
        .select("*")
        .eq("opportunity_id", dealId)
        .order("version_number", { ascending: false })
    : admin
        .from("loan_underwriting_versions")
        .select("*")
        .eq("loan_id", dealId)
        .order("version_number", { ascending: false });

  const { data: uwRaw } = await uwQuery;

  // Resolve author names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uwVersions = (uwRaw ?? []) as any[];
  const authorIds = Array.from(new Set(uwVersions.map((v) => v.created_by).filter(Boolean)));
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
  const versions = uwVersions.map((v: any) => ({
    id: v.id,
    loan_id: v.loan_id,
    version_number: v.version_number,
    is_active: v.is_active ?? false,
    created_by: v.created_by,
    label: v.label ?? null,
    notes: v.notes ?? null,
    model_type: v.model_type || modelType,
    calculator_inputs: v.calculator_inputs ?? {},
    calculator_outputs: v.calculator_outputs ?? {},
    status: v.status ?? "draft",
    created_at: v.created_at,
    _author_name: v.created_by ? authorMap[v.created_by] ?? null : null,
  }));

  const activeVersionId = versions.find((v) => v.is_active)?.id ?? null;

  // Fetch current user profile for name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const currentUserName = profile?.full_name ?? "Unknown";

  return (
    <UWEditorClient
      dealId={dealId}
      dealName={dealName}
      modelType={modelType}
      versions={versions}
      activeVersionId={activeVersionId}
      currentUserId={user.id}
      currentUserName={currentUserName}
      saveVersionAction={saveUWVersion}
      cloneVersionAction={cloneUWVersion}
      createVersionAction={createNewUWVersion}
      isOpportunity={isOpportunity}
    />
  );
}
