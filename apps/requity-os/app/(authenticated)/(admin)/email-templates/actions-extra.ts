"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailTemplate } from "./types";
import { requireAdmin } from "@/lib/auth/require-admin";

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

    if (fetchErr)
      return { error: (fetchErr as { message: string }).message };
    if (!source) return { error: "Template not found" };

    const src = source as unknown as EmailTemplate;

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
        display_name: `${src.display_name} (Copy)`,
        slug: newSlug,
        subject_template: src.subject_template,
        html_body_template: src.html_body_template,
        text_body_template: src.text_body_template,
        available_variables: JSON.stringify(src.available_variables),
        preview_data: src.preview_data
          ? JSON.stringify(src.preview_data)
          : null,
        notification_type_id: src.notification_type_id,
        is_active: false,
      } as never)
      .select("*" as never)
      .single();

    if (error) return { error: (error as { message: string }).message };

    return { success: true, template: data as unknown as EmailTemplate };
  } catch (err: unknown) {
    console.error("duplicateTemplateAction error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
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
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
