"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

const REVALIDATE_PATH = "/admin/pipeline-v2";

function revalidatePipeline(dealId?: string) {
  revalidatePath(REVALIDATE_PATH);
  if (dealId) revalidatePath(`/admin/pipeline-v2/${dealId}`);
}

// ─── Create Deal ───

export async function createUnifiedDealAction(data: {
  name: string;
  card_type_id: string;
  asset_class?: string;
  amount?: number;
  primary_contact_id?: string;
  company_id?: string;
  expected_close_date?: string;
  assigned_to?: string;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: deal, error } = await admin
      .from("unified_deals" as never)
      .insert({
        name: data.name,
        card_type_id: data.card_type_id,
        asset_class: data.asset_class || null,
        amount: data.amount || null,
        primary_contact_id: data.primary_contact_id || null,
        company_id: data.company_id || null,
        expected_close_date: data.expected_close_date || null,
        assigned_to: data.assigned_to || null,
        created_by: auth.user.id,
      } as never)
      .select("id, deal_number")
      .single();

    if (error) {
      console.error("createUnifiedDealAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline((deal as { id: string }).id);
    return { success: true, deal };
  } catch (err: unknown) {
    console.error("createUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Update Deal ───

export async function updateUnifiedDealAction(
  dealId: string,
  updates: Record<string, unknown>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deals" as never)
      .update(updates as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("updateUnifiedDealAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Advance Stage ───

export async function advanceStageAction(
  dealId: string,
  newStage: string,
  notes?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.rpc("unified_advance_stage" as never, {
      p_deal_id: dealId,
      p_new_stage: newStage,
      p_notes: notes || null,
    } as never);

    if (error) {
      console.error("advanceStageAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("advanceStageAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Toggle Checklist Item ───

export async function toggleChecklistItemAction(
  itemId: string,
  completed: boolean
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deal_checklist" as never)
      .update({
        completed,
        completed_by: completed ? auth.user.id : null,
        completed_at: completed ? new Date().toISOString() : null,
      } as never)
      .eq("id" as never, itemId as never);

    if (error) {
      console.error("toggleChecklistItemAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline();
    return { success: true };
  } catch (err: unknown) {
    console.error("toggleChecklistItemAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Update UW Data ───

export async function updateUwDataAction(
  dealId: string,
  key: string,
  value: unknown
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get current uw_data
    const { data: deal, error: fetchErr } = await admin
      .from("unified_deals" as never)
      .select("uw_data" as never)
      .eq("id" as never, dealId as never)
      .single();

    if (fetchErr || !deal) return { error: "Deal not found" };

    const currentData = (deal as { uw_data: Record<string, unknown> }).uw_data || {};
    const updatedData = { ...currentData, [key]: value };

    const { error } = await admin
      .from("unified_deals" as never)
      .update({ uw_data: updatedData } as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("updateUwDataAction error:", error);
      return { error: error.message };
    }

    // Log field update activity
    await admin.from("unified_deal_activity" as never).insert({
      deal_id: dealId,
      activity_type: "field_updated",
      title: `Updated ${key}`,
      metadata: { field: key, value },
      created_by: auth.user.id,
    } as never);

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUwDataAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Add Activity Note ───

export async function addDealNoteAction(dealId: string, content: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.from("unified_deal_activity" as never).insert({
      deal_id: dealId,
      activity_type: "note",
      title: "Note added",
      description: content,
      created_by: auth.user.id,
    } as never);

    if (error) {
      console.error("addDealNoteAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("addDealNoteAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ─── Update Deal Status (won/lost/on_hold) ───

export async function updateDealStatusAction(
  dealId: string,
  status: string,
  lossReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    if (status === "lost" && !lossReason) {
      return { error: "Loss reason is required when marking a deal as lost" };
    }

    const admin = createAdminClient();

    const updates: Record<string, unknown> = { status };
    if (lossReason) updates.loss_reason = lossReason;
    if (status === "won") updates.actual_close_date = new Date().toISOString().split("T")[0];

    const { error } = await admin
      .from("unified_deals" as never)
      .update(updates as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("updateDealStatusAction error:", error);
      return { error: error.message };
    }

    // Log status change
    await admin.from("unified_deal_activity" as never).insert({
      deal_id: dealId,
      activity_type: "status_change",
      title: `Status changed to ${status}`,
      metadata: { status, loss_reason: lossReason },
      created_by: auth.user.id,
    } as never);

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealStatusAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
