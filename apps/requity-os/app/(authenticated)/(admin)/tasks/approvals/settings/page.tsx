import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RoutingRulesManager } from "@/components/approvals/routing-rules-manager";

export const dynamic = "force-dynamic";

export default async function ApprovalSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify super admin
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isSuperAdmin = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");
  if (!isSuperAdmin) redirect("/tasks/approvals");

  const admin = createAdminClient();

  // Fetch routing rules
  const { data: rules } = await admin
    .from("approval_routing_rules" as any)
    .select("*")
    .order("priority_order", { ascending: true });

  // Fetch team members for approver selection
  const { data: members } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .order("full_name");

  const teamMembers = (members ?? []).map((m: any) => ({
    id: m.id,
    full_name: m.full_name || m.email || "Unknown",
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Approval Settings"
        description="Configure routing rules, checklists, and SLA settings."
        action={
          <Link href="/tasks/approvals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Approvals
            </Button>
          </Link>
        }
      />

      <RoutingRulesManager
        rules={(rules ?? []) as any[]}
        teamMembers={teamMembers}
      />
    </div>
  );
}
