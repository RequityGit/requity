"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailTemplate, EmailTemplateVersion } from "./types";
import { requireAdmin } from "./require-admin";

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

