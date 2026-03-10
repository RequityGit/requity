"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Table aliases (not yet in generated types)
// ---------------------------------------------------------------------------

const OBJ_DEFS = "object_definitions" as never;
const OBJ_RELS = "object_relationships" as never;
const REL_ROLES = "relationship_roles" as never;
const FIELD_CFG = "field_configurations" as never;
const SECTIONS = "page_layout_sections" as never;
const FIELDS = "page_layout_fields" as never;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ObjectDefinition {
  id: string;
  object_key: string;
  label: string;
  description: string | null;
  icon: string;
  color: string;
  table_name: string;
  is_system: boolean;
  sort_order: number;
}

export interface FieldConfig {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  is_locked: boolean;
  is_admin_created: boolean;
  is_archived: boolean;
  dropdown_options: string[] | null;
  formula_expression: string | null;
  formula_source_fields: string[] | null;
  is_required: boolean;
  is_unique: boolean;
  is_read_only: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_sortable: boolean;
  track_changes: boolean;
  is_system: boolean;
  type_config: Record<string, unknown>;
  default_value: string | null;
  validation_message: string | null;
  validation_regex: string | null;
  conditional_rules: unknown[];
  required_at_stage: string | null;
  blocks_stage_progression: boolean;
  permissions: Record<string, unknown>;
  help_text: string | null;
  display_order: number;
  section_group: string | null;
  column_span: string;
}

export interface ObjectRelationship {
  id: string;
  parent_object_key: string;
  child_object_key: string;
  cardinality: string;
  junction_table: string | null;
  fk_column: string | null;
  sync_direction: string;
  allow_quick_create: boolean;
  cascade_delete: boolean;
  inherited_fields: string[];
  sort_order: number;
}

export interface RelationshipRole {
  id: string;
  relationship_id: string;
  role_key: string;
  label: string;
  color: string;
  is_required: boolean;
  required_before_stage: string | null;
  max_count: number | null;
  sort_order: number;
}

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
  tab_key: string | null;
  tab_label: string | null;
  tab_icon: string | null;
  tab_order: number;
  tab_locked: boolean;
  section_type: string;
  relationship_id: string | null;
  card_type_id: string | null;
  default_collapsed: boolean;
}

