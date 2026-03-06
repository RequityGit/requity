"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-admin";

export interface ConditionFormData {
  id?: string;
  condition_name: string;
  category: string;
  required_stage: string;
  applies_to_commercial: boolean;
  applies_to_rtl: boolean;
  applies_to_dscr: boolean;
  applies_to_guc: boolean;
  applies_to_transactional: boolean;
  internal_description: string | null;
  borrower_description: string | null;
  responsible_party: string | null;
  critical_path_item: boolean;
  sort_order: number | null;
  is_active: boolean;
}

export async function saveCondition(data: ConditionFormData) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const payload = {
      condition_name: data.condition_name,
      category: data.category as "borrower_documents",
      required_stage: data.required_stage as "processing",
      applies_to_commercial: data.applies_to_commercial,
      applies_to_rtl: data.applies_to_rtl,
      applies_to_dscr: data.applies_to_dscr,
      applies_to_guc: data.applies_to_guc,
      applies_to_transactional: data.applies_to_transactional,
      internal_description: data.internal_description,
      borrower_description: data.borrower_description,
      responsible_party: data.responsible_party,
      critical_path_item: data.critical_path_item,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };

    if (data.id) {
      // Update
      const { error } = await admin
        .from("loan_condition_templates")
        .update(payload)
        .eq("id", data.id);

      if (error) {
        console.error("Update condition error:", error);
        return { error: error.message };
      }
      return { success: true, message: "Condition updated" };
    } else {
      // Insert
      const { error } = await admin
        .from("loan_condition_templates")
        .insert(payload);

      if (error) {
        console.error("Insert condition error:", error);
        return { error: error.message };
      }
      return { success: true, message: "Condition saved" };
    }
  } catch (err) {
    console.error("Save condition error:", err);
    return { error: "Failed to save condition" };
  }
}

export async function deactivateCondition(id: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("loan_condition_templates")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Deactivate condition error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Deactivate condition error:", err);
    return { error: "Failed to deactivate condition" };
  }
}

export async function reactivateCondition(id: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("loan_condition_templates")
      .update({ is_active: true })
      .eq("id", id);

    if (error) {
      console.error("Reactivate condition error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Reactivate condition error:", err);
    return { error: "Failed to reactivate condition" };
  }
}

export async function updateConditionInline(
  id: string,
  fields: Partial<{
    condition_name: string;
    applies_to_commercial: boolean;
    applies_to_rtl: boolean;
    applies_to_dscr: boolean;
    applies_to_guc: boolean;
    applies_to_transactional: boolean;
  }>
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("loan_condition_templates")
      .update(fields)
      .eq("id", id);

    if (error) {
      console.error("Inline update condition error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Inline update condition error:", err);
    return { error: "Failed to update condition" };
  }
}

export async function reorderConditions(
  updates: { id: string; sort_order: number }[]
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    for (const update of updates) {
      const { error } = await admin
        .from("loan_condition_templates")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);

      if (error) {
        console.error("Reorder condition error:", error);
        return { error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Reorder conditions error:", err);
    return { error: "Failed to reorder conditions" };
  }
}
