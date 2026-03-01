import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { TermSheetTemplateEditor } from "@/components/admin/term-sheet-template-editor";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TermSheetTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify super_admin role
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  if (!superAdminRole) redirect("/admin/dashboard");

  const { data: templates } = await supabase
    .from("term_sheet_templates")
    .select("*")
    .order("loan_type");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Term Sheet Templates"
        description="Configure how term sheets look for each loan type. Changes apply to all newly generated term sheets."
      />

      <TermSheetTemplateEditor templates={(templates as any[]) ?? []} />
    </div>
  );
}
