import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ControlCenterBreadcrumb } from "./_components/control-center-breadcrumb";

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

  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .single();

  if (!superAdminRole) redirect("/admin/dashboard");

  return (
    <div>
      <ControlCenterBreadcrumb />
      {children}
    </div>
  );
}
