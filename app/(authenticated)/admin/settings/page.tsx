import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ConditionTemplateEditor } from "@/components/admin/condition-template-editor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch condition templates (flat table)
  const { data: templates } = await supabase
    .from("loan_condition_templates")
    .select("*")
    .order("category")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage condition templates and loan configuration"
      />
      <ConditionTemplateEditor
        templates={templates ?? []}
      />
    </div>
  );
}
