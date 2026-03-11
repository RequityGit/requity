import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TemplateEditorClient } from "./template-editor-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: template, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !template) notFound();

  const mergeFields = (template.merge_fields as Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>) ?? [];

  const styledLayout = (template as Record<string, unknown>).styled_layout as Record<string, unknown> | null;

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100vh-64px)]">
      <TemplateEditorClient
        templateId={template.id}
        templateName={template.name}
        templateType={template.template_type}
        recordType={template.record_type}
        version={template.version}
        isActive={template.is_active}
        initialContent={template.content ?? ""}
        mergeFields={mergeFields}
        styledLayout={styledLayout}
      />
    </div>
  );
}
