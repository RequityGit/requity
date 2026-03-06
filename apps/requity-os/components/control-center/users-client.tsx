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
import { Search, Plus, Eye, EyeOff, UserPlus, Blocks, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  grantRole,
  revokeRole,
  reactivateRole,
  toggleModuleAccess,
  grantAllModules,
  revokeAllModules,
} from "@/app/(authenticated)/control-center/users/actions";
import { AddUserDialog } from "@/components/control-center/add-user-dialog";
import { useImpersonation } from "@/components/layout/impersonation-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  module_ids: string[];
}

interface Module {
  id: string;
  name: string;
  label: string;
  icon: string | null;
  sort_order: number;
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
  modules: Module[];
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  activated: {
    label: "Activated",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  link_sent: {
    label: "Link Sent",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-foreground dark:bg-muted dark:text-muted-foreground",
  },
};

export function UsersClient({
  profiles,
  investors,
  borrowers,
  grantedByMap,
  currentUserId,
  modules,
}: UsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { startImpersonation } = useImpersonation();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showRevoked, setShowRevoked] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);

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

  // Module management dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleTargetUser, setModuleTargetUser] = useState<Profile | null>(null);
  const [pendingModuleIds, setPendingModuleIds] = useState<Set<string>>(new Set());
  const [moduleLoading, setModuleLoading] = useState<string | null>(null);

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

  function openModuleDialog(profile: Profile) {
    setModuleTargetUser(profile);
    setPendingModuleIds(new Set(profile.module_ids));
    setModuleDialogOpen(true);
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

  async function handleToggleModule(moduleId: string) {
    if (!moduleTargetUser) return;
    const isCurrentlyGranted = pendingModuleIds.has(moduleId);
    setModuleLoading(moduleId);

    // Optimistic update
    setPendingModuleIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyGranted) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });

    const result = await toggleModuleAccess(
      moduleTargetUser.id,
      moduleId,
      !isCurrentlyGranted
    );
    setModuleLoading(null);

    if (result.error) {
      // Revert optimistic update
      setPendingModuleIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyGranted) {
          next.add(moduleId);
        } else {
          next.delete(moduleId);
        }
        return next;
      });
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  }

  async function handleGrantAllModules() {
    if (!moduleTargetUser) return;
    setModuleLoading("all");
    const result = await grantAllModules(moduleTargetUser.id);
    setModuleLoading(null);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setPendingModuleIds(new Set(modules.map((m) => m.id)));
      toast({ title: "All modules granted" });
    }
  }

  async function handleRevokeAllModules() {
    if (!moduleTargetUser) return;
    setModuleLoading("all");
    const result = await revokeAllModules(moduleTargetUser.id);
    setModuleLoading(null);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setPendingModuleIds(new Set());
      toast({ title: "All modules revoked" });
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
        <Button
          size="sm"
          onClick={() => setAddUserOpen(true)}
          className="gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Users Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
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
                Modules
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
              const moduleCount = profile.module_ids.length;
              const totalModules = modules.length;

              // Most recently granted role
              const latestRole = activeRoles.sort(
                (a, b) =>
                  new Date(b.granted_at).getTime() -
                  new Date(a.granted_at).getTime()
              )[0];

              return (
                <tr
                  key={profile.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
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
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openModuleDialog(profile)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border hover:bg-muted/50 transition-colors"
                    >
                      <Blocks className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {moduleCount === totalModules
                          ? "All"
                          : moduleCount === 0
                            ? "None"
                            : moduleCount}
                      </span>
                      <span className="text-muted-foreground">
                        / {totalModules}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {profile.id !== currentUserId && activeRoles.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startImpersonation(profile.id)}
                                className="gap-1 text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View as this user</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGrantModal(profile)}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModuleDialog(profile)}
                        className="gap-1"
                      >
                        <Blocks className="h-3 w-3" />
                        Modules
                      </Button>
                    </div>
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

      {/* Module Management Dialog */}
      <Dialog
        open={moduleDialogOpen}
        onOpenChange={(open) => {
          setModuleDialogOpen(open);
          if (!open) router.refresh();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Module Access</DialogTitle>
            <DialogDescription>
              Manage which modules{" "}
              <span className="font-medium text-foreground">
                {moduleTargetUser?.full_name ||
                  moduleTargetUser?.name ||
                  moduleTargetUser?.email}
              </span>{" "}
              can access in the sidebar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGrantAllModules}
              disabled={moduleLoading === "all"}
              className="text-xs"
            >
              Grant All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllModules}
              disabled={moduleLoading === "all"}
              className="text-xs"
            >
              Revoke All
            </Button>
          </div>

          <div className="space-y-1 max-h-[400px] overflow-y-auto py-2">
            {modules.map((mod) => {
              const isGranted = pendingModuleIds.has(mod.id);
              const isLoading = moduleLoading === mod.id;

              return (
                <button
                  key={mod.id}
                  onClick={() => handleToggleModule(mod.id)}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    isGranted
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center h-5 w-5 rounded border transition-colors flex-shrink-0",
                      isGranted
                        ? "bg-foreground border-foreground"
                        : "border-border"
                    )}
                  >
                    {isGranted && (
                      <Check className="h-3 w-3 text-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{mod.label}</div>
                  </div>
                  {isLoading && (
                    <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  )}
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModuleDialogOpen(false);
                router.refresh();
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Label>Link to Investor Record *</Label>
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
                <Label>Link to Borrower Record *</Label>
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
              disabled={
                !selectedRole ||
                grantLoading ||
                (selectedRole === "investor" && !selectedInvestorId) ||
                (selectedRole === "borrower" && !selectedBorrowerId)
              }
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

      {/* Add User Dialog */}
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSuccess={() => {
          setAddUserOpen(false);
          router.refresh();
        }}
        investors={investors}
        borrowers={borrowers}
      />
    </div>
  );
}
