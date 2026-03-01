"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ShieldCheck, User, Eye } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";
import { ViewAsBanner } from "./view-as-banner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useImpersonation } from "./impersonation-context";
import { UserSearchModal } from "./user-search-modal";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  userName: string;
  role: string;
  email: string;
  allowedRoles: string[];
  userId: string;
  isSuperAdmin?: boolean;
}

export function Topbar({ userName, role, email, allowedRoles, userId, isSuperAdmin }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { isImpersonating, targetRole, targetUserName } = useImpersonation();
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // When impersonating, show the impersonated user's role in the badge
  const displayRole = isImpersonating && targetRole ? targetRole : role;

  return (
    <>
      <ViewAsBanner />
      <header className="sticky top-0 z-30 h-16 border-b bg-white flex items-center justify-between px-6">
        <div>
          {isImpersonating && (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Viewing as {targetUserName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell userId={userId} />

          {isImpersonating ? (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-300"
            >
              <Eye className="h-3 w-3 mr-1" />
              {displayRole === "admin"
                ? "Admin"
                : displayRole === "investor"
                  ? "Investor"
                  : displayRole === "borrower"
                    ? "Borrower"
                    : displayRole}
            </Badge>
          ) : (
            <RoleSwitcher
              activeRole={role}
              allowedRoles={allowedRoles}
              isSuperAdmin={isSuperAdmin}
              onViewAsUser={() => setUserSearchOpen(true)}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-slate-100 rounded-md px-3 py-2 transition-colors">
                <div className="h-8 w-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white text-sm font-medium">
                  {userName
                    ? userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U"}
                </div>
                <span className="text-sm font-medium hidden md:inline">
                  {userName || email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!isImpersonating && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/${role}/account`)}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  {role === "admin" && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/users")}
                      className="cursor-pointer"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      User Management
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isSuperAdmin && (
        <UserSearchModal
          open={userSearchOpen}
          onOpenChange={setUserSearchOpen}
        />
      )}
    </>
  );
}
