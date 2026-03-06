import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateList } from "@/components/admin/email-templates/template-list";
import { CreateTemplateDialog } from "@/components/admin/email-templates/create-template-dialog";
import { fetchTemplatesAction } from "@/app/(authenticated)/admin/email-templates/actions";

export const dynamic = "force-dynamic";

export default async function ControlCenterEmailTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await fetchTemplatesAction();
  const templates = "success" in result ? result.templates : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Email Templates</h2>
          <p className="text-sm text-muted-foreground">
            Manage email templates used across the platform.
          </p>
        </div>
        <CreateTemplateDialog />
      </div>
      <TemplateList templates={templates} />
    </div>
  );
}
