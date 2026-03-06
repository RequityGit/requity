"use client";

import { createContext, useContext, ReactNode } from "react";

interface ModuleAccessContextValue {
  /** Module names the user has access to. Empty array for super admins means "all". */
  accessibleModules: string[];
  /** Whether the current user is a super admin (always has full access). */
  isSuperAdmin: boolean;
  /** Check if the user has access to a specific module by name. */
  hasModuleAccess: (moduleName: string) => boolean;
}

const ModuleAccessContext = createContext<ModuleAccessContextValue>({
  accessibleModules: [],
  isSuperAdmin: false,
  hasModuleAccess: () => false,
});

export function ModuleAccessProvider({
  accessibleModules,
  isSuperAdmin,
  children,
}: {
  accessibleModules: string[];
  isSuperAdmin: boolean;
  children: ReactNode;
}) {
  function hasModuleAccess(moduleName: string): boolean {
    if (isSuperAdmin) return true;
    return accessibleModules.includes(moduleName);
  }

  return (
    <ModuleAccessContext.Provider
      value={{ accessibleModules, isSuperAdmin, hasModuleAccess }}
    >
      {children}
    </ModuleAccessContext.Provider>
  );
}

export function useModuleAccess() {
  return useContext(ModuleAccessContext);
}
