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

export interface VisibilityCondition {
  asset_class?: string[];
  loan_type?: string[];
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
  formula_output_format: string | null;
  formula_decimal_places: number;
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
  visibility_condition: VisibilityCondition | null;
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
  // Revalidate detail pages so layout changes take effect
  revalidatePath("/admin/crm", "layout");
  revalidatePath("/admin/crm", "page");
}

// ---------------------------------------------------------------------------
// Publish: comprehensive revalidation of all pages that consume layout data
// ---------------------------------------------------------------------------

export async function publishObjectChanges(objectKey: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    // Revalidate the Object Manager itself
    revalidatePath("/control-center/object-manager");

    // Revalidate all CRM pages (contact detail, company detail)
    revalidatePath("/admin/crm", "layout");
    revalidatePath("/admin/crm", "page");

    // Revalidate specific detail page types based on object
    const pageRouteMap: Record<string, string[]> = {
      contact: ["/admin/crm"],
      company: ["/admin/crm"],
      loan: ["/admin/loans"],
      property: ["/admin/properties"],
      borrower: ["/admin/crm"],
      borrower_entity: ["/admin/crm"],
      investor: ["/admin/crm"],
      unified_deal: ["/admin/pipeline-v2"],
    };

    const routes = pageRouteMap[objectKey] || [];
    for (const route of routes) {
      revalidatePath(route, "layout");
      revalidatePath(route, "page");
    }

    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
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

export async function fetchObjectFields(module: string | string[]): Promise<{
  data?: FieldConfig[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const modules = Array.isArray(module) ? module : [module];

    const { data, error } = await admin
      .from(FIELD_CFG)
      .select("*" as never)
      .in("module" as never, modules as never)
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
// Create a new relationship
// ---------------------------------------------------------------------------

export async function createRelationship(input: {
  parent_object_key: string;
  child_object_key: string;
  cardinality: string;
  junction_table?: string;
  fk_column?: string;
  sync_direction?: string;
  allow_quick_create?: boolean;
}): Promise<{ data?: ObjectRelationship; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get max sort_order
    const { data: maxRow } = await admin
      .from(OBJ_RELS)
      .select("sort_order" as never)
      .order("sort_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { sort_order: number } | null)?.sort_order ?? -1) + 1;

    const { data, error } = await admin
      .from(OBJ_RELS)
      .insert({
        parent_object_key: input.parent_object_key,
        child_object_key: input.child_object_key,
        cardinality: input.cardinality,
        junction_table: input.junction_table || null,
        fk_column: input.fk_column || null,
        sync_direction: input.sync_direction || "parent_to_child",
        allow_quick_create: input.allow_quick_create ?? false,
        cascade_delete: false,
        inherited_fields: [],
        sort_order: nextOrder,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: error.message };
    revalidate();
    return { data: data as unknown as ObjectRelationship };
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
// Reorder layout sections (update display_order on page_layout_sections)
// ---------------------------------------------------------------------------

export async function reorderLayoutSections(
  updates: { id: string; display_order: number }[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    for (const u of updates) {
      const { error } = await admin
        .from(SECTIONS)
        .update({ display_order: u.display_order } as never)
        .eq("id" as never, u.id as never);
      if (error) return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Reorder layout fields (update display_order and optionally section_id)
// ---------------------------------------------------------------------------

export async function reorderLayoutFields(
  updates: { id: string; display_order: number; section_id?: string }[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    for (const u of updates) {
      const patch: Record<string, unknown> = { display_order: u.display_order };
      if (u.section_id) patch.section_id = u.section_id;
      const { error } = await admin
        .from(FIELDS)
        .update(patch as never)
        .eq("id" as never, u.id as never);
      if (error) return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Add a field from the palette to a layout section
// ---------------------------------------------------------------------------

// Module -> source_object_key mapping for runtime data resolution
const MODULE_TO_SOURCE: Record<string, string> = {
  contact_profile: "contact",
  borrower_profile: "borrower",
  investor_profile: "investor",
  borrower_entity: "borrower_entity",
  company_info: "company",
  uw_deal: "unified_deal",
  uw_property: "property",
  uw_borrower: "borrower",
  loan_details: "loan",
};

export async function addFieldToLayout(input: {
  section_id: string;
  field_config_id: string;
  field_key: string;
  display_order: number;
  column_span?: string;
}): Promise<{ data?: PageField; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Look up the field's module to determine source_object_key
    let sourceObjectKey: string | null = null;
    if (input.field_config_id) {
      const { data: fcRow } = await admin
        .from(FIELD_CFG)
        .select("module" as never)
        .eq("id" as never, input.field_config_id as never)
        .single();
      if (fcRow) {
        sourceObjectKey = MODULE_TO_SOURCE[(fcRow as unknown as { module: string }).module] ?? null;
      }
    }

    const { data, error } = await admin
      .from(FIELDS)
      .insert({
        section_id: input.section_id,
        field_config_id: input.field_config_id,
        field_key: input.field_key,
        display_order: input.display_order,
        column_position: "left",
        column_span: input.column_span || "half",
        is_visible: true,
        source: "native",
        source_object_key: sourceObjectKey,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: error.message };
    revalidate();
    return { data: data as unknown as PageField };
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

// ---------------------------------------------------------------------------
// Fetch fields for multiple modules at once (for related entity fields)
// ---------------------------------------------------------------------------

export async function fetchFieldsForModules(modules: string[]): Promise<{
  data?: FieldConfig[];
  error?: string;
}> {
  try {
    if (modules.length === 0) return { data: [] };

    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(FIELD_CFG)
      .select("*" as never)
      .in("module" as never, modules as never)
      .eq("is_archived" as never, false as never)
      .order("display_order" as never, { ascending: true });

    if (error) return { error: error.message };
    return { data: (data ?? []) as unknown as FieldConfig[] };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ===========================================================================
// PAGE LAYOUT MUTATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// Update a single section's properties
// ---------------------------------------------------------------------------

export async function updateSection(
  sectionId: string,
  updates: Partial<Pick<PageSection, "section_label" | "section_icon" | "display_order" | "is_visible" | "default_collapsed" | "section_type" | "visibility_rule" | "sidebar">>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(SECTIONS)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, sectionId as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Add a new section to a page layout
// ---------------------------------------------------------------------------

export async function addSection(input: {
  page_type: string;
  section_key: string;
  section_label: string;
  section_icon?: string;
  sidebar: boolean;
  section_type?: string;
  tab_key?: string;
  tab_label?: string;
}): Promise<{ data?: PageSection; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get max display_order for this page_type + sidebar combo
    const { data: maxRow } = await admin
      .from(SECTIONS)
      .select("display_order" as never)
      .eq("page_type" as never, input.page_type as never)
      .eq("sidebar" as never, input.sidebar as never)
      .order("display_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { display_order: number } | null)?.display_order ?? -1) + 1;

    const { data, error } = await admin
      .from(SECTIONS)
      .insert({
        page_type: input.page_type,
        section_key: input.section_key,
        section_label: input.section_label,
        section_icon: input.section_icon || "file-text",
        display_order: nextOrder,
        is_visible: true,
        is_locked: false,
        sidebar: input.sidebar,
        section_type: input.section_type || "fields",
        tab_key: input.tab_key || null,
        tab_label: input.tab_label || null,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: error.message };
    revalidate();
    return { data: data as unknown as PageSection };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Delete a section (non-locked only, cascade deletes field assignments)
// ---------------------------------------------------------------------------

export async function deleteSection(sectionId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Verify section is not locked
    const { data: section } = await admin
      .from(SECTIONS)
      .select("is_locked" as never)
      .eq("id" as never, sectionId as never)
      .single();

    if (!section) return { error: "Section not found" };
    if ((section as unknown as { is_locked: boolean }).is_locked) {
      return { error: "Cannot delete a locked system section" };
    }

    const { error } = await admin
      .from(SECTIONS)
      .delete()
      .eq("id" as never, sectionId as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Reorder sections (update display_order for multiple sections)
// ---------------------------------------------------------------------------

export async function reorderSections(
  sectionOrders: { id: string; display_order: number }[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    for (const so of sectionOrders) {
      const { error } = await admin
        .from(SECTIONS)
        .update({ display_order: so.display_order, updated_at: new Date().toISOString() } as never)
        .eq("id" as never, so.id as never);
      if (error) return { error: error.message };
    }

    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Add a field to a layout section
// ---------------------------------------------------------------------------

export async function addLayoutField(input: {
  section_id: string;
  field_config_id: string | null;
  field_key: string;
  column_position?: string;
  column_span?: string;
  source?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get max display_order for this section
    const { data: maxRow } = await admin
      .from(FIELDS)
      .select("display_order" as never)
      .eq("section_id" as never, input.section_id as never)
      .order("display_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextOrder =
      ((maxRow as unknown as { display_order: number } | null)?.display_order ?? -1) + 1;

    // Look up the field's module to determine source_object_key
    let sourceObjectKey: string | null = null;
    if (input.field_config_id) {
      const { data: fcRow } = await admin
        .from(FIELD_CFG)
        .select("module" as never)
        .eq("id" as never, input.field_config_id as never)
        .single();
      if (fcRow) {
        sourceObjectKey = MODULE_TO_SOURCE[(fcRow as unknown as { module: string }).module] ?? null;
      }
    }

    const { error } = await admin
      .from(FIELDS)
      .insert({
        section_id: input.section_id,
        field_config_id: input.field_config_id,
        field_key: input.field_key,
        display_order: nextOrder,
        column_position: input.column_position || "left",
        column_span: input.column_span || "half",
        is_visible: true,
        source: input.source || "native",
        source_object_key: sourceObjectKey,
      } as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Remove a field from a layout section
// ---------------------------------------------------------------------------

export async function removeLayoutField(fieldId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(FIELDS)
      .delete()
      .eq("id" as never, fieldId as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update visibility condition on a field
// ---------------------------------------------------------------------------

export async function updateFieldVisibilityCondition(
  fieldId: string,
  condition: VisibilityCondition | null
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(FIELD_CFG)
      .update({
        visibility_condition: condition,
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
// Tab mutations (tabs are stored as tab_* columns on page_layout_sections)
// ---------------------------------------------------------------------------

export async function addTab(input: {
  page_type: string;
  tab_key: string;
  tab_label: string;
  tab_icon?: string;
}): Promise<{ data?: PageSection; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Determine next tab_order
    const { data: maxRow } = await admin
      .from(SECTIONS)
      .select("tab_order" as never)
      .eq("page_type" as never, input.page_type as never)
      .order("tab_order" as never, { ascending: false })
      .limit(1)
      .single();

    const nextTabOrder =
      ((maxRow as unknown as { tab_order: number } | null)?.tab_order ?? -1) + 1;

    // Create an initial "fields" section inside the new tab
    const sectionKey = `${input.tab_key}_fields`;
    const { data, error } = await admin
      .from(SECTIONS)
      .insert({
        page_type: input.page_type,
        section_key: sectionKey,
        section_label: "Fields",
        section_icon: "file-text",
        display_order: 0,
        is_visible: true,
        is_locked: false,
        sidebar: false,
        section_type: "fields",
        tab_key: input.tab_key,
        tab_label: input.tab_label,
        tab_icon: input.tab_icon || "panel-right",
        tab_order: nextTabOrder,
        tab_locked: false,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: error.message };
    revalidate();
    return { data: data as unknown as PageSection };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function updateTab(
  pageType: string,
  tabKey: string,
  updates: { tab_label?: string; tab_icon?: string; tab_locked?: boolean }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from(SECTIONS)
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq("page_type" as never, pageType as never)
      .eq("tab_key" as never, tabKey as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function deleteTab(
  pageType: string,
  tabKey: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Verify tab is not locked
    const { data: sections } = await admin
      .from(SECTIONS)
      .select("tab_locked" as never)
      .eq("page_type" as never, pageType as never)
      .eq("tab_key" as never, tabKey as never)
      .limit(1)
      .single();

    if (sections && (sections as unknown as { tab_locked: boolean }).tab_locked) {
      return { error: "Cannot delete a locked tab" };
    }

    // Delete all sections in this tab (cascade deletes field assignments)
    const { error } = await admin
      .from(SECTIONS)
      .delete()
      .eq("page_type" as never, pageType as never)
      .eq("tab_key" as never, tabKey as never);

    if (error) return { error: error.message };
    revalidate();
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch pro forma templates
// ---------------------------------------------------------------------------

export interface ProFormaTemplate {
  id: string;
  name: string;
  visibility_condition: VisibilityCondition;
  columns: unknown[];
  sections: unknown[];
  is_active: boolean;
  sort_order: number;
}

const PRO_FORMA_TABLE = "pro_forma_template" as never;

export async function fetchProFormaTemplates(): Promise<{
  data?: ProFormaTemplate[];
  error?: string;
}> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(PRO_FORMA_TABLE)
      .select("*" as never)
      .order("sort_order" as never, { ascending: true });

    if (error) return { error: error.message };
    return { data: (data ?? []) as unknown as ProFormaTemplate[] };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
