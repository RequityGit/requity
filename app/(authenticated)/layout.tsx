import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/toaster";

// Never statically generate authenticated pages
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Determine effective role from cookie, falling back to profile default
  const cookieStore = cookies();
  const activeRoleCookie = cookieStore.get("active_role")?.value;
  const allowedRoles: string[] = profile.allowed_roles?.length
    ? (profile.allowed_roles.filter(Boolean) as string[])
    : [profile.role].filter(Boolean) as string[];

  const effectiveRole =
    activeRoleCookie && allowedRoles.includes(activeRoleCookie)
      ? activeRoleCookie
      : (profile.role ?? "borrower");

  // Check if user has super_admin role for Control Center access
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  const isSuperAdmin = !!superAdminRole;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={effectiveRole} isSuperAdmin={isSuperAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          userName={profile.full_name || ""}
          role={effectiveRole}
          email={profile.email ?? ""}
          allowedRoles={allowedRoles}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
