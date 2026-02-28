"use client";

import { useRoles, type AppRole } from "@/providers/role-provider";
import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, Landmark, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ROLE_META: Record<
  AppRole,
  { label: string; icon: LucideIcon }
> = {
  super_admin: { label: "Admin", icon: ShieldCheck },
  admin: { label: "Admin", icon: Shield },
  investor: { label: "Investor", icon: Landmark },
  borrower: { label: "Borrower", icon: Home },
};

export function RoleSwitcher() {
  const { roles, activeRole, setActiveRole } = useRoles();

  if (roles.length <= 1) return null;

  return (
    <>
      {/* Desktop: segmented control */}
      <div className="hidden md:flex items-center bg-navy-deep rounded-md p-0.5">
        {roles.map((userRole) => {
          const meta = ROLE_META[userRole.role];
          if (!meta) return null;
          const isActive = activeRole === userRole.role;
          const Icon = meta.icon;

          return (
            <button
              key={userRole.role}
              onClick={() => setActiveRole(userRole.role)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-semibold transition-all",
                isActive
                  ? "bg-navy-mid text-gold shadow-sm"
                  : "text-surface-muted hover:text-surface-gray"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Mobile: full-width dropdown */}
      <div className="md:hidden w-full px-4 pb-2">
        <select
          value={activeRole || ""}
          onChange={(e) => setActiveRole(e.target.value as AppRole)}
          className="w-full bg-navy-deep border border-navy-light rounded-md px-3 py-2 text-sm font-body text-surface-white focus:outline-none focus:ring-2 focus:ring-gold/30"
        >
          {roles.map((userRole) => {
            const meta = ROLE_META[userRole.role];
            return (
              <option key={userRole.role} value={userRole.role}>
                {meta?.label || userRole.role}
              </option>
            );
          })}
        </select>
      </div>
    </>
  );
}
