"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  addRoleAction,
  removeRoleAction,
  fetchInvestorsAction,
  fetchBorrowersAction,
  type UserRow,
} from "@/app/(authenticated)/admin/users/actions";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  investor: "bg-green-100 text-green-800 border-green-200",
  borrower: "bg-orange-100 text-orange-800 border-orange-200",
};

const AVAILABLE_ROLES = ["admin", "investor", "borrower"];

interface RoleManagementDialogProps {
  user: UserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RoleManagementDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RoleManagementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>("");
  const [investors, setInvestors] = useState<
    { id: string; first_name: string; last_name: string; email: string | null }[]
  >([]);
  const [borrowers, setBorrowers] = useState<
    { id: string; first_name: string; last_name: string; email: string | null }[]
  >([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const { toast } = useToast();

  // Fetch entity data when role selection changes
  useEffect(() => {
    setSelectedInvestorId("");
    setSelectedBorrowerId("");

    if (newRole === "investor") {
      setEntityLoading(true);
      fetchInvestorsAction().then((result) => {
        if ("success" in result) setInvestors(result.investors);
        setEntityLoading(false);
      });
    } else if (newRole === "borrower") {
      setEntityLoading(true);
      fetchBorrowersAction().then((result) => {
        if ("success" in result) setBorrowers(result.borrowers);
        setEntityLoading(false);
      });
    }
  }, [newRole]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setNewRole("");
      setSelectedInvestorId("");
      setSelectedBorrowerId("");
    }
  }, [open]);

  // Get current active roles
  const currentRoles = new Set<string>();
  if (user.role) currentRoles.add(user.role);
  user.allowed_roles.forEach((r) => { if (r) currentRoles.add(r); });
  user.user_roles.forEach((r) => {
    if (r.is_active) currentRoles.add(r.role);
  });

  // Roles that can be added
  const addableRoles = AVAILABLE_ROLES.filter((r) => !currentRoles.has(r));

  const handleAddRole = async () => {
    if (!newRole) return;
    if (newRole === "investor" && !selectedInvestorId) return;
    if (newRole === "borrower" && !selectedBorrowerId) return;

    setLoading(true);
    const result = await addRoleAction(
      user.id,
      newRole,
      newRole === "investor" ? selectedInvestorId : undefined,
      newRole === "borrower" ? selectedBorrowerId : undefined
    );
    if ("error" in result) {
      toast({
        title: "Failed to add role",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: `Added ${newRole} role to ${user.full_name ?? user.email}` });
      setNewRole("");
      setSelectedInvestorId("");
      setSelectedBorrowerId("");
      onSuccess();
    }
    setLoading(false);
  };

  const handleRemoveRole = async (role: string) => {
    if (currentRoles.size <= 1) {
      toast({
        title: "Cannot remove last role",
        description: "A user must have at least one role.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await removeRoleAction(user.id, role);
    if ("error" in result) {
      toast({
        title: "Failed to remove role",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Removed ${role} role from ${user.full_name ?? user.email}`,
      });
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            {user.full_name ?? user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current roles */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Current Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from(currentRoles).map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className={cn(
                    "capitalize text-xs font-medium pl-2.5 pr-1 py-1 gap-1",
                    ROLE_COLORS[role] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                  )}
                >
                  {role.replace(/_/g, " ")}
                  {role !== "super_admin" && currentRoles.size > 1 && (
                    <button
                      onClick={() => handleRemoveRole(role)}
                      disabled={loading}
                      className="ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                      title={`Remove ${role} role`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Add role */}
          {addableRoles.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Add Role
              </label>
              <div className="flex items-center gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {addableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        <span className="capitalize">
                          {r.replace(/_/g, " ")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddRole}
                  disabled={
                    !newRole ||
                    loading ||
                    entityLoading ||
                    (newRole === "investor" && !selectedInvestorId) ||
                    (newRole === "borrower" && !selectedBorrowerId)
                  }
                  className="gap-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>

              {/* Entity selection for investor role */}
              {newRole === "investor" && (
                <div className="mt-3">
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Link to Investor Record *
                  </label>
                  {entityLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading investors...
                    </div>
                  ) : investors.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No investor records found. Create an investor record first.
                    </p>
                  ) : (
                    <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an investor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {investors.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.first_name} {inv.last_name}
                            {inv.email ? ` (${inv.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    An investor record must be linked to grant the investor role.
                  </p>
                </div>
              )}

              {/* Entity selection for borrower role */}
              {newRole === "borrower" && (
                <div className="mt-3">
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Link to Borrower Record *
                  </label>
                  {entityLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading borrowers...
                    </div>
                  ) : borrowers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No borrower records found. Create a borrower record first.
                    </p>
                  ) : (
                    <Select value={selectedBorrowerId} onValueChange={setSelectedBorrowerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a borrower..." />
                      </SelectTrigger>
                      <SelectContent>
                        {borrowers.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.first_name} {b.last_name}
                            {b.email ? ` (${b.email})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    A borrower record must be linked to grant the borrower role.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Role details from user_roles table */}
          {user.user_roles.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Role Details (user_roles table)
              </label>
              <div className="space-y-1.5">
                {user.user_roles.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-sm flex items-center justify-between px-3 py-1.5 rounded border",
                      r.is_active
                        ? "bg-white border-gray-200"
                        : "bg-gray-50 border-gray-100 text-muted-foreground"
                    )}
                  >
                    <span className="capitalize">
                      {r.role.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs">
                      {r.is_active ? "Active" : "Inactive"}
                      {r.investor_id && " (linked investor)"}
                      {r.borrower_id && " (linked borrower)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
