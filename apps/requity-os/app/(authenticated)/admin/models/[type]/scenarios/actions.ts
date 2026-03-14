"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { SANDBOX_DEFAULT_INPUTS, DEFAULT_INPUTS } from "@/lib/underwriting/types";
import { computeOutputs } from "@/lib/underwriting/calculator";
import { COMMERCIAL_SANDBOX_DEFAULTS } from "@/lib/underwriting/commercial-types";
import { computeCommercialOutputs } from "@/lib/underwriting/commercial-calculator";
import { analyzeDiagnostics } from "@/lib/underwriting/diagnostics";
import type { UnderwritingInputs } from "@/lib/underwriting/types";


// ─── Create a new scenario ───────────────────────────────────────────────────

export async function createScenario(
  name: string,
  modelType: string,
  description?: string
): Promise<{ success?: boolean; error?: string; scenarioId?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // 1. Create the scenario container
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scenario, error: scErr } = await (admin as any)
      .from("model_scenarios")
      .insert({
        name,
        model_type: modelType,
        description: description || null,
        created_by: user.id,
        status: "active",
      })
      .select("id")
      .single();

    if (scErr || !scenario) {
      console.error("createScenario error:", scErr);
      return { error: scErr?.message || "Failed to create scenario" };
    }

    // 2. Create the initial v1 draft version with default inputs
    const isCommercial = modelType === "commercial";
    const defaultInputs = isCommercial ? COMMERCIAL_SANDBOX_DEFAULTS : SANDBOX_DEFAULT_INPUTS;
    const defaultOutputs = isCommercial
      ? computeCommercialOutputs(COMMERCIAL_SANDBOX_DEFAULTS)
      : computeOutputs(SANDBOX_DEFAULT_INPUTS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: version, error: vErr } = await (admin as any)
      .from("loan_underwriting_versions")
      .insert({
        scenario_id: scenario.id,
        loan_id: null,
        opportunity_id: null,
        is_sandbox: false,
        model_type: modelType,
        version_number: 1,
        is_active: false,
        status: "draft",
        created_by: user.id,
        calculator_inputs: defaultInputs as unknown as Record<string, unknown>,
        calculator_outputs: defaultOutputs as unknown as Record<string, unknown>,
        computation_status: "computed",
      })
      .select("id")
      .single();

    if (vErr) {
      console.error("createScenario version error:", vErr);
      // Clean up the scenario if version creation fails
      await (admin as any).from("model_scenarios").delete().eq("id", scenario.id); // eslint-disable-line @typescript-eslint/no-explicit-any
      return { error: vErr.message };
    }

    revalidatePath("/admin/models");
    return { success: true, scenarioId: scenario.id };
  } catch (err) {
    console.error("createScenario exception:", err);
    return { error: "Failed to create scenario" };
  }
}

// ─── Rename / update scenario metadata ───────────────────────────────────────

export async function updateScenario(
  scenarioId: string,
  updates: { name?: string; description?: string; status?: string }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await (admin as any)
      .from("model_scenarios")
      .update(payload)
      .eq("id", scenarioId);

    if (error) return { error: error.message };
    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("updateScenario exception:", err);
    return { error: "Failed to update scenario" };
  }
}

// ─── Soft-delete a scenario ──────────────────────────────────────────────────

export async function deleteScenario(
  scenarioId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await (admin as any)
      .from("model_scenarios")
      .update({ deleted_at: new Date().toISOString(), status: "archived" })
      .eq("id", scenarioId);

    if (error) return { error: error.message };
    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("deleteScenario exception:", err);
    return { error: "Failed to delete scenario" };
  }
}

// ─── Link scenario to a deal (deal or loan) ────────────────────────────────

export async function linkScenarioToDeal(
  scenarioId: string,
  dealId: string,
  dealType: "opportunity" | "loan"
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // 1. Update the scenario with the deal FK
    const scenarioUpdate =
      dealType === "opportunity"
        ? { opportunity_id: dealId, loan_id: null }
        : { loan_id: dealId, opportunity_id: null };

    const { error: scErr } = await (admin as any)
      .from("model_scenarios")
      .update(scenarioUpdate)
      .eq("id", scenarioId);

    if (scErr) return { error: scErr.message };

    // 2. Also stamp all existing versions in this scenario with the deal FK
    //    This makes them visible in the deal's UW tab
    const versionUpdate =
      dealType === "opportunity"
        ? { opportunity_id: dealId }
        : { loan_id: dealId };

    const { error: vErr } = await (admin as any)
      .from("loan_underwriting_versions")
      .update(versionUpdate)
      .eq("scenario_id", scenarioId);

    if (vErr) {
      console.error("linkScenarioToDeal version update error:", vErr);
      // Non-fatal — scenario is linked, versions will catch up
    }

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("linkScenarioToDeal exception:", err);
    return { error: "Failed to link scenario" };
  }
}

// ─── Unlink scenario from a deal ─────────────────────────────────────────────

export async function unlinkScenarioFromDeal(
  scenarioId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // 1. Clear deal FKs on scenario
    const { error: scErr } = await (admin as any)
      .from("model_scenarios")
      .update({ opportunity_id: null, loan_id: null })
      .eq("id", scenarioId);

    if (scErr) return { error: scErr.message };

    // 2. Clear deal FKs on all versions (keep scenario_id so they remain grouped)
    const { error: vErr } = await (admin as any)
      .from("loan_underwriting_versions")
      .update({ opportunity_id: null, loan_id: null })
      .eq("scenario_id", scenarioId);

    if (vErr) {
      console.error("unlinkScenarioFromDeal version update error:", vErr);
    }

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("unlinkScenarioFromDeal exception:", err);
    return { error: "Failed to unlink scenario" };
  }
}

