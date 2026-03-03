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

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Additional path prefixes that should highlight this nav item */
  activePaths?: string[];
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
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "CRM",
    href: "/admin/crm",
    icon: Contact,
    activePaths: ["/admin/investors", "/admin/borrowers"],
  },
  {
    label: "Pipeline",
    href: "/admin/pipeline",
    icon: Columns3,
    activePaths: ["/admin/originations", "/admin/equity-pipeline", "/admin/loans", "/admin/conditions", "/admin/pricing"],
  },
  {
    label: "DSCR Pricing",
    href: "/admin/dscr",
    icon: Calculator,
    activePaths: ["/admin/dscr"],
  },
  { label: "Servicing", href: "/admin/servicing", icon: Banknote },
  {
    label: "Investments",
    href: "/admin/funds",
    icon: Landmark,
    activePaths: ["/admin/capital-calls", "/admin/distributions"],
  },
  {
    label: "Documents",
    href: "/admin/document-center",
    icon: FolderOpen,
    activePaths: ["/admin/documents"],
  },
  {
    label: "Operations",
    href: "/admin/operations",
    icon: Settings2,
    activePaths: ["/admin/operations/approvals"],
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

export function Sidebar({ role, isSuperAdmin }: { role: string; isSuperAdmin?: boolean }) {
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
  const navItems = getNavItems(navRole);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link href={`/${role}/dashboard`} className="flex items-center">
            <img
              src="https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2"
              alt="Requity"
              className="h-16 w-auto"
            />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
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
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-1">
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
            pathname.startsWith("/chat")
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
          title={collapsed ? "Chatter" : undefined}
        >
          <div className="relative flex-shrink-0">
            <MessageSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-[#F0719B] text-white text-[10px] font-bold">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          {!collapsed && <span>Chatter</span>}
          {!collapsed && totalUnread > 0 && (
            <span className="ml-auto bg-[#F0719B] text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Link>
      </div>
      <div className="px-2 pb-2">
        <Link
          href="/sops"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith("/sops")
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
          title={collapsed ? "Knowledge Base" : undefined}
        >
          <BookOpen className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Knowledge Base</span>}
        </Link>
      </div>
      {isSuperAdmin && !isViewingAs && (
        <div className="px-2 pb-2">
          <Link
            href="/control-center"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith("/control-center")
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            title={collapsed ? "Control Center" : undefined}
          >
            <Cog className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Control Center</span>}
          </Link>
        </div>
      )}
      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <div className="text-xs text-white/50">
            <span className="capitalize">{isViewingAs ? effectiveViewRole : (isSuperAdmin ? "Super Admin" : role)}</span> Portal
          </div>
        )}
      </div>
    </aside>
  );
}
