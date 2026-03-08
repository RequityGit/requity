import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumentTemplatesView } from "./document-templates-view";

export const dynamic = "force-dynamic";

export default async function DocumentTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: templates } = await supabase
    .from("document_templates")
    .select("*")
    .order("template_type")
    .order("name");

  // Cast JSONB fields from generic Json to specific types
  const typedTemplates = (templates ?? []).map((t) => ({
    ...t,
    merge_fields: (t.merge_fields ?? []) as Array<{
      key: string;
      label: string;
      source: string;
      column: string;
      format?: string | null;
    }>,
    signature_roles: t.signature_roles as Array<{
      role: string;
      name_source: string;
      email_source: string;
      order: number;
    }> | null,
  }));

  return <DocumentTemplatesView templates={typedTemplates} />;
}
