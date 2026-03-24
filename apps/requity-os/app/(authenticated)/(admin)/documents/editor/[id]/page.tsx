import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditorPageClient } from "./editor-page-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentEditorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch generated document with template info
  const { data: doc, error } = await supabase
    .from("generated_documents")
    .select("*, document_templates(*)")
    .eq("id", id)
    .single();

  if (error || !doc) notFound();

  const template = (doc as Record<string, unknown>).document_templates as Record<string, unknown> | null;
  const styledLayout = template?.styled_layout as Record<string, unknown> | null;

  // Get the generating user's name and current user's profile
  const [{ data: generatorProfile }, { data: currentProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", doc.generated_by)
      .single(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100vh-64px)]">
      <EditorPageClient
        documentId={doc.id}
        fileName={doc.file_name}
        status={doc.status}
        initialContent={doc.content ?? ""}
        mergeData={doc.merge_data_snapshot as Record<string, string>}
        templateName={(template?.name as string) ?? ""}
        templateVersion={doc.template_version}
        templateId={doc.template_id}
        recordType={doc.record_type}
        recordId={doc.record_id}
        mergeFields={
          (template?.merge_fields as Array<{
            key: string;
            label: string;
            source: string;
            column: string;
            format?: string | null;
          }>) ?? []
        }
        generatedBy={generatorProfile?.full_name ?? "Unknown"}
        generatedAt={doc.generated_at}
        currentUserId={user.id}
        currentUserName={currentProfile?.full_name ?? undefined}
        styledLayout={styledLayout}
      />
    </div>
  );
}