export interface PageField {
  id: string;
  section_id: string;
  field_config_id: string | null;
  field_key: string;
  display_order: number;
  column_position: string;
  is_visible: boolean;
  source: string;
  source_object_key: string | null;
  column_span: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function revalidate() {
  revalidatePath("/control-center/object-manager");
}

// ---------------------------------------------------------------------------
// Fetch all object definitions
// ---------------------------------------------------------------------------

export async function fetchObjectDefinitions(): Promise<{
  data?: ObjectDefinition[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(OBJ_DEFS)
      .select("*" as never)
      .order("sort_order" as never, { ascending: true });

    if (error) return { error: error.message };
    return { data: (data ?? []) as unknown as ObjectDefinition[] };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch field configurations for an object
// ---------------------------------------------------------------------------

export async function fetchObjectFields(module: string): Promise<{
  data?: FieldConfig[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(FIELD_CFG)
      .select("*" as never)
      .eq("module" as never, module as never)
      .order("display_order" as never, { ascending: true });

    if (error) return { error: error.message };
    return { data: (data ?? []) as unknown as FieldConfig[] };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch relationships for an object
// ---------------------------------------------------------------------------

export async function fetchObjectRelationships(objectKey: string): Promise<{
  relationships?: ObjectRelationship[];
  roles?: RelationshipRole[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: rels, error: relErr } = await admin
      .from(OBJ_RELS)
      .select("*" as never)
      .or(
        `parent_object_key.eq.${objectKey},child_object_key.eq.${objectKey}` as never
      )
      .order("sort_order" as never, { ascending: true });

    if (relErr) return { error: relErr.message };
    const relationships = (rels ?? []) as unknown as ObjectRelationship[];

    // Fetch roles for all relationships
    const relIds = relationships.map((r) => r.id);
    let roles: RelationshipRole[] = [];
    if (relIds.length > 0) {
      const { data: rolesData, error: rolesErr } = await admin
        .from(REL_ROLES)
        .select("*" as never)
        .in("relationship_id" as never, relIds as never)
        .order("sort_order" as never, { ascending: true });

      if (rolesErr) return { error: rolesErr.message };
      roles = (rolesData ?? []) as unknown as RelationshipRole[];
    }

    return { relationships, roles };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch page layout for an object
// ---------------------------------------------------------------------------

export async function fetchObjectLayout(pageType: string): Promise<{
  sections?: PageSection[];
  fields?: PageField[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: sections, error: secErr } = await admin
      .from(SECTIONS)
      .select("*" as never)
      .eq("page_type" as never, pageType as never)
      .order("tab_order" as never, { ascending: true })
      .order("display_order" as never, { ascending: true });

    if (secErr) return { error: secErr.message };

    const sectionRows = (sections ?? []) as unknown as PageSection[];
    const sectionIds = sectionRows.map((s) => s.id);

    let fields: PageField[] = [];
    if (sectionIds.length > 0) {
      const { data: fieldData, error: fieldErr } = await admin
        .from(FIELDS)
        .select("*" as never)
        .in("section_id" as never, sectionIds as never)
        .order("display_order" as never, { ascending: true });

      if (fieldErr) return { error: fieldErr.message };
      fields = (fieldData ?? []) as unknown as PageField[];
    }

    return { sections: sectionRows, fields };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update a field configuration
// ---------------------------------------------------------------------------

export async function updateFieldConfig(
  fieldId: string,
  updates: Partial<FieldConfig>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(FIELD_CFG)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: auth.user.id,
      } as never)
      .eq("id" as never, fieldId as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Create a new field
// ---------------------------------------------------------------------------

export async function createField(input: {
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required?: boolean;
  dropdown_options?: string[] | null;
}): Promise<{ data?: FieldConfig; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get max display_order
    const { data: maxRow } = await admin
      .from(FIELD_CFG)
      .select("display_order" as never)
      .eq("module" as never, input.module as never)
      .order("display_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { display_order: number } | null)?.display_order ?? -1) + 1;

    const { data, error } = await admin
      .from(FIELD_CFG)
      .insert({
        module: input.module,
        field_key: input.field_key,
        field_label: input.field_label,
        field_type: input.field_type,
        is_visible: true,
        is_locked: false,
        is_admin_created: true,
        is_archived: false,
        is_required: input.is_required ?? false,
        dropdown_options: input.dropdown_options ?? null,
        display_order: nextOrder,
        created_by: auth.user.id,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: error.message };
    revalidate();
    return { data: data as unknown as FieldConfig };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Archive a field
// ---------------------------------------------------------------------------

export async function archiveField(fieldId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(FIELD_CFG)
      .update({ is_archived: true, is_visible: false, updated_at: new Date().toISOString() } as never)
      .eq("id" as never, fieldId as never)
      .eq("is_admin_created" as never, true as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update relationship
// ---------------------------------------------------------------------------

export async function updateRelationship(
  relId: string,
  updates: Partial<ObjectRelationship>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(OBJ_RELS)
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq("id" as never, relId as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update relationship role
// ---------------------------------------------------------------------------

export async function updateRelationshipRole(
  roleId: string,
  updates: Partial<RelationshipRole>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(REL_ROLES)
      .update(updates as never)
      .eq("id" as never, roleId as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Reorder fields (update display_order)
// ---------------------------------------------------------------------------

export async function reorderFields(
  fieldOrders: { id: string; display_order: number }[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    for (const fo of fieldOrders) {
      const { error } = await admin
        .from(FIELD_CFG)
        .update({ display_order: fo.display_order, updated_at: new Date().toISOString() } as never)
        .eq("id" as never, fo.id as never);
      if (error) return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch field count per module (for sidebar badges)
// ---------------------------------------------------------------------------

export async function fetchFieldCounts(): Promise<{
  data?: Record<string, number>;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(FIELD_CFG)
      .select("module" as never)
      .eq("is_archived" as never, false as never);

    if (error) return { error: error.message };

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as unknown as { module: string }[]) {
      counts[row.module] = (counts[row.module] || 0) + 1;
    }
    return { data: counts };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch relationship counts per object (for sidebar badges)
// ---------------------------------------------------------------------------

export async function fetchRelationshipCounts(): Promise<{
  data?: Record<string, number>;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(OBJ_RELS)
      .select("parent_object_key, child_object_key" as never);

    if (error) return { error: error.message };

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as unknown as { parent_object_key: string; child_object_key: string }[]) {
      counts[row.parent_object_key] = (counts[row.parent_object_key] || 0) + 1;
      counts[row.child_object_key] = (counts[row.child_object_key] || 0) + 1;
    }
    return { data: counts };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
