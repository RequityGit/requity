"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSupabase } from "./supabase-provider";

export type AppRole = "super_admin" | "admin" | "investor" | "borrower";

export interface UserRole {
  role: AppRole;
  investor_id?: string | null;
  borrower_id?: string | null;
}

interface RoleContextType {
  roles: UserRole[];
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  activeInvestorId: string | null;
  activeBorrowerId: string | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ACTIVE_ROLE_KEY = "requity_active_role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveRole = useCallback(
    (role: AppRole) => {
      setActiveRoleState(role);
      try {
        localStorage.setItem(ACTIVE_ROLE_KEY, role);
      } catch {
        // localStorage unavailable
      }
    },
    []
  );

  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data, error } = await (supabase as any).rpc("get_my_roles");

        if (error || !data) {
          setIsLoading(false);
          return;
        }

        const userRoles = (data as UserRole[]) || [];
        setRoles(userRoles);

        // Restore active role from localStorage
        let savedRole: string | null = null;
        try {
          savedRole = localStorage.getItem(ACTIVE_ROLE_KEY);
        } catch {
          // localStorage unavailable
        }

        if (
          savedRole &&
          userRoles.some((r) => r.role === savedRole)
        ) {
          setActiveRoleState(savedRole as AppRole);
        } else if (userRoles.length === 1) {
          setActiveRole(userRoles[0].role);
        }
        // If multiple roles and no saved role, activeRole stays null → show role hub
      } catch {
        // RPC not available, fall back
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoles();
  }, [supabase, setActiveRole]);

  const isAdmin = roles.some(
    (r) => r.role === "admin" || r.role === "super_admin"
  );
  const isSuperAdmin = roles.some((r) => r.role === "super_admin");

  const activeRoleData = roles.find((r) => r.role === activeRole);
  const activeInvestorId = activeRoleData?.investor_id ?? null;
  const activeBorrowerId = activeRoleData?.borrower_id ?? null;

  return (
    <RoleContext.Provider
      value={{
        roles,
        activeRole,
        setActiveRole,
        isAdmin,
        isSuperAdmin,
        isLoading,
        activeInvestorId,
        activeBorrowerId,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRoles() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRoles must be used within a RoleProvider");
  }
  return context;
}
