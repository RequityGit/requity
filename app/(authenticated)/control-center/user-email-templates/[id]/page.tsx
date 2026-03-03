import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditorPage } from "@/components/control-center/user-email-templates/TemplateEditor";
import {
  fetchUserEmailTemplateAction,
  fetchUserEmailTemplateVersionsAction,
} from "../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function UserEmailTemplateEditPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  // For "new" templates, show an empty editor
  if (id === "new") {
    return <TemplateEditorPage template={null} versions={[]} />;
  }

  const [templateResult, versionsResult] = await Promise.all([
    fetchUserEmailTemplateAction(id),
    fetchUserEmailTemplateVersionsAction(id),
  ]);

  if ("error" in templateResult) notFound();

  const versions = "success" in versionsResult ? versionsResult.versions : [];

  return (
    <TemplateEditorPage
      template={templateResult.template}
      versions={versions}
    />
  );
}
