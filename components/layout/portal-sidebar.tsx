"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoles, type AppRole } from "@/providers/role-provider";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Users,
  Home,
  ChevronLeft,
  ChevronRight,
  Landmark,
  FolderOpen,
  Settings,
  Briefcase,
  Building2,
  CreditCard,
  HelpCircle,
  X,
  UserCircle,
  BarChart3,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section?: string;
  superAdminOnly?: boolean;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Loans", href: "/admin/loans", icon: Home, section: "Pipeline" },
  { label: "Borrowers", href: "/admin/borrowers", icon: Building2 },
  { label: "Investors", href: "/admin/investors", icon: Users },
  { label: "Entities", href: "/admin/entities", icon: Briefcase, section: "Management" },
  { label: "Reporting", href: "/admin/reporting", icon: BarChart3 },
  { label: "Roles", href: "/admin/settings/roles", icon: Settings, section: "Settings", superAdminOnly: true },
];

const borrowerNav: NavItem[] = [
  { label: "Dashboard", href: "/borrower", icon: LayoutDashboard },
  { label: "My Loans", href: "/borrower/loans", icon: Home },
  { label: "Documents", href: "/borrower/documents", icon: FileText },
  { label: "Profile", href: "/borrower/profile", icon: UserCircle },
  { label: "Support", href: "/borrower/support", icon: HelpCircle },
];

const investorNav: NavItem[] = [
  { label: "Dashboard", href: "/investor", icon: LayoutDashboard },
  { label: "My Investments", href: "/investor/investments", icon: Landmark },
  { label: "Distributions", href: "/investor/distributions", icon: Receipt },
  { label: "Documents", href: "/investor/documents", icon: FolderOpen },
  { label: "Account Settings", href: "/investor/profile", icon: Settings },
  { label: "Support", href: "/investor/support", icon: HelpCircle },
];

function getNavItems(role: AppRole | null): NavItem[] {
  switch (role) {
    case "super_admin":
    case "admin":
      return adminNav;
    case "borrower":
      return borrowerNav;
    case "investor":
      return investorNav;
    default:
      return [];
  }
}

interface PortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  userName?: string;
}

export function PortalSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  userName,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const { activeRole, isSuperAdmin } = useRoles();
  const navItems = getNavItems(activeRole);

  const filteredNav = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  const sidebarContent = (
    <>
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-pale/10 h-16">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-gold" />
            <span className="font-display text-lg font-medium text-surface-white">
              Requity
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <Briefcase className="h-6 w-6 text-gold" />
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="hidden md:flex p-1 rounded hover:bg-navy/50 transition-colors text-surface-muted hover:text-surface-gray"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 rounded hover:bg-navy/50 transition-colors text-surface-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">
        {filteredNav.map((item, i) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/borrower" &&
              item.href !== "/investor" &&
              pathname.startsWith(item.href + "/")) ||
            pathname === item.href;
          const showSection =
            item.section &&
            (i === 0 || filteredNav[i - 1]?.section !== item.section);

          return (
            <div key={item.href}>
              {showSection && !collapsed && (
                <p className="text-[11px] uppercase tracking-wider text-surface-muted font-body font-semibold px-3 pt-6 pb-2">
                  {item.section}
                </p>
              )}
              {showSection && collapsed && <div className="mt-4" />}
              <Link
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body font-medium transition-colors relative",
                  isActive
                    ? "bg-navy-mid text-gold border-gold-active"
                    : "text-surface-gray hover:bg-navy/50 hover:text-surface-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-gold" : ""
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-gold-pale/10">
        {!collapsed && userName && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-body font-semibold flex-shrink-0">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-body text-surface-offwhite truncate">
                {userName}
              </p>
            </div>
          </div>
        )}
        {collapsed && userName && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-body font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-navy-deep flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen sticky top-0 bg-navy-deep flex-col transition-all duration-300 border-r border-gold-pale/10",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
