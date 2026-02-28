"use client";

import { useSupabase } from "@/providers/supabase-provider";
import { useRoles } from "@/providers/role-provider";
import { useRouter, usePathname } from "next/navigation";
import { RoleSwitcher } from "./role-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";

interface HeaderProps {
  userName: string;
  email: string;
  onMenuToggle?: () => void;
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Portal";

  // Last meaningful segment
  const last = segments[segments.length - 1];
  // Handle [id] pages
  if (last.match(/^[0-9a-f-]+$/i) && segments.length > 1) {
    return segments[segments.length - 2]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getBreadcrumbs(pathname: string): { label: string; path: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    if (seg.match(/^[0-9a-f-]+$/i)) continue;
    crumbs.push({
      label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      path,
    });
  }
  return crumbs;
}

export function Header({ userName, email, onMenuToggle }: HeaderProps) {
  const supabase = useSupabase();
  const { activeRole } = useRoles();
  const router = useRouter();
  const pathname = usePathname();

  const pageTitle = getPageTitle(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-navy border-b border-gold-pale/10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: mobile menu + title/breadcrumbs */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-surface-gray hover:bg-navy-mid transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-display font-medium text-surface-white">
              {pageTitle}
            </h1>
            {breadcrumbs.length > 1 && (
              <nav className="hidden md:flex items-center gap-1 text-xs text-surface-muted font-body">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center gap-1">
                    {i > 0 && <span>/</span>}
                    <span
                      className={
                        i === breadcrumbs.length - 1
                          ? "text-surface-gray"
                          : "hover:text-surface-gray cursor-pointer"
                      }
                    >
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Right: role switcher + bell + user */}
        <div className="flex items-center gap-3">
          <RoleSwitcher />

          <button className="relative p-2 rounded-md text-surface-muted hover:text-surface-gray hover:bg-navy-mid transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-navy-mid rounded-md px-2 py-1.5 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-body font-semibold">
                  {initials}
                </div>
                <span className="hidden lg:block text-sm font-body text-surface-offwhite">
                  {userName || email}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-navy-mid border-navy-light"
            >
              <DropdownMenuLabel className="font-body">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-surface-white">
                    {userName || "User"}
                  </p>
                  <p className="text-xs text-surface-muted">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-navy-light" />
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    activeRole === "investor" || activeRole === "borrower"
                      ? `/${activeRole}/profile`
                      : "/admin/settings/roles"
                  )
                }
                className="cursor-pointer text-surface-gray hover:text-surface-white hover:bg-navy-light"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/settings/roles")}
                className="cursor-pointer text-surface-gray hover:text-surface-white hover:bg-navy-light"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-navy-light" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-status-danger hover:bg-status-danger/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile role switcher */}
      <div className="md:hidden">
        <RoleSwitcher />
      </div>
    </header>
  );
}
