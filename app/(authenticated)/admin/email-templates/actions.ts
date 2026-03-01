"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EmailTemplate,
  EmailTemplateVersion,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  { user: { id: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin")
    return { error: "Unauthorized" };

  return { user };
}

// ---------------------------------------------------------------------------
// Fetch all templates
// ---------------------------------------------------------------------------

export async function fetchTemplatesAction(): Promise<
  { success: true; templates: EmailTemplate[] } | { error: string }
> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_templates" as never)
      .select("*" as never)
      .order("created_at" as never, { ascending: false } as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true, templates: (data ?? []) as unknown as EmailTemplate[] };
  } catch (err: unknown) {
    console.error("fetchTemplatesAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Fetch single template
// ---------------------------------------------------------------------------

export async function fetchTemplateAction(
  id: string
): Promise<{ success: true; template: EmailTemplate } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_templates" as never)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as EmailTemplate };
  } catch (err: unknown) {
    console.error("fetchTemplateAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Create template
// ---------------------------------------------------------------------------

export async function createTemplateAction(
  input: CreateTemplateInput
): Promise<{ success: true; template: EmailTemplate } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_templates" as never)
      .insert({
        name: input.name,
        slug: input.slug,
        subject: input.subject,
        category: input.category,
        html_body: input.html_body,
        variables: JSON.stringify(input.variables),
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as EmailTemplate };
  } catch (err: unknown) {
    console.error("createTemplateAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Update template (with automatic version snapshot)
// ---------------------------------------------------------------------------

export async function updateTemplateAction(
  id: string,
  input: UpdateTemplateInput
): Promise<{ success: true; template: EmailTemplate } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();

    // Fetch current template to snapshot before updating
    const { data: current, error: fetchErr } = await admin
      .from("email_templates" as never)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (fetchErr) return { error: (fetchErr as { message: string }).message };
    if (!current) return { error: "Template not found" };

    const cur = current as unknown as EmailTemplate;

    // Only snapshot if subject or body changed
    const subjectChanged = input.subject !== undefined && input.subject !== cur.subject;
    const bodyChanged = input.html_body !== undefined && input.html_body !== cur.html_body;

    if (subjectChanged || bodyChanged) {
      // Get next version number
      const { data: lastVersion } = await admin
        .from("email_template_versions" as never)
        .select("version_number" as never)
        .eq("template_id" as never, id as never)
        .order("version_number" as never, { descending: true } as never)
        .limit(1)
        .single();

      const nextVersion =
        ((lastVersion as unknown as { version_number: number } | null)?.version_number ?? 0) + 1;

      await admin.from("email_template_versions" as never).insert({
        template_id: id,
        version_number: nextVersion,
        subject: cur.subject,
        html_body: cur.html_body,
        changed_by: auth.user.id,
      } as never);
    }

    // Build update payload (only set provided fields)
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.subject !== undefined) updateData.subject = input.subject;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.html_body !== undefined) updateData.html_body = input.html_body;
    if (input.variables !== undefined) updateData.variables = JSON.stringify(input.variables);
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await admin
      .from("email_templates" as never)
      .update(updateData as never)
      .eq("id" as never, id as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as EmailTemplate };
  } catch (err: unknown) {
    console.error("updateTemplateAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Delete template
// ---------------------------------------------------------------------------

export async function deleteTemplateAction(
  id: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("email_templates" as never)
      .delete()
      .eq("id" as never, id as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteTemplateAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Duplicate template
// ---------------------------------------------------------------------------

export async function duplicateTemplateAction(
  id: string
): Promise<{ success: true; template: EmailTemplate } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data: source, error: fetchErr } = await admin
      .from("email_templates" as never)
      .select("*" as never)
      .eq("id" as never, id as never)
      .single();

    if (fetchErr) return { error: (fetchErr as { message: string }).message };
    if (!source) return { error: "Template not found" };

    const src = source as unknown as EmailTemplate;

    // Generate a unique slug by appending -copy and optional number
    let newSlug = `${src.slug}-copy`;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await admin
        .from("email_templates" as never)
        .select("id" as never)
        .eq("slug" as never, newSlug as never)
        .single();
      if (!existing) break;
      suffix++;
      newSlug = `${src.slug}-copy-${suffix}`;
    }

    const { data, error } = await admin
      .from("email_templates" as never)
      .insert({
        name: `${src.name} (Copy)`,
        slug: newSlug,
        subject: src.subject,
        category: src.category,
        html_body: src.html_body,
        variables: JSON.stringify(src.variables),
        is_active: false,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as EmailTemplate };
  } catch (err: unknown) {
    console.error("duplicateTemplateAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Toggle active/inactive
// ---------------------------------------------------------------------------

export async function toggleTemplateActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("email_templates" as never)
      .update({ is_active: isActive } as never)
      .eq("id" as never, id as never);

    if (error) return { error: (error as { message: string }).message };

    return { success: true };
  } catch (err: unknown) {
    console.error("toggleTemplateActiveAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Fetch version history for a template
// ---------------------------------------------------------------------------

export async function fetchTemplateVersionsAction(
  templateId: string
): Promise<
  { success: true; versions: EmailTemplateVersion[] } | { error: string }
> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_template_versions" as never)
      .select("*" as never)
      .eq("template_id" as never, templateId as never)
      .order("version_number" as never, { descending: true } as never);

    if (error) return { error: (error as { message: string }).message };

    return {
      success: true,
      versions: (data ?? []) as unknown as EmailTemplateVersion[],
    };
  } catch (err: unknown) {
    console.error("fetchTemplateVersionsAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