// ─── Save a version within a scenario ────────────────────────────────────────

export async function saveScenarioVersion(
  versionId: string,
  _loanId: string, // kept for UWEditorClient interface compat
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown>,
  markActive: boolean,
  userId: string,
  _userName: string,
  versionNumber: number,
  _isOpportunity: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // Compute diagnostics
    let computationStatus: string = "empty";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let inputCompleteness: any = {};
    try {
      const { data: versionRow } = await (admin as any)
        .from("loan_underwriting_versions")
        .select("model_type, scenario_id")
        .eq("id", versionId)
        .single();

      const mt = versionRow?.model_type;
      if (mt === "rtl" || mt === "dscr") {
        const parsed = { ...DEFAULT_INPUTS, ...inputs } as UnderwritingInputs;
        const computed = computeOutputs(parsed);
        const diag = analyzeDiagnostics(parsed, computed, mt);
        computationStatus = diag.overallStatus;
        inputCompleteness = {
          populated: diag.inputSummary.populated,
          total: diag.inputSummary.total,
          missing: diag.inputSummary.missing,
        };
      } else if (mt === "commercial") {
        computationStatus = Object.keys(outputs).length > 0 ? "computed" : "empty";
      }
    } catch {
      // Non-critical
    }

    // Update version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: vError } = await (admin as any)
      .from("loan_underwriting_versions")
      .update({
        calculator_inputs: inputs,
        calculator_outputs: outputs,
        status: markActive ? "submitted" : "draft",
        computation_status: computationStatus,
        input_completeness: inputCompleteness,
      })
      .eq("id", versionId);

    if (vError) return { error: vError.message };

    // Handle marking active
    if (markActive) {
      // Get scenario_id for this version
      const { data: ver } = await (admin as any)
        .from("loan_underwriting_versions")
        .select("scenario_id")
        .eq("id", versionId)
        .single();

      if (ver?.scenario_id) {
        // Deactivate all versions in this scenario
        await (admin as any)
          .from("loan_underwriting_versions")
          .update({ is_active: false })
          .eq("scenario_id", ver.scenario_id);

        // Activate this one
        await (admin as any)
          .from("loan_underwriting_versions")
          .update({ is_active: true })
          .eq("id", versionId);

        // Update scenario's active_version_id
        await (admin as any)
          .from("model_scenarios")
          .update({ active_version_id: versionId })
          .eq("id", ver.scenario_id);
      }
    }

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("saveScenarioVersion exception:", err);
    return { error: "Failed to save version" };
  }
}

// ─── Clone a version within a scenario ───────────────────────────────────────

export async function cloneScenarioVersion(
  _loanId: string,
  sourceVersionId: string,
  userId: string,
  modelType: string,
  _isOpportunity: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // Fetch source
    const { data: source, error: srcErr } = await (admin as any)
      .from("loan_underwriting_versions")
      .select("calculator_inputs, scenario_id, opportunity_id, loan_id")
      .eq("id", sourceVersionId)
      .single();

    if (srcErr || !source) return { error: "Source version not found" };
    if (!source.scenario_id) return { error: "Version has no scenario" };

    // Get next version number within the scenario
    const { data: versions } = await (admin as any)
      .from("loan_underwriting_versions")
      .select("version_number")
      .eq("scenario_id", source.scenario_id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("loan_underwriting_versions")
      .insert({
        scenario_id: source.scenario_id,
        loan_id: source.loan_id || null,
        opportunity_id: source.opportunity_id || null,
        is_sandbox: false,
        model_type: modelType,
        version_number: nextVersion,
        is_active: false,
        status: "draft",
        created_by: userId,
        calculator_inputs: source.calculator_inputs || {},
        calculator_outputs: {},
        label: `Cloned from v${nextVersion - 1}`,
      });

    if (error) return { error: error.message };
    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("cloneScenarioVersion exception:", err);
    return { error: "Failed to clone version" };
  }
}

// ─── Create a blank new version within a scenario ────────────────────────────

export async function createScenarioVersion(
  scenarioId: string,
  userId: string,
  modelType: string,
  _isOpportunity: boolean = false
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // Get scenario to inherit deal links
    const { data: scenario } = await (admin as any)
      .from("model_scenarios")
      .select("opportunity_id, loan_id")
      .eq("id", scenarioId)
      .single();

    // Get next version number
    const { data: versions } = await (admin as any)
      .from("loan_underwriting_versions")
      .select("version_number")
      .eq("scenario_id", scenarioId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("loan_underwriting_versions")
      .insert({
        scenario_id: scenarioId,
        loan_id: scenario?.loan_id || null,
        opportunity_id: scenario?.opportunity_id || null,
        is_sandbox: false,
        model_type: modelType,
        version_number: nextVersion,
        is_active: false,
        status: "draft",
        created_by: userId,
        calculator_inputs: {},
        calculator_outputs: {},
      });

    if (error) return { error: error.message };
    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("createScenarioVersion exception:", err);
    return { error: "Failed to create version" };
  }
}
