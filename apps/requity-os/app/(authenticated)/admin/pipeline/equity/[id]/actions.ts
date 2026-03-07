"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Update one or more fields on an equity_deals record.
 */
export async function updateEquityDealField(
  dealId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const forbidden = ["id", "deal_number", "created_at", "deleted_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { error } = await (admin as any)
      .from("equity_deals")
      .update(fields)
      .eq("id", dealId);

    if (error) {
      console.error("updateEquityDealField error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/pipeline/equity");
    return { success: true };
  } catch (err: unknown) {
    console.error("updateEquityDealField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Update one or more fields on a properties record linked to an equity deal.
 */
export async function updatePropertyField(
  propertyId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const forbidden = ["id", "created_at", "deleted_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { error } = await (admin as any)
      .from("properties")
      .update(fields)
      .eq("id", propertyId);

    if (error) {
      console.error("updatePropertyField error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/pipeline/equity");
    return { success: true };
  } catch (err: unknown) {
    console.error("updatePropertyField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Advance the equity deal to the next stage.
 */
export async function advanceEquityStage(
  dealId: string,
  fromStage: string,
  toStage: string,
  userId: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Update the deal stage
    const { error: updateError } = await (admin as any)
      .from("equity_deals")
      .update({
        stage: toStage,
        stage_changed_at: now,
        stage_changed_by: userId,
      })
      .eq("id", dealId);

    if (updateError) {
      console.error("advanceEquityStage update error:", updateError);
      return { error: updateError.message };
    }

    // Insert stage history record
    const { error: historyError } = await (admin as any)
      .from("equity_deal_stage_history")
      .insert({
        deal_id: dealId,
        from_stage: fromStage,
        to_stage: toStage,
        changed_by: userId,
        changed_at: now,
      });

    if (historyError) {
      console.error("advanceEquityStage history error:", historyError);
      // Non-fatal — the stage was still updated
    }

    revalidatePath("/admin/pipeline/equity");
    return { success: true };
  } catch (err: unknown) {
    console.error("advanceEquityStage exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Mark an equity deal as lost with a reason.
 */
export async function markEquityDealLost(
  dealId: string,
  lossReason: string,
  userId: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Get current stage for history
    const { data: current } = await (admin as any)
      .from("equity_deals")
      .select("stage")
      .eq("id", dealId)
      .single();

    const fromStage = current?.stage ?? "unknown";

    // Update the deal
    const { error: updateError } = await (admin as any)
      .from("equity_deals")
      .update({
        stage: "closed_lost",
        loss_reason: lossReason,
        stage_changed_at: now,
        stage_changed_by: userId,
      })
      .eq("id", dealId);

    if (updateError) {
      console.error("markEquityDealLost update error:", updateError);
      return { error: updateError.message };
    }

    // Insert stage history
    await (admin as any)
      .from("equity_deal_stage_history")
      .insert({
        deal_id: dealId,
        from_stage: fromStage,
        to_stage: "closed_lost",
        changed_by: userId,
        changed_at: now,
      });

    revalidatePath("/admin/pipeline/equity");
    return { success: true };
  } catch (err: unknown) {
    console.error("markEquityDealLost exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Save commercial underwriting data.
 */
export async function saveCommercialUnderwriting(
  dealId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const forbidden = ["id", "created_at", "created_by"];
    for (const key of forbidden) {
      delete fields[key];
    }

    // Check if record exists
    const { data: existing } = await (admin as any)
      .from("commercial_underwriting")
      .select("id")
      .eq("loan_id", dealId)
      .maybeSingle();

    if (existing) {
      // Update
      const { error } = await (admin as any)
        .from("commercial_underwriting")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("loan_id", dealId);

      if (error) {
        console.error("saveCommercialUnderwriting update error:", error);
        return { error: error.message };
      }
    } else {
      // Insert
      const { error } = await (admin as any)
        .from("commercial_underwriting")
        .insert({
          loan_id: dealId,
          property_type: fields.property_type || "other",
          ...fields,
        });

      if (error) {
        console.error("saveCommercialUnderwriting insert error:", error);
        return { error: error.message };
      }
    }

    revalidatePath("/admin/pipeline/equity");
    return { success: true };
  } catch (err: unknown) {
    console.error("saveCommercialUnderwriting exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
