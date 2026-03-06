import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { FieldManagerView } from "./FieldManagerView";

export const dynamic = "force-dynamic";

export default async function FieldManagerPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check super_admin role
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .single();

  if (!superAdminRole) redirect("/admin/dashboard");

  // Fetch initial field configurations
  const { data: fieldConfigs } = await supabase
    .from("field_configurations")
    .select("*")
    .order("module")
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Manager"
        description="Configure field visibility and ordering across deal detail modules"
      />
      <FieldManagerView initialConfigs={fieldConfigs ?? []} />
    </div>
  );
}
