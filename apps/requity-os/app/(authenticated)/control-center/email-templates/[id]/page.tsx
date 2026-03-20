import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/components/admin/email-templates/template-editor";
import {
  fetchTemplateAction,
  fetchTemplateVersionsAction,
} from "@/app/(authenticated)/(admin)/email-templates/actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ControlCenterEmailTemplateDetailPage({
  params,
}: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const templateResult = await fetchTemplateAction(id);

  if ("error" in templateResult) {
    redirect("/control-center/email-templates");
  }

  const versionsResult = await fetchTemplateVersionsAction(id);
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
