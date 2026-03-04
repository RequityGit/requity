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
import { ActivityTrackerProvider } from "@/components/tracking/ActivityTracker";
import { MobileLayoutWrapper } from "@/components/layout/mobile-layout-wrapper";
import { ModuleAccessProvider } from "@/contexts/module-access-context";
import { ModuleGuard } from "@/components/layout/module-guard";
import { SoftphoneWrapper } from "@/components/softphone/SoftphoneWrapper";

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

  // Fetch user's module access for sidebar filtering
  const { data: userModuleAccess } = await supabase
    .from("user_module_access")
    .select("module_id, modules(name)")
    .eq("user_id", user.id);

  const accessibleModules: string[] = isSuperAdmin
    ? [] // empty means "all" for super admins (fail-safe)
    : (userModuleAccess ?? [])
        .map((ma) => {
          const mod = ma.modules as unknown as { name: string } | null;
          return mod?.name ?? "";
        })
        .filter(Boolean);

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
        <ModuleAccessProvider
          accessibleModules={accessibleModules}
          isSuperAdmin={isSuperAdmin}
        >
          <MobileLayoutWrapper
            role={sidebarRole}
            isSuperAdmin={isSuperAdmin && !impersonation.isImpersonating}
            userId={user.id}
            accessibleModules={accessibleModules}
          >
            {(() => {
              const isAdmin = effectiveRole === "admin" || effectiveRole === "super_admin";
              const innerContent = (
                <div className="flex flex-col h-screen overflow-hidden">
                  <ImpersonationBanner />
                  <div className="flex flex-1 overflow-hidden">
                    {/* Desktop sidebar - hidden on mobile */}
                    <div className="hidden md:block">
                      <Sidebar
                        role={sidebarRole}
                        isSuperAdmin={isSuperAdmin && !impersonation.isImpersonating}
                        accessibleModules={accessibleModules}
                      />
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Topbar
                        userName={profile.full_name || ""}
                        role={effectiveRole}
                        email={profile.email ?? ""}
                        allowedRoles={allowedRoles}
                        userId={user.id}
                        isSuperAdmin={isSuperAdmin}
                        avatarUrl={profile.avatar_url}
                      />
                      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 pb-20 md:pb-6">
                        <ActivityTrackerProvider role={effectiveRole}>
                          <ModuleGuard>
                            {children}
                          </ModuleGuard>
                        </ActivityTrackerProvider>
                      </main>
                    </div>
                  </div>
                  <Toaster />
                </div>
              );
              return isAdmin ? (
                <SoftphoneWrapper>{innerContent}</SoftphoneWrapper>
              ) : (
                innerContent
              );
            })()}
          </MobileLayoutWrapper>
        </ModuleAccessProvider>
      </ViewAsProvider>
    </ImpersonationProvider>
  );
}
