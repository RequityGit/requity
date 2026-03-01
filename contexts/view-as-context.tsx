"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ViewAsRole = "admin" | "investor" | "borrower" | null;

interface ViewAsContextType {
  /** The role being simulated, or null if not simulating */
  viewAsRole: ViewAsRole;
  /** Set the role to simulate */
  setViewAsRole: (role: ViewAsRole) => void;
  /** Whether the user is currently viewing as a different role */
  isViewingAs: boolean;
  /** Exit the view-as mode */
  exitViewAs: () => void;
  /** The effective role for navigation/UI (view-as role if set, otherwise actual role) */
  effectiveViewRole: string;
  /** Whether the current user is a super admin */
  isSuperAdmin: boolean;
}

const ViewAsContext = createContext<ViewAsContextType | null>(null);

export function ViewAsProvider({
  children,
  isSuperAdmin,
  actualRole,
}: {
  children: React.ReactNode;
  isSuperAdmin: boolean;
  actualRole: string;
}) {
  const [viewAsRole, setViewAsRoleState] = useState<ViewAsRole>(null);

  const setViewAsRole = useCallback((role: ViewAsRole) => {
    setViewAsRoleState(role);
  }, []);

  const exitViewAs = useCallback(() => {
    setViewAsRoleState(null);
  }, []);

  const isViewingAs = isSuperAdmin && viewAsRole !== null;
  const effectiveViewRole = isViewingAs ? viewAsRole! : actualRole;

  return (
    <ViewAsContext.Provider
      value={{
        viewAsRole,
        setViewAsRole,
        isViewingAs,
        exitViewAs,
        effectiveViewRole,
        isSuperAdmin,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (!context) {
    throw new Error("useViewAs must be used within a ViewAsProvider");
  }
  return context;
}
