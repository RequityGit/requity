import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ControlCenterTabs } from "@/components/control-center/control-center-tabs";

export const dynamic = "force-dynamic";

export default async function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check super_admin role from user_roles table
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .single();

  if (!superAdminRole) redirect("/admin/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Center"
        description="System configuration and administration"
      />
      <ControlCenterTabs />
      <div>{children}</div>
    </div>
  );
}
