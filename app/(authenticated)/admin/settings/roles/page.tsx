import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoleManagementClient } from "./client";

export const dynamic = "force-dynamic";

export default async function RoleManagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user is super_admin
  const { data: isSuperAdmin } = await (supabase as any).rpc("is_super_admin");
  if (!isSuperAdmin) redirect("/admin");

  // Fetch all user roles with profile info
  const { data: userRoles } = await (supabase as any)
    .from("user_roles")
    .select("*")
    .order("granted_at", { ascending: false });

  // Fetch profiles for display names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  return (
    <RoleManagementClient
      userRoles={userRoles ?? []}
      profiles={profiles ?? []}
      currentUserId={user.id}
    />
  );
}
