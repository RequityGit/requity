"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { UserListTable } from "@/components/admin/user-list-table";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchUsersAction,
  type UserRow,
} from "@/app/(authenticated)/(admin)/users/actions";
import { Skeleton } from "@/components/ui/skeleton";

interface UserManagementClientProps {
  currentUserId: string;
}

export function UserManagementClient({
  currentUserId,
}: UserManagementClientProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const result = await fetchUsersAction();
    if ("error" in result) {
      toast({
        title: "Failed to load users",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setUsers(result.users);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage users, roles, and invitations."
        action={
          <Button className="gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <div className="rounded-md border bg-card">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <UserListTable
          data={users}
          currentUserId={currentUserId}
          onRefresh={loadUsers}
        />
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => {
          setInviteOpen(false);
          loadUsers();
        }}
      />
    </>
  );
}
