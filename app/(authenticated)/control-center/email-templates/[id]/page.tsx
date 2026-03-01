import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/admin/email-templates/template-editor";
import {
  fetchTemplateAction,
  fetchTemplateVersionsAction,
} from "@/app/(authenticated)/admin/email-templates/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ControlCenterEmailTemplateDetailPage({
  params,
}: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [templateResult, versionsResult] = await Promise.all([
    fetchTemplateAction(id),
    fetchTemplateVersionsAction(id),
  ]);

  if ("error" in templateResult) {
    redirect("/control-center/email-templates");
  }

  const versions =
    "success" in versionsResult ? versionsResult.versions : [];

  return (
    <div>
      <TemplateEditor
        template={templateResult.template}
        versions={versions}
      />
    </div>
  );
}
