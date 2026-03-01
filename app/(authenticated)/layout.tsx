import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/toaster";
import { ViewAsProvider } from "@/contexts/view-as-context";
import { ImpersonationProvider } from "@/components/layout/impersonation-context";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { getImpersonationState } from "@/lib/impersonation";

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

  // Check impersonation state
  const impersonation = getImpersonationState();

  // When impersonating, override the sidebar role to match the impersonated user's role
  const sidebarRole = impersonation.isImpersonating && impersonation.targetRole
    ? impersonation.targetRole
    : effectiveRole;

  return (
    <ImpersonationProvider
      initialState={impersonation}
      isSuperAdmin={isSuperAdmin}
    >
      <ViewAsProvider isSuperAdmin={isSuperAdmin} actualRole={effectiveRole}>
        <div className="flex flex-col h-screen overflow-hidden">
          <ImpersonationBanner />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              role={sidebarRole}
              isSuperAdmin={isSuperAdmin && !impersonation.isImpersonating}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Topbar
                userName={profile.full_name || ""}
                role={effectiveRole}
                email={profile.email ?? ""}
                allowedRoles={allowedRoles}
                userId={user.id}
                isSuperAdmin={isSuperAdmin}
              />
              <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </div>
      </ViewAsProvider>
    </ImpersonationProvider>
  );
}
