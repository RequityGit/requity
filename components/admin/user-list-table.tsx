"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Shield,
  Mail,
  UserCheck,
  UserX,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RoleManagementDialog } from "@/components/admin/role-management-dialog";
import {
  updateActivationStatusAction,
  resendInviteAction,
  type UserRow,
} from "@/app/(authenticated)/admin/users/actions";

// Role badge color mapping
const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  investor: "bg-green-100 text-green-800 border-green-200",
  borrower: "bg-orange-100 text-orange-800 border-orange-200",
};

const STATUS_COLORS: Record<string, string> = {
  activated: "bg-green-100 text-green-800 border-green-200",
  link_sent: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

type SortField = "full_name" | "created_at" | "last_sign_in_at";
type SortDir = "asc" | "desc";

interface UserListTableProps {
  data: UserRow[];
  currentUserId: string;
  onRefresh: () => void;
}

export function UserListTable({
  data,
  currentUserId,
  onRefresh,
}: UserListTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = data;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.full_name ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter(
        (u) =>
          u.role === roleFilter ||
          u.allowed_roles.includes(roleFilter) ||
          u.user_roles.some((r) => r.role === roleFilter && r.is_active)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((u) => u.activation_status === statusFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: string | null;
      let bVal: string | null;

      switch (sortField) {
        case "full_name":
          aVal = a.full_name ?? "";
          bVal = b.full_name ?? "";
          break;
        case "created_at":
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        case "last_sign_in_at":
          aVal = a.last_sign_in_at;
          bVal = b.last_sign_in_at;
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;

      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [data, search, roleFilter, statusFilter, sortField, sortDir]);

  const handleResendInvite = async (user: UserRow) => {
    setActionLoading(user.id);
    const result = await resendInviteAction(user.id);
    if ("error" in result) {
      toast({
        title: "Failed to send invite",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: `Invite sent to ${user.email}` });
      onRefresh();
    }
    setActionLoading(null);
  };

  const handleToggleActivation = async (user: UserRow) => {
    const newStatus =
      user.activation_status === "activated" ? "pending" : "activated";
    setActionLoading(user.id);
    const result = await updateActivationStatusAction(user.id, newStatus);
    if ("error" in result) {
      toast({
        title: "Failed to update status",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title:
          newStatus === "activated"
            ? `${user.full_name ?? user.email} activated`
            : `${user.full_name ?? user.email} deactivated`,
      });
      onRefresh();
    }
    setActionLoading(null);
  };

  // Collect all unique roles from data for filter
  const allRoles = useMemo(() => {
    const roles = new Set<string>();
    data.forEach((u) => {
      if (u.role) roles.add(u.role);
      u.allowed_roles.forEach((r) => { if (r) roles.add(r); });
      u.user_roles.forEach((r) => {
        if (r.is_active) roles.add(r.role);
      });
    });
    return Array.from(roles).sort();
  }, [data]);

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown
        className={cn(
          "h-3 w-3",
          sortField === field ? "text-foreground" : "text-muted-foreground"
        )}
      />
    </button>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  <span className="capitalize">{r.replace(/_/g, " ")}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="activated">Activated</SelectItem>
              <SelectItem value="link_sent">Link Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="full_name">Name</SortButton>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <SortButton field="last_sign_in_at">Last Sign In</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="created_at">Created</SortButton>
                </TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="font-medium text-[#1a2b4a]">
                        {user.full_name || "—"}
                      </span>
                      {user.id === currentUserId && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] px-1.5 py-0"
                        >
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getRoleBadges(user)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-xs font-medium",
                          STATUS_COLORS[user.activation_status] ||
                            "bg-gray-100 text-gray-800 border-gray-200"
                        )}
                      >
                        {user.activation_status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_sign_in_at
                        ? formatDate(user.last_sign_in_at)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === user.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setRoleDialogUser(user)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </DropdownMenuItem>
                          {user.activation_status !== "activated" && (
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(user)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.activation_status === "activated" ? (
                            <DropdownMenuItem
                              onClick={() => handleToggleActivation(user)}
                              className="text-red-600 focus:text-red-600"
                              disabled={user.id === currentUserId}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleToggleActivation(user)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {roleDialogUser && (
        <RoleManagementDialog
          user={roleDialogUser}
          open={!!roleDialogUser}
          onOpenChange={(open) => {
            if (!open) setRoleDialogUser(null);
          }}
          onSuccess={() => {
            setRoleDialogUser(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// Helper to render role badges from all available role sources
function getRoleBadges(user: UserRow) {
  const roles = new Set<string>();

  // Primary role from profile
  if (user.role) roles.add(user.role);

  // allowed_roles from profile
  user.allowed_roles.forEach((r) => { if (r) roles.add(r); });

  // Active roles from user_roles table
  user.user_roles.forEach((r) => {
    if (r.is_active) roles.add(r.role);
  });

  return Array.from(roles).map((role) => (
    <Badge
      key={role}
      variant="outline"
      className={cn(
        "capitalize text-xs font-medium",
        ROLE_COLORS[role] || "bg-gray-100 text-gray-800 border-gray-200"
      )}
    >
      {role.replace(/_/g, " ")}
    </Badge>
  ));
}
