import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { UWEditorClient } from "@/components/admin/underwriting/uw-editor-client";
import type { UWVersionData } from "@/components/admin/underwriting/uw-editor-client";
import {
  saveSandboxVersion,
  cloneSandboxVersion,
  createSandboxVersionAction,
  createSandboxVersion,
} from "./actions";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["rtl", "dscr", "commercial"] as const;

const MODEL_LABELS: Record<string, string> = {
  rtl: "Fix & Flip / RTL",
  dscr: "DSCR Calculator",
  commercial: "Commercial Underwriting",
};

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { user } = await requireAdmin();
  if (!user) redirect("/login");

  const { type } = await params;
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    redirect(`/models/${type}`);
  }

  const admin = createAdminClient();

  // Check for existing sandbox version for this user + model type
  let { data: existingVersion } = await admin
    .from("loan_underwriting_versions")
    .select("*")
    .eq("is_sandbox", true)
    .eq("created_by", user.id)
    .eq("model_type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // If no sandbox version exists, create one
  if (!existingVersion) {
    const result = await createSandboxVersion(user.id, type);
    if (result.error || !result.versionId) {
      return (
        <div className="p-6">
          <p className="text-destructive">Failed to create sandbox: {result.error}</p>
        </div>
      );
    }

    const { data } = await admin
      .from("loan_underwriting_versions")
      .select("*")
      .eq("id", result.versionId)
      .single();

    existingVersion = data;
  }

  if (!existingVersion) {
    return (
      <div className="p-6">
        <p className="text-destructive">Failed to load sandbox version.</p>
      </div>
    );
  }

  // Get user profile for display name
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || user.email || "Unknown";

  const version: UWVersionData = {
    id: existingVersion.id,
    loan_id: existingVersion.loan_id ?? "",
    version_number: existingVersion.version_number,
    is_active: false,
    created_by: existingVersion.created_by,
    label: existingVersion.label ?? null,
    notes: existingVersion.notes ?? null,
    model_type: type as "rtl" | "dscr" | "commercial",
    calculator_inputs: (existingVersion.calculator_inputs ?? {}) as Record<string, unknown>,
    calculator_outputs: (existingVersion.calculator_outputs ?? {}) as Record<string, unknown>,
    status: "draft",
    created_at: existingVersion.created_at,
    _author_name: userName,
  };

  return (
    <UWEditorClient
      dealId=""
      dealName={`Sandbox — ${MODEL_LABELS[type] || type}`}
      modelType={type as "rtl" | "dscr" | "commercial"}
      versions={[version]}
      activeVersionId={null}
      currentUserId={user.id}
      currentUserName={userName}
      saveVersionAction={saveSandboxVersion}
      cloneVersionAction={cloneSandboxVersion}
      createVersionAction={createSandboxVersionAction}
      isSandbox={true}
    />
  );
}
