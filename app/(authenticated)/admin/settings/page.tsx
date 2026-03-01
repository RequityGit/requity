import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ConditionTemplateEditor } from "@/components/admin/condition-template-editor";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight } from "lucide-react";

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

      {/* Settings sub-navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/settings/term-sheets">
          <Card className="hover:border-[#1a2b4a]/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-md bg-[#1a2b4a]/10 p-2">
                <FileText className="h-5 w-5 text-[#1a2b4a]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a2b4a]">Term Sheet Templates</p>
                <p className="text-xs text-muted-foreground">Configure term sheet layout &amp; branding</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <ConditionTemplateEditor
        templates={templates ?? []}
      />
    </div>
  );
}
