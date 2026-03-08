"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

interface FieldUpdate {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  column_position: string;
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
  is_admin_created?: boolean;
  is_archived?: boolean;
  dropdown_options?: string[] | null;
  formula_expression?: string | null;
  formula_source_fields?: string[] | null;
}

export async function publishFieldConfigurations(
  module: string,
  fields: FieldUpdate[]
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Upsert all fields for this module in a batch
    const { error } = await admin.from("field_configurations").upsert(
      fields.map((f) => ({
        id: f.id,
        module: f.module,
        field_key: f.field_key,
        field_label: f.field_label,
        field_type: f.field_type,
        column_position: f.column_position,
        display_order: f.display_order,
        is_visible: f.is_visible,
        is_locked: f.is_locked,
        is_admin_created: f.is_admin_created ?? false,
        is_archived: f.is_archived ?? false,
        dropdown_options: f.dropdown_options ?? null,
        formula_expression: f.formula_expression ?? null,
        formula_source_fields: f.formula_source_fields ?? null,
      })),
      { onConflict: "module,field_key" }
    );

    if (error) {
      console.error("publishFieldConfigurations error:", error);
      return { error: error.message };
    }

    revalidatePath("/control-center/field-manager");
    return { success: true };
  } catch (err: unknown) {
    console.error("publishFieldConfigurations error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function archiveField(fieldId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("field_configurations")
      .update({ is_archived: true, is_visible: false })
      .eq("id", fieldId)
      .eq("is_admin_created", true);

    if (error) {
      console.error("archiveField error:", error);
      return { error: error.message };
    }

    revalidatePath("/control-center/field-manager");
    return { success: true };
  } catch (err: unknown) {
    console.error("archiveField error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function restoreField(fieldId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("field_configurations")
      .update({ is_archived: false, is_visible: true })
      .eq("id", fieldId)
      .eq("is_admin_created", true);

    if (error) {
      console.error("restoreField error:", error);
      return { error: error.message };
    }

    revalidatePath("/control-center/field-manager");
    return { success: true };
  } catch (err: unknown) {
    console.error("restoreField error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function fetchFieldConfigurations(module: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("field_configurations")
      .select("*")
      .eq("module", module)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("fetchFieldConfigurations error:", error);
      return { error: error.message };
    }

    return { data: data ?? [] };
  } catch (err: unknown) {
    console.error("fetchFieldConfigurations error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function fetchAllFieldConfigurations() {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("field_configurations")
      .select("*")
      .order("module")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("fetchAllFieldConfigurations error:", error);
      return { error: error.message };
    }

    return { data: data ?? [] };
  } catch (err: unknown) {
    console.error("fetchAllFieldConfigurations error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
