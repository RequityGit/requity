"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageSection {
  id: string;
  page_type: string;
  section_key: string;
  section_label: string;
  section_icon: string;
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
  visibility_rule: string | null;
  sidebar: boolean;
}

export interface PageField {
  id: string;
  section_id: string;
  field_config_id: string | null;
  field_key: string;
  display_order: number;
  column_position: string;
  is_visible: boolean;
}

export interface FieldConfigInfo {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  is_locked: boolean;
  is_admin_created: boolean;
  is_archived: boolean;
}

interface SectionUpdate {
  id: string;
  section_key: string;
  section_label: string;
  section_icon: string;
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
  visibility_rule: string | null;
  sidebar: boolean;
}

interface FieldAssignment {
  id?: string;
  section_id: string;
  field_config_id: string | null;
  field_key: string;
  display_order: number;
  column_position: string;
  is_visible: boolean;
}

// ---------------------------------------------------------------------------
// Table aliases (not yet in generated types)
// ---------------------------------------------------------------------------

const SECTIONS_TABLE = "page_layout_sections" as never;
const FIELDS_TABLE = "page_layout_fields" as never;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function revalidate() {
  revalidatePath("/control-center/page-manager/contacts");
  revalidatePath("/control-center/page-manager/companies");
  // Revalidate detail pages so section order changes take effect
  revalidatePath("/admin/crm", "layout");
}

// ---------------------------------------------------------------------------
// Fetch page layout (sections + fields)
// ---------------------------------------------------------------------------

export async function fetchPageLayout(pageType: string): Promise<{
  sections?: PageSection[];
  fields?: PageField[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: sections, error: secErr } = await admin
      .from(SECTIONS_TABLE)
      .select("*" as never)
      .eq("page_type" as never, pageType as never)
      .order("display_order" as never, { ascending: true });

    if (secErr) {
      console.error("fetchPageLayout sections error:", secErr);
      return { error: secErr.message };
    }

    const sectionRows = (sections ?? []) as unknown as PageSection[];
    const sectionIds = sectionRows.map((s) => s.id);

    let fields: PageField[] = [];
    if (sectionIds.length > 0) {
      const { data: fieldData, error: fieldErr } = await admin
        .from(FIELDS_TABLE)
        .select("*" as never)
        .in("section_id" as never, sectionIds as never)
        .order("display_order" as never, { ascending: true });

      if (fieldErr) {
        console.error("fetchPageLayout fields error:", fieldErr);
        return { error: fieldErr.message };
      }
      fields = (fieldData ?? []) as unknown as PageField[];
    }

    return { sections: sectionRows, fields };
  } catch (err: unknown) {
    console.error("fetchPageLayout error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch available field configurations for given modules
// ---------------------------------------------------------------------------

export async function fetchAvailableFields(modules: string[]): Promise<{
  data?: FieldConfigInfo[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("field_configurations")
      .select("id, module, field_key, field_label, field_type, is_visible, is_locked, is_admin_created, is_archived")
      .in("module", modules)
      .eq("is_archived", false)
      .order("module")
      .order("field_label", { ascending: true });

    if (error) {
      console.error("fetchAvailableFields error:", error);
      return { error: error.message };
    }

    return { data: (data ?? []) as FieldConfigInfo[] };
  } catch (err: unknown) {
    console.error("fetchAvailableFields error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Publish full layout (sections + field assignments)
// ---------------------------------------------------------------------------

export async function publishPageLayout(
  pageType: string,
  sections: SectionUpdate[],
  fieldAssignments: FieldAssignment[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Update sections
    for (const section of sections) {
      const { error } = await admin
        .from(SECTIONS_TABLE)
        .update({
          section_label: section.section_label,
          section_icon: section.section_icon,
          display_order: section.display_order,
          is_visible: section.is_visible,
          visibility_rule: section.visibility_rule,
          sidebar: section.sidebar,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id" as never, section.id as never);

      if (error) {
        console.error("publishPageLayout section update error:", error);
        return { error: error.message };
      }
    }

    // Get all section IDs for this page to clear old field assignments
    const sectionIds = sections.map((s) => s.id);

    // Delete existing field assignments for these sections
    if (sectionIds.length > 0) {
      const { error: delErr } = await admin
        .from(FIELDS_TABLE)
        .delete()
        .in("section_id" as never, sectionIds as never);

      if (delErr) {
        console.error("publishPageLayout delete fields error:", delErr);
        return { error: delErr.message };
      }
    }

    // Insert new field assignments
    if (fieldAssignments.length > 0) {
      const rows = fieldAssignments.map((f) => ({
        section_id: f.section_id,
        field_config_id: f.field_config_id,
        field_key: f.field_key,
        display_order: f.display_order,
        column_position: f.column_position,
        is_visible: f.is_visible,
      }));

      const { error: insErr } = await admin
        .from(FIELDS_TABLE)
        .insert(rows as never);

      if (insErr) {
        console.error("publishPageLayout insert fields error:", insErr);
        return { error: insErr.message };
      }
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    console.error("publishPageLayout error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Add a new custom section
// ---------------------------------------------------------------------------

export async function addPageSection(input: {
  page_type: string;
  section_key: string;
  section_label: string;
  section_icon: string;
  sidebar: boolean;
}): Promise<{ data?: PageSection; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get max display_order for this page_type + sidebar combo
    const { data: maxRow } = await admin
      .from(SECTIONS_TABLE)
      .select("display_order" as never)
      .eq("page_type" as never, input.page_type as never)
      .eq("sidebar" as never, input.sidebar as never)
      .order("display_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { display_order: number } | null)?.display_order ?? -1) + 1;

    const { data, error } = await admin
      .from(SECTIONS_TABLE)
      .insert({
        page_type: input.page_type,
        section_key: input.section_key,
        section_label: input.section_label,
        section_icon: input.section_icon,
        display_order: nextOrder,
        is_visible: true,
        is_locked: false,
        sidebar: input.sidebar,
      } as never)
      .select("*" as never)
      .single();

    if (error) {
      console.error("addPageSection error:", error);
      return { error: error.message };
    }

    revalidate();
    return { data: data as unknown as PageSection };
  } catch (err: unknown) {
    console.error("addPageSection error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Delete a custom section (non-locked only)
// ---------------------------------------------------------------------------

export async function deletePageSection(sectionId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Verify section is not locked
    const { data: section } = await admin
      .from(SECTIONS_TABLE)
      .select("is_locked" as never)
      .eq("id" as never, sectionId as never)
      .single();

    if (!section) return { error: "Section not found" };
    if ((section as unknown as { is_locked: boolean }).is_locked) {
      return { error: "Cannot delete a locked system section" };
    }

    // Delete (cascade will remove field assignments)
    const { error } = await admin
      .from(SECTIONS_TABLE)
      .delete()
      .eq("id" as never, sectionId as never);

    if (error) {
      console.error("deletePageSection error:", error);
      return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    console.error("deletePageSection error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
