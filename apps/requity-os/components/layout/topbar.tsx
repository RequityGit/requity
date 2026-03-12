"use client";

import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/constants";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ShieldCheck, User, Eye, BookOpen, Sun, Moon, Menu } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";
import { ViewAsBanner } from "./view-as-banner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useImpersonation } from "./impersonation-context";
import { UserSearchModal } from "./user-search-modal";
import { Badge } from "@/components/ui/badge";
import { CommandSearch } from "@/components/search/CommandSearch";
import { useTheme } from "@/components/theme-provider";
import { useMobileNav } from "./mobile-layout-wrapper";

interface TopbarProps {
  userName: string;
  role: string;
  email: string;
  allowedRoles: string[];
  userId: string;
  isSuperAdmin?: boolean;
  avatarUrl?: string | null;
}

export function Topbar({ userName, role, email, allowedRoles, userId, isSuperAdmin, avatarUrl }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { isImpersonating, targetRole, targetUserName } = useImpersonation();
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { openMobileSidebar } = useMobileNav();

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
      <header className="sticky top-0 z-30 h-14 md:h-16 border-b bg-card flex items-center px-3 md:px-6 no-print">
        {/* Mobile: hamburger button */}
        <button
          onClick={openMobileSidebar}
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-2"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile: centered logo */}
        <div className="md:hidden flex-1 flex justify-center">
          <img
            src={`${SUPABASE_URL}/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2`}
            alt="Requity"
            className="h-10 w-auto dark:block hidden"
          />
          <img
            src={`${SUPABASE_URL}/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2`}
            alt="Requity"
            className="h-10 w-auto dark:hidden invert"
          />
        </div>

        {/* Desktop: left side — impersonation indicator or spacer */}
        <div className="hidden md:block shrink-0 w-48">
          {isImpersonating && (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Viewing as {targetUserName}</span>
            </div>
          )}
        </div>

        {/* Desktop: center — search bar */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <CommandSearch role={role} />
        </div>

        {/* Right side — actions */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell userId={userId} activeRole={displayRole} />

          {/* Role switcher - hidden on mobile */}
          <div className="hidden md:block">
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
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-muted rounded-md px-2 md:px-3 py-2 transition-colors">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userName || "Profile"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {userName
                      ? userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "U"}
                  </div>
                )}
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
                    onClick={() => router.push("/sops")}
                    className="cursor-pointer"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Knowledge Base
                  </DropdownMenuItem>
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
