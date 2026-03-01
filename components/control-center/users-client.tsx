"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/components/control-center/role-badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { grantRole, revokeRole, reactivateRole } from "@/app/(authenticated)/control-center/users/actions";

interface UserRole {
  id: string;
  role: string;
  is_active: boolean;
  granted_by: string | null;
  granted_at: string;
  investor_id: string | null;
  borrower_id: string | null;
}

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  activation_status: string | null;
  user_roles: UserRole[];
}

interface Investor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Borrower {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface UsersClientProps {
  profiles: Profile[];
  investors: Investor[];
  borrowers: Borrower[];
  grantedByMap: Record<string, string>;
  currentUserId: string;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  activated: {
    label: "Activated",
    className: "bg-green-100 text-green-800",
  },
  link_sent: {
    label: "Link Sent",
    className: "bg-yellow-100 text-yellow-800",
  },
  pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
};

export function UsersClient({
  profiles,
  investors,
  borrowers,
  grantedByMap,
  currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showRevoked, setShowRevoked] = useState(false);

  // Grant role modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantTargetUser, setGrantTargetUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);

  // Super admin confirmation
  const [superAdminConfirmOpen, setSuperAdminConfirmOpen] = useState(false);

  // Revoke confirmation
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{
    roleId: string;
    roleName: string;
    userName: string;
  } | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Filtered profiles
  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const name = (p.full_name || p.name || p.email || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const q = search.toLowerCase();
      if (q && !name.includes(q) && !email.includes(q)) return false;

      if (roleFilter === "no_roles") {
        const activeRoles = p.user_roles.filter((r) => r.is_active);
        return activeRoles.length === 0;
      }
      if (roleFilter !== "all") {
        const hasRole = p.user_roles.some(
          (r) => r.role === roleFilter && r.is_active
        );
        if (!hasRole) return false;
      }

      return true;
    });
  }, [profiles, search, roleFilter]);

  function openGrantModal(profile: Profile) {
    setGrantTargetUser(profile);
    setSelectedRole("");
    setSelectedInvestorId("");
    setSelectedBorrowerId("");
    setGrantModalOpen(true);
  }

  async function handleGrantRole() {
    if (!grantTargetUser || !selectedRole) return;

    // If super_admin, show confirmation dialog first
    if (selectedRole === "super_admin" && !superAdminConfirmOpen) {
      setSuperAdminConfirmOpen(true);
      return;
    }

    setGrantLoading(true);
    const result = await grantRole(
      grantTargetUser.id,
      selectedRole,
      selectedRole === "investor" ? selectedInvestorId || null : null,
      selectedRole === "borrower" ? selectedBorrowerId || null : null
    );
    setGrantLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role granted successfully" });
      setGrantModalOpen(false);
      setSuperAdminConfirmOpen(false);
      router.refresh();
    }
  }

  async function handleRevokeRole() {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    const result = await revokeRole(revokeTarget.roleId, currentUserId);
    setRevokeLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role revoked successfully" });
      setRevokeConfirmOpen(false);
      router.refresh();
    }
  }

  async function handleReactivateRole(roleId: string) {
    const result = await reactivateRole(roleId);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role reactivated successfully" });
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admins</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
            <SelectItem value="borrower">Borrowers</SelectItem>
            <SelectItem value="no_roles">No Roles</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showRevoked ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowRevoked(!showRevoked)}
          className="gap-1.5"
        >
          {showRevoked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showRevoked ? "Hide" : "Show"} Revoked
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Users Table */}
      <div className="rounded-md border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Name
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Email
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Status
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Roles
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Granted By
              </th>
              <th className="text-right font-medium text-muted-foreground px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((profile) => {
              const displayName =
                profile.full_name || profile.name || profile.email || "Unknown";
              const status = profile.activation_status || "pending";
              const statusBadge = STATUS_BADGES[status] || STATUS_BADGES.pending;
              const activeRoles = profile.user_roles.filter((r) => r.is_active);
              const inactiveRoles = profile.user_roles.filter(
                (r) => !r.is_active
              );

              // Most recently granted role
              const latestRole = activeRoles.sort(
                (a, b) =>
                  new Date(b.granted_at).getTime() -
                  new Date(a.granted_at).getTime()
              )[0];

              return (
                <tr
                  key={profile.id}
                  className="border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {profile.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        statusBadge.className
                      )}
                      variant="secondary"
                    >
                      {statusBadge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {activeRoles.length === 0 && !showRevoked && (
                        <span className="text-xs text-muted-foreground italic">
                          No roles assigned
                        </span>
                      )}
                      {activeRoles.map((r) => (
                        <RoleBadge
                          key={r.id}
                          role={r.role}
                          onRemove={() => {
                            setRevokeTarget({
                              roleId: r.id,
                              roleName: r.role,
                              userName: displayName,
                            });
                            setRevokeConfirmOpen(true);
                          }}
                        />
                      ))}
                      {showRevoked &&
                        inactiveRoles.map((r) => (
                          <span key={r.id} className="inline-flex items-center gap-1">
                            <RoleBadge role={r.role} inactive />
                            <button
                              onClick={() => handleReactivateRole(r.id)}
                              className="text-[10px] text-teal-600 hover:text-teal-800 font-medium"
                            >
                              Reactivate
                            </button>
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {latestRole?.granted_by
                      ? grantedByMap[latestRole.granted_by] || "Unknown"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGrantModal(profile)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Grant Role
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No users found matching your filters.
          </div>
        )}
      </div>

      {/* Grant Role Dialog */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Role</DialogTitle>
            <DialogDescription>
              Assign a new role to{" "}
              {grantTargetUser?.full_name ||
                grantTargetUser?.name ||
                grantTargetUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="borrower">Borrower</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "investor" && (
              <div className="space-y-2">
                <Label>Link to Investor Record (optional)</Label>
                <Select
                  value={selectedInvestorId}
                  onValueChange={setSelectedInvestorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {investors.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {[inv.first_name, inv.last_name]
                          .filter(Boolean)
                          .join(" ")}{" "}
                        {inv.email ? `— ${inv.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedRole === "borrower" && (
              <div className="space-y-2">
                <Label>Link to Borrower Record (optional)</Label>
                <Select
                  value={selectedBorrowerId}
                  onValueChange={setSelectedBorrowerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select borrower..." />
                  </SelectTrigger>
                  <SelectContent>
                    {borrowers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {[b.first_name, b.last_name].filter(Boolean).join(" ")}{" "}
                        {b.email ? `— ${b.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantModalOpen(false)}
              disabled={grantLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantRole}
              disabled={!selectedRole || grantLoading}
            >
              {grantLoading ? "Granting..." : "Grant Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Super Admin Confirmation */}
      <AlertDialog
        open={superAdminConfirmOpen}
        onOpenChange={setSuperAdminConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant Super Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to grant Super Admin access to{" "}
              <span className="font-semibold text-foreground">
                {grantTargetUser?.full_name ||
                  grantTargetUser?.name ||
                  grantTargetUser?.email}
              </span>
              . This gives full system control including the ability to manage
              all users, roles, and system configuration. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={grantLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGrantRole}
              disabled={grantLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {grantLoading ? "Granting..." : "Confirm Super Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Role Confirmation */}
      <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the{" "}
              <span className="font-semibold text-foreground">
                {revokeTarget?.roleName?.replace("_", " ")}
              </span>{" "}
              role from{" "}
              <span className="font-semibold text-foreground">
                {revokeTarget?.userName}
              </span>
              ? This can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeRole}
              disabled={revokeLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeLoading ? "Revoking..." : "Revoke Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
