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
  ChevronDown,
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
  FlaskConical,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useViewAs } from "@/contexts/view-as-context";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Additional path prefixes that should highlight this nav item */
  activePaths?: string[];
  /** Module name for access control filtering (admin nav only) */
  moduleName?: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  basePath: string;
  moduleName?: string;
  /** Additional path prefixes that should expand/highlight this group */
  activePaths?: string[];
  children: { label: string; href: string; badge?: number }[];
}

type NavEntry = NavItem | NavGroup;

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry && "basePath" in entry;
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

const adminNav: NavEntry[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, moduleName: "dashboard" },
  {
    label: "CRM",
    icon: Contact,
    basePath: "/admin/crm",
    moduleName: "crm",
    activePaths: ["/admin/dialer"],
    children: [
      { label: "Contacts", href: "/admin/crm/contacts" },
      { label: "Companies", href: "/admin/crm/companies" },
      { label: "Power Dialer", href: "/admin/dialer" },
    ],
  },
  {
    label: "Pipeline",
    icon: Columns3,
    basePath: "/admin/pipeline",
    moduleName: "pipeline",
    children: [
      { label: "Debt", href: "/admin/pipeline/debt" },
      { label: "Equity", href: "/admin/pipeline/equity" },
    ],
  },
  {
    label: "DSCR Pricing",
    href: "/admin/dscr",
    icon: Calculator,
    activePaths: ["/admin/dscr"],
    moduleName: "dscr-pricing",
  },
  {
    label: "Models",
    icon: FlaskConical,
    basePath: "/admin/models",
    moduleName: "models",
    children: [
      { label: "Commercial", href: "/admin/models/commercial" },
      { label: "RTL", href: "/admin/models/rtl" },
      { label: "DSCR", href: "/admin/models/dscr" },
    ],
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
    icon: Settings2,
    basePath: "/admin/operations",
    moduleName: "operations",
    activePaths: ["/admin/operations/tasks", "/admin/operations/approvals"],
    children: [
      { label: "Tasks", href: "/admin/operations/tasks" },
      { label: "Approvals", href: "/admin/operations/approvals" },
    ],
  },
];

function getNavEntries(role: string): NavEntry[] {
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
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });

    // Fetch pending approvals count
    supabase
      .from("approval_requests" as never)
      .select("id", { count: "exact", head: true })
      .eq("status" as never, "pending" as never)
      .then(({ count }) => {
        setPendingApprovals(count ?? 0);
      });
  }, []);

  // Use view-as role for navigation when super admin is simulating
  const navRole = isViewingAs ? effectiveViewRole : role;
  const allNavEntries = getNavEntries(navRole);

  // Filter admin nav entries by module access and inject dynamic badges
  const filteredEntries =
    navRole === "admin" && accessibleModules && accessibleModules.length > 0
      ? allNavEntries.filter(
          (entry) => {
            const moduleName = isNavGroup(entry) ? entry.moduleName : entry.moduleName;
            return !moduleName || accessibleModules.includes(moduleName);
          }
        )
      : allNavEntries;

  // Inject pending approvals badge into Operations group
  const navEntries = filteredEntries.map((entry) => {
    if (isNavGroup(entry) && entry.basePath === "/admin/operations" && pendingApprovals > 0) {
      return {
        ...entry,
        children: entry.children.map((child) =>
          child.href === "/admin/operations/approvals"
            ? { ...child, badge: pendingApprovals }
            : child
        ),
      };
    }
    return entry;
  });

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
        {navEntries.map((entry) => {
          if (isNavGroup(entry)) {
            return (
              <NavGroupItem
                key={entry.basePath}
                group={entry}
                pathname={pathname}
                collapsed={collapsed}
              />
            );
          }

          const item = entry;
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

function NavGroupItem({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  const isGroupActive =
    pathname.startsWith(group.basePath + "/") ||
    pathname === group.basePath ||
    (group.activePaths?.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    ) ?? false);
  const [open, setOpen] = useState(isGroupActive);

  // Auto-expand when navigating into the group
  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  if (collapsed) {
    return (
      <Link
        href={group.children[0]?.href ?? group.basePath}
        className={cn(
          "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors",
          isGroupActive
            ? "bg-sidebar-active text-sidebar-foreground font-semibold"
            : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
        )}
        title={group.label}
      >
        <group.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors w-full",
            isGroupActive
              ? "text-sidebar-foreground font-semibold"
              : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
          )}
        >
          <group.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
              !open && "-rotate-90"
            )}
            strokeWidth={1.5}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 mt-0.5">
          {group.children.map((child) => {
            const isChildActive =
              pathname === child.href || pathname.startsWith(child.href + "/");
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center pl-7 pr-3 py-[7px] rounded-lg text-[12px] transition-colors",
                  isChildActive
                    ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
                )}
              >
                <span className="flex-1">{child.label}</span>
                {child.badge != null && child.badge > 0 && (
                  <span className="h-[17px] min-w-[20px] px-[7px] flex items-center justify-center rounded-full bg-[#F0719B] text-white text-[10px] font-bold">
                    {child.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
