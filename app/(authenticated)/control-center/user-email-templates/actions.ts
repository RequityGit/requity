"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  UserEmailTemplate,
  UserEmailTemplateVersion,
  CreateUserEmailTemplateInput,
  UpdateUserEmailTemplateInput,
} from "@/lib/types/user-email-templates";

async function requireSuperAdmin(): Promise<
  { user: { id: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: role } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  if (!role) return { error: "Unauthorized — super admin required" };

  return { user };
}

// ---------------------------------------------------------------------------
// Fetch all user email templates
// ---------------------------------------------------------------------------

export async function fetchUserEmailTemplatesAction(): Promise<
  { success: true; templates: UserEmailTemplate[] } | { error: string }
> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_email_templates" as never)
      .select("*" as never)
      .order("sort_order" as never, { ascending: true } as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true, templates: (data ?? []) as unknown as UserEmailTemplate[] };
  } catch (err: unknown) {
    console.error("fetchUserEmailTemplatesAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch single template
// ---------------------------------------------------------------------------

export async function fetchUserEmailTemplateAction(
  id: string
): Promise<{ success: true; template: UserEmailTemplate } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_email_templates" as never)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as UserEmailTemplate };
  } catch (err: unknown) {
    console.error("fetchUserEmailTemplateAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Create template
// ---------------------------------------------------------------------------

export async function createUserEmailTemplateAction(
  input: CreateUserEmailTemplateInput
): Promise<{ success: true; template: UserEmailTemplate } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error || !auth.user) return { error: auth.error ?? "Not authenticated" };
    const userId = auth.user.id;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_email_templates" as never)
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        category: input.category,
        subject_template: input.subject_template,
        body_template: input.body_template,
        available_variables: input.available_variables,
        context: input.context ?? "any",
        is_default: input.is_default ?? false,
        sort_order: input.sort_order ?? 0,
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    // Create initial version record
    const template = data as unknown as UserEmailTemplate;
    await admin.from("user_email_template_versions" as never).insert({
      template_id: template.id,
      version: 1,
      subject_template: template.subject_template,
      body_template: template.body_template,
      available_variables: template.available_variables,
      changed_by: userId,
      change_notes: "Initial version",
    } as never);

    return { success: true, template };
  } catch (err: unknown) {
    console.error("createUserEmailTemplateAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update template (with automatic version snapshot)
// ---------------------------------------------------------------------------

export async function updateUserEmailTemplateAction(
  id: string,
  input: UpdateUserEmailTemplateInput,
  changeNotes?: string
): Promise<{ success: true; template: UserEmailTemplate } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error || !auth.user) return { error: auth.error ?? "Not authenticated" };
    const userId = auth.user.id;

    const admin = createAdminClient();

    // Fetch current template
    const { data: current, error: fetchErr } = await admin
      .from("user_email_templates" as never)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (fetchErr) return { error: (fetchErr as { message: string }).message };
    if (!current) return { error: "Template not found" };

    const cur = current as unknown as UserEmailTemplate;

    // Check if content changed (requiring version bump)
    const subjectChanged =
      input.subject_template !== undefined &&
      input.subject_template !== cur.subject_template;
    const bodyChanged =
      input.body_template !== undefined &&
      input.body_template !== cur.body_template;

    const nextVersion = subjectChanged || bodyChanged ? cur.version + 1 : cur.version;

    // Create version snapshot if content changed
    if (subjectChanged || bodyChanged) {
      await admin.from("user_email_template_versions" as never).insert({
        template_id: id,
        version: nextVersion,
        subject_template: input.subject_template ?? cur.subject_template,
        body_template: input.body_template ?? cur.body_template,
        available_variables: input.available_variables ?? cur.available_variables,
        changed_by: userId,
        change_notes: changeNotes ?? null,
      } as never);
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      updated_by: userId,
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.subject_template !== undefined) updateData.subject_template = input.subject_template;
    if (input.body_template !== undefined) updateData.body_template = input.body_template;
    if (input.available_variables !== undefined) updateData.available_variables = input.available_variables;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.is_default !== undefined) updateData.is_default = input.is_default;
    if (input.context !== undefined) updateData.context = input.context;
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
    if (subjectChanged || bodyChanged) updateData.version = nextVersion;

    const { data, error } = await admin
      .from("user_email_templates" as never)
      .update(updateData as never)
      .eq("id" as never, id as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as UserEmailTemplate };
  } catch (err: unknown) {
    console.error("updateUserEmailTemplateAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Delete template
// ---------------------------------------------------------------------------

export async function deleteUserEmailTemplateAction(
  id: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_email_templates" as never)
      .delete()
      .eq("id" as never, id as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteUserEmailTemplateAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Toggle active status
// ---------------------------------------------------------------------------

export async function toggleUserEmailTemplateActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error || !auth.user) return { error: auth.error ?? "Not authenticated" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_email_templates" as never)
      .update({ is_active: isActive, updated_by: auth.user.id } as never)
      .eq("id" as never, id as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true };
  } catch (err: unknown) {
    console.error("toggleUserEmailTemplateActiveAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Duplicate template
// ---------------------------------------------------------------------------

export async function duplicateUserEmailTemplateAction(
  id: string
): Promise<{ success: true; template: UserEmailTemplate } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error || !auth.user) return { error: auth.error ?? "Not authenticated" };
    const userId = auth.user.id;

    const admin = createAdminClient();
    const { data: original, error: fetchErr } = await admin
      .from("user_email_templates" as never)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (fetchErr) return { error: (fetchErr as { message: string }).message };
    if (!original) return { error: "Template not found" };

    const orig = original as unknown as UserEmailTemplate;

    const { data, error } = await admin
      .from("user_email_templates" as never)
      .insert({
        name: `${orig.name} (Copy)`,
        slug: `${orig.slug}_copy_${Date.now()}`,
        description: orig.description,
        category: orig.category,
        subject_template: orig.subject_template,
        body_template: orig.body_template,
        available_variables: orig.available_variables,
        context: orig.context,
        is_default: false,
        sort_order: orig.sort_order,
        is_active: false,
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as UserEmailTemplate };
  } catch (err: unknown) {
    console.error("duplicateUserEmailTemplateAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch version history
// ---------------------------------------------------------------------------

export async function fetchUserEmailTemplateVersionsAction(
  templateId: string
): Promise<{ success: true; versions: UserEmailTemplateVersion[] } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_email_template_versions" as never)
      .select("*" as never)
      .eq("template_id" as never, templateId as never)
      .order("version" as never, { ascending: false } as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true, versions: (data ?? []) as unknown as UserEmailTemplateVersion[] };
  } catch (err: unknown) {
    console.error("fetchUserEmailTemplateVersionsAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch usage stats for a template
// ---------------------------------------------------------------------------

export async function fetchUserEmailTemplateUsageAction(
  templateId: string
): Promise<
  | {
      success: true;
      total: number;
      last30Days: number;
      last7Days: number;
    }
  | { error: string }
> {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalResult, thirtyDayResult, sevenDayResult] = await Promise.all([
      admin
        .from("user_email_sends" as never)
        .select("*" as never, { count: "exact" as never, head: true } as never)
        .eq("template_id" as never, templateId as never),
      admin
        .from("user_email_sends" as never)
        .select("*" as never, { count: "exact" as never, head: true } as never)
        .eq("template_id" as never, templateId as never)
        .gte("created_at" as never, thirtyDaysAgo as never),
      admin
        .from("user_email_sends" as never)
        .select("*" as never, { count: "exact" as never, head: true } as never)
        .eq("template_id" as never, templateId as never)
        .gte("created_at" as never, sevenDaysAgo as never),
    ]);

    return {
      success: true,
      total: (totalResult as { count: number | null }).count ?? 0,
      last30Days: (thirtyDayResult as { count: number | null }).count ?? 0,
      last7Days: (sevenDayResult as { count: number | null }).count ?? 0,
    };
  } catch (err: unknown) {
    console.error("fetchUserEmailTemplateUsageAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
