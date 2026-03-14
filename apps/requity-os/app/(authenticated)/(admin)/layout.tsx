import { redirect } from "next/navigation";
import { getSessionData } from "@/lib/auth/session-cache";
import { getImpersonationState } from "@/lib/impersonation";

const ROLE_DASHBOARDS: Record<string, string> = {
  borrower: "/b/dashboard",
  investor: "/i/dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionData();
  if (!session) redirect("/login");

  const { allowedRoles, effectiveRole } = session;
  const impersonation = getImpersonationState();

  if (impersonation.isImpersonating && impersonation.targetRole) {
    if (impersonation.targetRole !== "admin" && impersonation.targetRole !== "super_admin") {
      redirect(ROLE_DASHBOARDS[impersonation.targetRole] || "/b/dashboard");
    }
  }

  if (!allowedRoles.includes("admin") && !allowedRoles.includes("super_admin")) {
    const dashboard = ROLE_DASHBOARDS[effectiveRole] || "/b/dashboard";
    redirect(dashboard);
  }

  return <>{children}</>;
}
