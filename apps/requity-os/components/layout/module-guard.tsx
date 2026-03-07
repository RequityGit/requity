"use client";

import { usePathname, useRouter } from "next/navigation";
import { useModuleAccess } from "@/contexts/module-access-context";
import { useEffect } from "react";

/**
 * Maps route path prefixes to module names.
 * Used to determine which module a page belongs to for access control.
 */
const ROUTE_TO_MODULE: Record<string, string> = {
  "/admin/dashboard": "dashboard",
  "/admin/crm": "crm",
  "/admin/investors": "crm",
  "/admin/borrowers": "crm",
  "/admin/pipeline": "pipeline",
  "/admin/originations": "pipeline",
  "/admin/loans": "pipeline",
  "/admin/conditions": "pipeline",
  "/admin/pricing": "pipeline",
  "/admin/dscr": "dscr-pricing",
  "/admin/models": "models",
  "/admin/servicing": "servicing",
  "/admin/funds": "investments",
  "/admin/capital-calls": "investments",
  "/admin/distributions": "investments",
  "/admin/document-center": "documents",
  "/admin/documents": "documents",
  "/admin/operations": "operations",
  "/sops": "knowledge-base",
  "/control-center": "control-center",
};

function getModuleForPath(pathname: string): string | null {
  // Check exact match first, then prefix match
  for (const [prefix, moduleName] of Object.entries(ROUTE_TO_MODULE)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return moduleName;
    }
  }
  return null;
}

export function ModuleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasModuleAccess, isSuperAdmin } = useModuleAccess();

  useEffect(() => {
    // Super admins always have access
    if (isSuperAdmin) return;

    const moduleName = getModuleForPath(pathname);
    if (moduleName && !hasModuleAccess(moduleName)) {
      // Redirect to dashboard if user doesn't have access to this module
      router.replace("/admin/dashboard");
    }
  }, [pathname, hasModuleAccess, isSuperAdmin, router]);

  return <>{children}</>;
}
