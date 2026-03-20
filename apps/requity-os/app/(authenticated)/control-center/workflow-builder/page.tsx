import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkflowBuilderShell } from "@/components/admin/workflow-builder/workflow-builder-shell";

export const dynamic = "force-dynamic";

export default async function WorkflowBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all workflow definitions with stages and rules
  const [workflowsRes, stagesRes, rulesRes] = await Promise.all([
    supabase
      .from("workflow_definitions")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("workflow_stages")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("workflow_rules")
      .select("*")
      .order("execution_order", { ascending: true }),
  ]);

  return (
    <WorkflowBuilderShell
      initialWorkflows={workflowsRes.data ?? []}
      initialStages={stagesRes.data ?? []}
      initialRules={rulesRes.data ?? []}
    />
  );
}
