import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ViewAsProvider } from "@/contexts/view-as-context";
import { ImpersonationProvider } from "@/components/layout/impersonation-context";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { getImpersonationState } from "@/lib/impersonation";
import { ActivityTrackerProvider } from "@/components/tracking/ActivityTracker";
import { MobileLayoutWrapper } from "@/components/layout/mobile-layout-wrapper";
import { ModuleAccessProvider } from "@/contexts/module-access-context";
import { ModuleGuard } from "@/components/layout/module-guard";
import { SoftphoneWrapper } from "@/components/softphone/SoftphoneWrapper";
import { getSessionData } from "@/lib/auth/session-cache";

// Never statically generate authenticated pages
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionData();

  if (!session) {
    redirect("/login");
  }

  const { user, profile, isSuperAdmin, effectiveRole, accessibleModules, allowedRoles } = session;

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
                        userName={(profile.full_name as string) || ""}
                        role={effectiveRole}
                        email={(profile.email as string) ?? ""}
                        allowedRoles={allowedRoles}
                        userId={user.id}
                        isSuperAdmin={isSuperAdmin}
                        avatarUrl={profile.avatar_url as string | undefined}
                      />
                      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
                        <ActivityTrackerProvider role={effectiveRole}>
                          <ModuleGuard>
                            {children}
                          </ModuleGuard>
                        </ActivityTrackerProvider>
                      </main>
                    </div>
                  </div>
                  <Toaster />
                  <SonnerToaster richColors closeButton />
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
