"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EmailTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "./types";
import { requireAdmin } from "./require-admin";

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
    if (auth.error || !auth.user) return { error: auth.error ?? "Not authenticated" };
    const userId = auth.user.id;

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
        changed_by: userId,
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
