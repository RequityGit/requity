"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Briefcase,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Landmark,
  FolderOpen,
  Hammer,
  Settings2,
  Contact,
  Banknote,
  Cog,
  BookOpen,
  Calculator,
  MessageSquare,
  Columns3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useViewAs } from "@/contexts/view-as-context";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Additional path prefixes that should highlight this nav item */
  activePaths?: string[];
  /** Module name for access control filtering (admin nav only) */
  moduleName?: string;
}

const investorNav: NavItem[] = [
  { label: "Dashboard", href: "/investor/dashboard", icon: LayoutDashboard },
  {
    label: "My Investments",
    href: "/investor/funds",
    icon: Landmark,
    activePaths: ["/investor/capital-calls", "/investor/distributions"],
  },
  { label: "Documents", href: "/investor/documents", icon: FileText },
];

const borrowerNav: NavItem[] = [
  { label: "Dashboard", href: "/borrower/dashboard", icon: LayoutDashboard },
  { label: "Draw Requests", href: "/borrower/draws", icon: Hammer },
  { label: "Payments", href: "/borrower/payments", icon: CreditCard },
  { label: "Documents", href: "/borrower/documents", icon: FileText },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, moduleName: "dashboard" },
  {
    label: "CRM",
    href: "/admin/crm",
    icon: Contact,
    activePaths: ["/admin/investors", "/admin/borrowers"],
    moduleName: "crm",
  },
  {
    label: "Pipeline",
    href: "/admin/pipeline",
    icon: Columns3,
    activePaths: ["/admin/originations", "/admin/equity-pipeline", "/admin/loans", "/admin/conditions", "/admin/pricing"],
    moduleName: "pipeline",
  },
  {
    label: "DSCR Pricing",
    href: "/admin/dscr",
    icon: Calculator,
    activePaths: ["/admin/dscr"],
    moduleName: "dscr-pricing",
  },
  { label: "Servicing", href: "/admin/servicing", icon: Banknote, moduleName: "servicing" },
  {
    label: "Investments",
    href: "/admin/funds",
    icon: Landmark,
    activePaths: ["/admin/capital-calls", "/admin/distributions"],
    moduleName: "investments",
  },
  {
    label: "Documents",
    href: "/admin/document-center",
    icon: FolderOpen,
    activePaths: ["/admin/documents"],
    moduleName: "documents",
  },
  {
    label: "Operations",
    href: "/admin/operations",
    icon: Settings2,
    activePaths: ["/admin/operations/approvals"],
    moduleName: "operations",
  },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "investor":
      return investorNav;
    case "borrower":
      return borrowerNav;
    case "admin":
      return adminNav;
    default:
      return [];
  }
}

export function Sidebar({
  role,
  isSuperAdmin,
  accessibleModules,
}: {
  role: string;
  isSuperAdmin?: boolean;
  accessibleModules?: string[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { effectiveViewRole, isViewingAs } = useViewAs();
  const [userId, setUserId] = useState<string | undefined>();
  const { totalUnread } = useUnreadCounts(userId);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Use view-as role for navigation when super admin is simulating
  const navRole = isViewingAs ? effectiveViewRole : role;
  const allNavItems = getNavItems(navRole);

  // Filter admin nav items by module access
  const navItems =
    navRole === "admin" && accessibleModules && accessibleModules.length > 0
      ? allNavItems.filter(
          (item) => !item.moduleName || accessibleModules.includes(item.moduleName)
        )
      : allNavItems;

  // Check if bottom nav items are accessible
  const showChatter =
    !accessibleModules ||
    accessibleModules.length === 0 ||
    accessibleModules.includes("chatter") ||
    navRole !== "admin";
  const showKnowledgeBase =
    !accessibleModules ||
    accessibleModules.length === 0 ||
    accessibleModules.includes("knowledge-base") ||
    navRole !== "admin";
  const showControlCenter =
    isSuperAdmin &&
    !isViewingAs &&
    (!accessibleModules ||
      accessibleModules.length === 0 ||
      accessibleModules.includes("control-center"));

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Brand area */}
      <div className="flex items-center justify-between px-4 py-[18px]">
        {!collapsed && (
          <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background text-[13px] font-extrabold leading-none">R</span>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.03em] text-sidebar-foreground">
              Requity
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-sidebar-hover transition-colors text-sidebar-foreground/60"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Main navigation */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (item.activePaths?.some(
              (p) => pathname === p || pathname.startsWith(p + "/")
            ) ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav items */}
      <div className="px-2 pb-2 space-y-0.5">
        {showChatter && (
          <Link
            href="/chat"
            className={cn(
              "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors relative",
              pathname.startsWith("/chat")
                ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
            )}
            title={collapsed ? "Chatter" : undefined}
          >
            <div className="relative flex-shrink-0">
              <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {collapsed && totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-[17px] min-w-[20px] px-[7px] flex items-center justify-center rounded-full bg-[#F0719B] text-white text-[10px] font-bold">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            {!collapsed && <span>Chatter</span>}
            {!collapsed && totalUnread > 0 && (
              <span className="ml-auto h-[17px] min-w-[20px] px-[7px] flex items-center justify-center rounded-full bg-[#F0719B] text-white text-[10px] font-bold">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
        )}
        {showKnowledgeBase && (
          <Link
            href="/sops"
            className={cn(
              "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors",
              pathname.startsWith("/sops")
                ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
            )}
            title={collapsed ? "Knowledge Base" : undefined}
          >
            <BookOpen className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Knowledge Base</span>}
          </Link>
        )}
        {showControlCenter && (
          <Link
            href="/control-center"
            className={cn(
              "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors",
              pathname.startsWith("/control-center")
                ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
            )}
            title={collapsed ? "Control Center" : undefined}
          >
            <Cog className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Control Center</span>}
          </Link>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User footer */}
      <div className="px-4 py-3">
        {!collapsed && (
          <div className="text-[11px] text-sidebar-foreground/40 font-medium">
            <span className="capitalize">{isViewingAs ? effectiveViewRole : (isSuperAdmin ? "Super Admin" : role)}</span> Portal
          </div>
        )}
      </div>
    </aside>
  );
}
