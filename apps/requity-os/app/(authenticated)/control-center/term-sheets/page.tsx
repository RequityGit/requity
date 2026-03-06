import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TermSheetTemplateEditor } from "@/components/admin/term-sheet-template-editor";

export const dynamic = "force-dynamic";

export default async function ControlCenterTermSheetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: templates } = await supabase
    .from("term_sheet_templates")
    .select("*")
    .order("loan_type");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Term Sheet Templates</h2>
        <p className="text-sm text-muted-foreground">
          Configure how term sheets look for each loan type. Changes apply to
          all newly generated term sheets.
        </p>
      </div>

      <TermSheetTemplateEditor templates={(templates as any[]) ?? []} />
    </div>
  );
}
