"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Loader2 } from "lucide-react";
import { useImpersonation } from "./impersonation-context";

interface UserForSearch {
  id: string;
  full_name: string | null;
  name: string | null;
  email: string | null;
  roles: string[];
}

interface UserSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800",
  admin: "bg-purple-100 text-purple-800",
  investor: "bg-teal-100 text-teal-800",
  borrower: "bg-blue-100 text-blue-800",
};

export function UserSearchModal({ open, onOpenChange }: UserSearchModalProps) {
  const { startImpersonation } = useImpersonation();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserForSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      fetchUsers();
    }
  }, [open, fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.full_name || u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  async function handleSelect(userId: string) {
    setImpersonating(userId);
    try {
      await startImpersonation(userId);
      onOpenChange(false);
    } finally {
      setImpersonating(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>View as Specific User</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? "No users match your search." : "No users found."}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filtered.map((user) => {
                const displayName =
                  user.full_name || user.name || user.email || "Unknown";
                const isLoading = impersonating === user.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user.id)}
                    disabled={!!impersonating}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 ${ROLE_BADGE_STYLES[role] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {role.replace("_", " ")}
                        </Badge>
                      ))}
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Select a user to view the portal exactly as they see it (read-only).
        </p>
      </DialogContent>
    </Dialog>
  );
}
