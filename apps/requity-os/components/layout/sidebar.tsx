"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Landmark,
  FolderOpen,
  Hammer,
  ListChecks,
  Contact,
  Banknote,
  Cog,
  FlaskConical,
  Layers,
  Building2,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useViewAs } from "@/contexts/view-as-context";
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
    label: "Contacts",
    href: "/admin/crm/contacts",
    icon: Contact,
    moduleName: "crm",
    activePaths: ["/admin/crm/contacts"],
  },
  {
    label: "Companies",
    href: "/admin/crm/companies",
    icon: Building2,
    moduleName: "crm",
    activePaths: ["/admin/crm/companies"],
  },
  {
    label: "Pipeline",
    href: "/admin/pipeline",
    icon: Layers,
    moduleName: "pipeline",
    activePaths: ["/admin/pipeline"],
  },
  {
    label: "Operations",
    href: "/admin/operations/tasks",
    icon: ListChecks,
    moduleName: "operations",
    activePaths: ["/admin/operations"],
  },
  {
    label: "Toolbox",
    icon: Wrench,
    basePath: "/admin/toolbox",
    activePaths: [
      "/admin/documents",
      "/admin/servicing",
      "/admin/funds",
      "/admin/capital-calls",
      "/admin/distributions",
      "/admin/models",
      "/admin/dialer",
    ],
    children: [
      { label: "Documents", href: "/admin/documents" },
      { label: "Servicing", href: "/admin/servicing" },
      { label: "Investments", href: "/admin/funds" },
      { label: "Comm Model", href: "/admin/models/commercial" },
      { label: "RTL Model", href: "/admin/models/rtl" },
      { label: "DSCR Model", href: "/admin/models/dscr" },
      { label: "Power Dialer", href: "/admin/dialer" },
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { effectiveViewRole, isViewingAs } = useViewAs();
  // Use view-as role for navigation when super admin is simulating
  const navRole = isViewingAs ? effectiveViewRole : role;

  // Eagerly prefetch the most-used routes on mount for faster navigation
  useEffect(() => {
    if (navRole === "admin") {
      router.prefetch("/admin/dashboard");
      router.prefetch("/admin/crm/contacts");
      router.prefetch("/admin/pipeline");
      router.prefetch("/admin/crm/companies");
      router.prefetch("/admin/operations/tasks");
    } else if (navRole === "borrower") {
      router.prefetch("/borrower/dashboard");
      router.prefetch("/borrower/draws");
    } else if (navRole === "investor") {
      router.prefetch("/investor/dashboard");
      router.prefetch("/investor/funds");
    }
  }, [navRole, router]);
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

  const navEntries = filteredEntries;

  // Check if bottom nav items are accessible
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
