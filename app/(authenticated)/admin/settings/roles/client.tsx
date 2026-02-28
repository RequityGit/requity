"use client";

import { useState } from "react";
import { useSupabase } from "@/providers/supabase-provider";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import {
  Shield,
  ShieldCheck,
  Landmark,
  Home,
  UserPlus,
  Loader2,
} from "lucide-react";

type AppRole = "super_admin" | "admin" | "investor" | "borrower";

interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
  investor_id: string | null;
  borrower_id: string | null;
  granted_by: string | null;
  granted_at: string;
  is_active: boolean;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  super_admin: ShieldCheck,
  admin: Shield,
  investor: Landmark,
  borrower: Home,
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  investor: "Investor",
  borrower: "Borrower",
};

export function RoleManagementClient({
  userRoles: initialRoles,
  profiles,
  currentUserId,
}: {
  userRoles: UserRoleRow[];
  profiles: ProfileRow[];
  currentUserId: string;
}) {
  const supabase = useSupabase();
  const [userRoles, setUserRoles] = useState(initialRoles);
  const [showGrant, setShowGrant] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantRole, setGrantRole] = useState<AppRole>("borrower");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  async function handleGrant() {
    if (!grantUserId || !grantRole) return;
    setLoading(true);
    setError(null);

    try {
      const { error: rpcError } = await (supabase as any).rpc("grant_role", {
        target_user_id: grantUserId,
        target_role: grantRole,
      });

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      // Refresh roles
      const { data: refreshed } = await (supabase as any)
        .from("user_roles")
        .select("*")
        .order("granted_at", { ascending: false });

      setUserRoles(refreshed ?? []);
      setShowGrant(false);
      setGrantUserId("");
      setGrantRole("borrower");
    } catch {
      setError("Failed to grant role. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(roleId: string) {
    const role = userRoles.find((r) => r.id === roleId);
    if (!role) return;

    setLoading(true);
    try {
      const { error: rpcError } = await (supabase as any).rpc("revoke_role", {
        target_user_id: role.user_id,
        target_role: role.role,
      });

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const { data: refreshed } = await (supabase as any)
        .from("user_roles")
        .select("*")
        .order("granted_at", { ascending: false });

      setUserRoles(refreshed ?? []);
    } catch {
      setError("Failed to revoke role. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-light text-surface-white">
            Role Management
          </h1>
          <p className="text-sm text-surface-muted font-body mt-1">
            Grant and revoke user roles across the portal
          </p>
        </div>
        <button
          onClick={() => setShowGrant(!showGrant)}
          className="flex items-center gap-2 bg-gold text-navy-deep hover:bg-gold-light font-body font-semibold text-sm px-4 py-2.5 rounded-md transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Grant Role
        </button>
      </div>

      {error && (
        <div className="bg-status-danger/10 border border-status-danger/20 text-status-danger text-sm font-body p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Grant role form */}
      {showGrant && (
        <div className="card-cinematic">
          <h3 className="font-display text-lg text-surface-white mb-4">
            Grant New Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-body font-semibold uppercase tracking-wider text-surface-muted mb-1 block">
                User
              </label>
              <select
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                className="w-full bg-navy-deep border border-navy-light rounded-md px-3 py-2 text-sm font-body text-surface-white focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="">Select user...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-body font-semibold uppercase tracking-wider text-surface-muted mb-1 block">
                Role
              </label>
              <select
                value={grantRole}
                onChange={(e) => setGrantRole(e.target.value as AppRole)}
                className="w-full bg-navy-deep border border-navy-light rounded-md px-3 py-2 text-sm font-body text-surface-white focus:outline-none focus:ring-2 focus:ring-gold/30"
              >
                <option value="borrower">Borrower</option>
                <option value="investor">Investor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGrant}
                disabled={loading || !grantUserId}
                className="bg-gold text-navy-deep hover:bg-gold-light font-body font-semibold text-sm px-5 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Grant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-navy-deep">
              <th className="px-4 py-3 text-left text-[11px] font-body font-semibold uppercase tracking-wider text-surface-muted">
                User
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-body font-semibold uppercase tracking-wider text-surface-muted">
                Role
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-body font-semibold uppercase tracking-wider text-surface-muted">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-body font-semibold uppercase tracking-wider text-surface-muted">
                Granted By
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-body font-semibold uppercase tracking-wider text-surface-muted">
                Granted At
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-body font-semibold uppercase tracking-wider text-surface-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {userRoles.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-surface-muted bg-navy-mid"
                >
                  No roles assigned yet
                </td>
              </tr>
            ) : (
              userRoles.map((role) => {
                const profile = profileMap.get(role.user_id);
                const grantedBy = role.granted_by
                  ? profileMap.get(role.granted_by)
                  : null;
                const RoleIcon =
                  ROLE_ICONS[role.role] || Shield;

                return (
                  <tr
                    key={role.id}
                    className="bg-navy-mid border-b border-navy-light"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-body text-surface-white">
                          {profile?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-surface-muted font-body">
                          {profile?.email || role.user_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4 text-gold" />
                        <span className="text-sm font-body text-surface-offwhite">
                          {ROLE_LABELS[role.role] || role.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={role.is_active ? "active" : "inactive"}
                        variant={role.is_active ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-gray font-body">
                      {grantedBy?.full_name || "System"}
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-gray font-body">
                      {formatDate(role.granted_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {role.is_active && role.user_id !== currentUserId && (
                        <button
                          onClick={() => handleRevoke(role.id)}
                          disabled={loading}
                          className="text-xs font-body text-status-danger hover:text-status-danger/80 transition-colors disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
