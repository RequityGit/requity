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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ShieldCheck, User, Eye, BookOpen, Sun, Moon, Menu, Crown, Shield, Landmark, Building2, Check, Users } from "lucide-react";
import { QuickCreateButton } from "./quick-create-button";
import { ViewAsBanner } from "./view-as-banner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useImpersonation } from "./impersonation-context";
import { UserSearchModal } from "./user-search-modal";
import { CommandSearch } from "@/components/search/CommandSearch";
import { useTheme } from "@/components/theme-provider";
import { useMobileNav } from "./mobile-layout-wrapper";
import { useViewAs } from "@/contexts/view-as-context";

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
  const [switching, setSwitching] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { openMobileSidebar } = useMobileNav();
  const { isSuperAdmin: isSuperAdminViewAs, viewAsRole, setViewAsRole, isViewingAs, exitViewAs } = useViewAs();

  const roleConfig = {
    admin: { label: "Admin", icon: Shield },
    investor: { label: "Investor", icon: Landmark },
    borrower: { label: "Borrower", icon: Building2 },
  } as const;

  const viewAsRoles: { role: "admin" | "investor" | "borrower"; label: string; icon: React.ElementType }[] = [
    { role: "admin", label: "Admin", icon: Shield },
    { role: "investor", label: "Investor", icon: Landmark },
    { role: "borrower", label: "Borrower", icon: Building2 },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSwitch(newRole: string) {
    if (newRole === role || switching) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const { redirect } = await res.json();
        router.push(redirect);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  }

  function handleViewAs(r: "admin" | "investor" | "borrower") {
    setViewAsRole(r);
  }

  // When impersonating, show the impersonated user's role in the badge
  const displayRole = isImpersonating && targetRole ? targetRole : role;
  const showRoleSwitcher = !isImpersonating && (isSuperAdmin || allowedRoles.length > 1);

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

        {/* Desktop: left side — impersonation indicator then search */}
        <div className="hidden md:flex flex-1 items-center gap-4 min-w-0">
          {isImpersonating && (
            <div className="flex shrink-0 items-center gap-2 text-sm text-amber-700">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Viewing as {targetUserName}</span>
            </div>
          )}
          <div className="ml-2 w-full max-w-xl">
            <CommandSearch role={role} />
          </div>
        </div>

        {/* Right side — actions */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <QuickCreateButton currentUserId={userId} isSuperAdmin={isSuperAdmin} />
          <NotificationBell userId={userId} activeRole={displayRole} />

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
                      onClick={() => router.push("/users")}
                      className="cursor-pointer"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      User Management
                    </DropdownMenuItem>
                  )}
                  {showRoleSwitcher && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <Crown className="mr-2 h-4 w-4" />
                        Switch Role
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        {isSuperAdmin ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => exitViewAs()}
                              className="cursor-pointer flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                Super Admin
                              </span>
                              {!isViewingAs && <Check className="h-4 w-4 text-green-600" />}
                            </DropdownMenuItem>
                            {viewAsRoles.map(({ role: r, label, icon: Icon }) => {
                              const isActive = isViewingAs && viewAsRole === r;
                              return (
                                <DropdownMenuItem
                                  key={r}
                                  onClick={() => handleViewAs(r)}
                                  className="cursor-pointer flex items-center justify-between"
                                >
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                  </span>
                                  {isActive && <Check className="h-4 w-4 text-green-600" />}
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setUserSearchOpen(true)}
                              className="cursor-pointer flex items-center gap-2 text-amber-700"
                            >
                              <Users className="h-4 w-4" />
                              View as specific user...
                            </DropdownMenuItem>
                          </>
                        ) : (
                          (["admin", "investor", "borrower"] as const)
                            .filter((r) => allowedRoles.includes(r))
                            .map((r) => {
                              const config = roleConfig[r];
                              const Icon = config.icon;
                              const isActive = r === role;
                              return (
                                <DropdownMenuItem
                                  key={r}
                                  onClick={() => handleSwitch(r)}
                                  className="cursor-pointer flex items-center justify-between"
                                  disabled={switching}
                                >
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {config.label}
                                  </span>
                                  {isActive && <Check className="h-4 w-4 text-green-600" />}
                                </DropdownMenuItem>
                              );
                            })
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
