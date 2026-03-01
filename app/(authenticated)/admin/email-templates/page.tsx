import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateList } from "@/components/admin/email-templates/template-list";
import { CreateTemplateDialog } from "@/components/admin/email-templates/create-template-dialog";
import { fetchTemplatesAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await fetchTemplatesAction();
  const templates = "success" in result ? result.templates : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Manage email templates used across the platform."
        action={<CreateTemplateDialog />}
      />
      <TemplateList templates={templates} />
    </div>
  );
}
