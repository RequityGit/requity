"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  UnifiedCardType,
  CardMetricDef,
  UwFieldDef,
  UwOutputDef,
  FieldGroupDef,
  CapitalSide,
  CardTypeStatus,
} from "@/components/pipeline-v2/pipeline-types";

// ---------------------------------------------------------------------------
// Re-export types for the client component
// ---------------------------------------------------------------------------

export type {
  UnifiedCardType,
  CardMetricDef,
  UwFieldDef,
  UwOutputDef,
  FieldGroupDef,
  CapitalSide,
  CardTypeStatus,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TABLE = "unified_card_types" as never;
const DEALS_TABLE = "unified_deals" as never;

function revalidate() {
  revalidatePath("/control-center/card-types");
  revalidatePath("/admin/pipeline-v2");
}

// ---------------------------------------------------------------------------
// Fetch all card types (admin view — all statuses)
// ---------------------------------------------------------------------------

export async function fetchCardTypes(): Promise<{
  data?: UnifiedCardType[];
  error?: string;
}> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(TABLE)
      .select("*" as never)
      .order("sort_order" as never);

    if (error) {
      console.error("fetchCardTypes error:", error);
      return { error: error.message };
    }

    return { data: (data ?? []) as unknown as UnifiedCardType[] };
  } catch (err: unknown) {
    console.error("fetchCardTypes error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Create a new card type
// ---------------------------------------------------------------------------

export async function createCardType(input: {
  label: string;
  slug: string;
  capital_side: CapitalSide;
  category: string;
  template_id?: string;
}): Promise<{ data?: UnifiedCardType; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // If cloning from a template, fetch it
    let template: UnifiedCardType | null = null;
    if (input.template_id) {
      const { data: t } = await admin
        .from(TABLE)
        .select("*" as never)
        .eq("id" as never, input.template_id as never)
        .single();
      template = t as unknown as UnifiedCardType | null;
    }

    // Get max sort_order
    const { data: maxRow } = await admin
      .from(TABLE)
      .select("sort_order" as never)
      .order("sort_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

    const row = {
      slug: input.slug,
      label: input.label,
      capital_side: input.capital_side,
      category: input.category,
      description: template?.description ?? null,
      uw_model_key: template?.uw_model_key ?? input.slug,
      uw_fields: template?.uw_fields ?? [],
      uw_outputs: template?.uw_outputs ?? [],
      card_metrics: template?.card_metrics ?? [],
      card_icon: template?.card_icon ?? "building-2",
      detail_tabs: template?.detail_tabs ?? ["overview", "financials", "documents", "conditions"],
      detail_field_groups: template?.detail_field_groups ?? [],
      property_fields: template?.property_fields ?? [],
      property_field_groups: template?.property_field_groups ?? [],
      contact_fields: template?.contact_fields ?? [],
      contact_field_groups: template?.contact_field_groups ?? [],
      contact_roles: template?.contact_roles ?? ["borrower"],
      applicable_asset_classes: template?.applicable_asset_classes ?? null,
      status: "draft" as CardTypeStatus,
      sort_order: nextOrder,
    };

    const { data, error } = await admin
      .from(TABLE)
      .insert(row as never)
      .select("*" as never)
      .single();

    if (error) {
      console.error("createCardType error:", error);
      return { error: error.message };
    }

    revalidate();
    return { data: data as unknown as UnifiedCardType };
  } catch (err: unknown) {
    console.error("createCardType error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Duplicate an existing card type
// ---------------------------------------------------------------------------

export async function duplicateCardType(
  id: string
): Promise<{ data?: UnifiedCardType; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: source, error: fetchErr } = await admin
      .from(TABLE)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (fetchErr || !source) {
      return { error: fetchErr?.message ?? "Card type not found" };
    }

    const src = source as unknown as UnifiedCardType;

    // Get max sort_order
    const { data: maxRow } = await admin
      .from(TABLE)
      .select("sort_order" as never)
      .order("sort_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { sort_order: number } | null)?.sort_order ?? 0) + 1;

    const row = {
      slug: `${src.slug}_copy`,
      label: `${src.label} (Copy)`,
      capital_side: src.capital_side,
      category: src.category,
      description: src.description,
      uw_model_key: src.uw_model_key,
      uw_fields: src.uw_fields,
      uw_outputs: src.uw_outputs,
      card_metrics: src.card_metrics,
      card_icon: src.card_icon,
      detail_tabs: src.detail_tabs,
      detail_field_groups: src.detail_field_groups,
      property_fields: src.property_fields,
      property_field_groups: src.property_field_groups,
      contact_fields: src.contact_fields,
      contact_field_groups: src.contact_field_groups,
      contact_roles: src.contact_roles,
      applicable_asset_classes: src.applicable_asset_classes,
      status: "draft" as CardTypeStatus,
      sort_order: nextOrder,
    };

    const { data, error } = await admin
      .from(TABLE)
      .insert(row as never)
      .select("*" as never)
      .single();

    if (error) {
      console.error("duplicateCardType error:", error);
      return { error: error.message };
    }

    revalidate();
    return { data: data as unknown as UnifiedCardType };
  } catch (err: unknown) {
    console.error("duplicateCardType error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Save (update) a card type
// ---------------------------------------------------------------------------

export async function saveCardType(
  id: string,
  updates: Partial<
    Pick<
      UnifiedCardType,
      | "slug"
      | "label"
      | "description"
      | "capital_side"
      | "category"
      | "card_icon"
      | "card_metrics"
      | "uw_fields"
      | "uw_outputs"
      | "detail_field_groups"
      | "detail_tabs"
      | "property_fields"
      | "property_field_groups"
      | "contact_fields"
      | "contact_field_groups"
      | "contact_roles"
      | "applicable_asset_classes"
      | "status"
      | "uw_model_key"
    >
  >
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from(TABLE)
      .update(updates as never)
      .eq("id" as never, id as never);

    if (error) {
      console.error("saveCardType error:", error);
      return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    console.error("saveCardType error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Archive a card type (soft delete)
// ---------------------------------------------------------------------------

export async function archiveCardType(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Check for active deals
    const { count } = await admin
      .from(DEALS_TABLE)
      .select("id" as never, { count: "exact", head: true })
      .eq("card_type_id" as never, id as never)
      .in("status" as never, ["active", "on_hold"] as never);

    if (count && count > 0) {
      return {
        error: `Cannot archive: ${count} active deal(s) still use this card type. Reassign them first.`,
      };
    }

    const { error } = await admin
      .from(TABLE)
      .update({ status: "archived" } as never)
      .eq("id" as never, id as never);

    if (error) {
      console.error("archiveCardType error:", error);
      return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    console.error("archiveCardType error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Delete a card type (hard delete — only if no deals reference it)
// ---------------------------------------------------------------------------

export async function deleteCardType(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Check for any deals (any status)
    const { count } = await admin
      .from(DEALS_TABLE)
      .select("id" as never, { count: "exact", head: true })
      .eq("card_type_id" as never, id as never);

    if (count && count > 0) {
      return {
        error: `Cannot delete: ${count} deal(s) reference this card type. Archive it instead.`,
      };
    }

    const { error } = await admin
      .from(TABLE)
      .delete()
      .eq("id" as never, id as never);

    if (error) {
      console.error("deleteCardType error:", error);
      return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCardType error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ---------------------------------------------------------------------------
// Reorder card types
// ---------------------------------------------------------------------------

export async function reorderCardTypes(
  orderedIds: string[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await admin
        .from(TABLE)
        .update({ sort_order: i } as never)
        .eq("id" as never, orderedIds[i] as never);

      if (error) {
        console.error("reorderCardTypes error:", error);
        return { error: error.message };
      }
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    console.error("reorderCardTypes error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
