"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";

type TemplateTypeEnum = Database["public"]["Enums"]["template_type_enum"];
type RecordTypeEnum = Database["public"]["Enums"]["record_type_enum"];

export type MergeField = {
  key: string;
  label: string;
  source: string;
  column: string;
  format?: string | null;
};

export type SignatureRole = {
  role: string;
  name_source: string;
  email_source: string;
  order: number;
};

export type TemplateFormData = {
  name: string;
  template_type: string;
  record_type: string;
  description: string;
  requires_signature: boolean;
  merge_fields: MergeField[];
  signature_roles: SignatureRole[];
};

export async function createTemplate(data: TemplateFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("document_templates").insert({
    name: data.name,
    template_type: data.template_type as TemplateTypeEnum,
    record_type: data.record_type as RecordTypeEnum,
    description: data.description || null,
    requires_signature: data.requires_signature,
    merge_fields: data.merge_fields,
    signature_roles: data.requires_signature ? data.signature_roles : null,
    created_by: user.id,
  });

  if (error) {
    console.error("Failed to create template:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

export async function updateTemplate(id: string, data: TemplateFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("document_templates")
    .update({
      name: data.name,
      template_type: data.template_type as TemplateTypeEnum,
      record_type: data.record_type as RecordTypeEnum,
      description: data.description || null,
      requires_signature: data.requires_signature,
      merge_fields: data.merge_fields,
      signature_roles: data.requires_signature ? data.signature_roles : null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update template:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

export async function toggleTemplateActive(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("document_templates")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Failed to toggle template:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

export async function duplicateTemplate(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: original, error: fetchError } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) return { error: "Template not found" };

  const { error } = await supabase.from("document_templates").insert({
    name: `${original.name} (Copy)`,
    template_type: original.template_type,
    record_type: original.record_type,
    description: original.description,
    merge_fields: original.merge_fields,
    requires_signature: original.requires_signature,
    signature_roles: original.signature_roles,
    created_by: user.id,
  });

  if (error) {
    console.error("Failed to duplicate template:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

export async function saveTemplateContent(id: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("document_templates")
    .update({ content })
    .eq("id", id);

  if (error) {
    console.error("Failed to save template content:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

const DEFAULT_STYLED_LAYOUT = {
  header: {
    entity: "Requity Lending, LLC",
    subtitle: "",
    address: "4023 N Armenia Ave, Ste 300, Tampa, FL 33607",
    phone: "(813) 535-7535",
    email: "lending@requitygroup.com",
    website: "requitylending.com",
    show_logo: true,
  },
  title_banner: {
    title: "",
    subtitle: "",
  },
  sections: [],
  footer: {
    entity: "Requity Lending, LLC",
    nmls: "2560918",
    confidential: true,
    generated_by: "Generated via RequityOS",
  },
};

export async function enableLayoutEditor(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("document_templates")
    .update({
      styled_layout: DEFAULT_STYLED_LAYOUT,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", id);

  if (error) {
    console.error("Failed to enable layout editor:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

export async function disableLayoutEditor(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("document_templates")
    .update({
      styled_layout: null,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", id);

  if (error) {
    console.error("Failed to disable layout editor:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("document_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete template:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/document-templates");
  return { success: true };
}
