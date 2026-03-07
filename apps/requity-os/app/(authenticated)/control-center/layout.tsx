import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ControlCenterSidebar } from "./_components/control-center-sidebar";

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
    <div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-64px)]">
      <ControlCenterSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
