"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createDealTask(
  dealId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const payload = {
      ...fields,
      linked_entity_type: "loan",
      linked_entity_id: dealId,
    };

    const { data, error } = await (admin as any)
      .from("ops_tasks")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("createDealTask error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("createDealTask exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDealTask(
  taskId: string,
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

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { data, error } = await (admin as any)
      .from("ops_tasks")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("updateDealTask error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("updateDealTask exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteDealTask(taskId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await (admin as any)
      .from("ops_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("deleteDealTask error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteDealTask exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
