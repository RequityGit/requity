"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createEquityDealTask(
  dealId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await (admin as any)
      .from("equity_deal_tasks")
      .insert({ ...fields, deal_id: dealId })
      .select(
        "*, assigned_to_profile:profiles!equity_deal_tasks_assigned_to_fkey(id, full_name, avatar_url)"
      )
      .single();

    if (error) {
      console.error("createEquityDealTask error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("createEquityDealTask exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateEquityDealTask(
  taskId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const forbidden = ["id", "deal_id", "created_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { data, error } = await (admin as any)
      .from("equity_deal_tasks")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select(
        "*, assigned_to_profile:profiles!equity_deal_tasks_assigned_to_fkey(id, full_name, avatar_url)"
      )
      .single();

    if (error) {
      console.error("updateEquityDealTask error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("updateEquityDealTask exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteEquityDealTask(taskId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await (admin as any)
      .from("equity_deal_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("deleteEquityDealTask error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteEquityDealTask exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
