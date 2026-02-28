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

  // Fetch templates with their items
  const { data: templates } = await supabase
    .from("condition_templates")
    .select("*, items:condition_template_items(*)")
    .order("loan_type")
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage condition templates and loan configuration"
      />
      <ConditionTemplateEditor
        templates={(templates ?? []).map((t: any) => ({
          ...t,
          items: (t.items ?? []).sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          ),
        }))}
        currentUserId={user.id}
      />
    </div>
  );
}
