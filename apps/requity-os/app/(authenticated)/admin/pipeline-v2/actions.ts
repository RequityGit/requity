"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Database, Json } from "@/lib/supabase/types";

type UnifiedDealInsert = Database["public"]["Tables"]["unified_deals"]["Insert"];
type UnifiedDealUpdate = Database["public"]["Tables"]["unified_deals"]["Update"];

function revalidatePipeline(dealId?: string) {
  revalidatePath("/admin/pipeline-v2");
  revalidatePath("/admin/pipeline");
  if (dealId) {
    revalidatePath(`/admin/pipeline-v2/${dealId}`);
    revalidatePath(`/admin/pipeline/${dealId}`);
  }
}

// ─── Create Deal ───

export async function createUnifiedDealAction(data: {
  name: string;
  card_type_id: string;
  capital_side?: string;
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

    const insertData: UnifiedDealInsert = {
      name: data.name,
      card_type_id: data.card_type_id,
      capital_side: data.capital_side || "debt",
      asset_class: data.asset_class || null,
      amount: data.amount || null,
      primary_contact_id: data.primary_contact_id || null,
      company_id: data.company_id || null,
      expected_close_date: data.expected_close_date || null,
      assigned_to: data.assigned_to || null,
      created_by: auth.user.id,
    };

    const { data: deal, error } = await admin
      .from("unified_deals")
      .insert(insertData)
      .select("id, deal_number")
      .single();

    if (error) {
      console.error("createUnifiedDealAction error:", error);
      return { error: error.message };
    }

    // Generate conditions from loan_condition_templates
    const { error: condError } = await admin.rpc(
      "generate_deal_conditions" as never,
      { p_deal_id: deal.id } as never
    );
    if (condError) {
      console.error("Failed to generate deal conditions:", condError);
    }

    revalidatePipeline(deal.id);
    return { success: true, deal };
  } catch (err: unknown) {
    console.error("createUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to create deal" };
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
      .from("unified_deals")
      .update(updates as UnifiedDealUpdate)
      .eq("id", dealId);

    if (error) {
      console.error("updateUnifiedDealAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUnifiedDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update deal" };
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

    const { error } = await admin.rpc("unified_advance_stage", {
      p_deal_id: dealId,
      p_new_stage: newStage,
      p_notes: notes,
    });

    if (error) {
      console.error("advanceStageAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("advanceStageAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to advance stage" };
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
      .from("unified_deal_checklist")
      .update({
        completed,
        completed_by: completed ? auth.user.id : null,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", itemId);

    if (error) {
      console.error("toggleChecklistItemAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline();
    return { success: true };
  } catch (err: unknown) {
    console.error("toggleChecklistItemAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to toggle checklist item" };
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
      .from("unified_deals")
      .select("uw_data")
      .eq("id", dealId)
      .single();

    if (fetchErr || !deal) return { error: "Deal not found" };

    const currentData = (deal.uw_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, [key]: value };

    const { error } = await admin
      .from("unified_deals")
      .update({ uw_data: updatedData as Json })
      .eq("id", dealId);

    if (error) {
      console.error("updateUwDataAction error:", error);
      return { error: error.message };
    }

    // Log field update activity
    const { error: activityErr } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "field_updated",
      title: `Updated ${key}`,
      metadata: { field: key, value } as unknown as Json,
      created_by: auth.user.id,
    });

    if (activityErr) {
      console.error("Failed to log activity:", activityErr);
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateUwDataAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update underwriting data" };
  }
}

// ─── Add Activity Note ───

export async function addDealNoteAction(dealId: string, content: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "note",
      title: "Note added",
      description: content,
      created_by: auth.user.id,
    });

    if (error) {
      console.error("addDealNoteAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("addDealNoteAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to add note" };
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

    const updates: UnifiedDealUpdate = { status };
    if (lossReason) updates.loss_reason = lossReason;
    if (status === "won") updates.actual_close_date = new Date().toISOString().split("T")[0];

    const { error } = await admin
      .from("unified_deals")
      .update(updates)
      .eq("id", dealId);

    if (error) {
      console.error("updateDealStatusAction error:", error);
      return { error: error.message };
    }

    // Log status change
    const { error: activityErr } = await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "status_change",
      title: `Status changed to ${status}`,
      metadata: { status, loss_reason: lossReason } as unknown as Json,
      created_by: auth.user.id,
    });

    if (activityErr) {
      console.error("Failed to log status change activity:", activityErr);
    }

    revalidatePipeline(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealStatusAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update deal status" };
  }
}

// ─── Update Condition Status ───

export async function updateConditionStatusAction(
  conditionId: string,
  newStatus: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "submitted") updates.submitted_at = new Date().toISOString();
    if (newStatus === "approved" || newStatus === "rejected") {
      updates.reviewed_at = new Date().toISOString();
      updates.reviewed_by = auth.user.id;
    }

    const { error } = await admin
      .from("unified_deal_conditions" as never)
      .update(updates as never)
      .eq("id" as never, conditionId as never);

    if (error) {
      console.error("updateConditionStatusAction error:", error);
      return { error: error.message };
    }

    revalidatePipeline();
    return { success: true };
  } catch (err: unknown) {
    console.error("updateConditionStatusAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
