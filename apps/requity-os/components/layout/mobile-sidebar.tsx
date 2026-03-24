"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SUPABASE_URL } from "@/lib/supabase/constants";
import {
  LayoutDashboard,
  FileText,
  Building2,
  CreditCard,
  Landmark,
  Hammer,
  Contact,
  Cog,
  Layers,
  ListChecks,
  User,
  Wrench,
} from "lucide-react";
import { useViewAs } from "@/contexts/view-as-context";
import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  activePaths?: string[];
  moduleName?: string;
}

const investorNav: NavItem[] = [
  { label: "Dashboard", href: "/i/dashboard", icon: LayoutDashboard },
  {
    label: "My Investments",
    href: "/i/funds",
    icon: Landmark,
    activePaths: ["/i/capital-calls", "/i/distributions"],
  },
  { label: "Documents", href: "/i/documents", icon: FileText },
  { label: "Account", href: "/i/account", icon: User },
];

const borrowerNav: NavItem[] = [
  { label: "Dashboard", href: "/b/dashboard", icon: LayoutDashboard },
  { label: "Draw Requests", href: "/b/draws", icon: Hammer },
  { label: "Payments", href: "/b/payments", icon: CreditCard },
  { label: "Documents", href: "/b/documents", icon: FileText },
  { label: "Account", href: "/b/account", icon: User },
];

// Match desktop sidebar: Pipeline, Contacts, Companies, Tasks, Toolbox
const adminNav: NavItem[] = [
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: Layers,
    activePaths: ["/pipeline"],
    moduleName: "pipeline",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Contact,
    activePaths: ["/contacts"],
    moduleName: "crm",
  },
  {
    label: "Companies",
    href: "/companies",
    icon: Building2,
    activePaths: ["/companies"],
    moduleName: "crm",
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ListChecks,
    activePaths: ["/tasks"],
    moduleName: "operations",
  },
  {
    label: "Toolbox",
    href: "/toolbox",
    icon: Wrench,
    activePaths: [
      "/toolbox",
      "/conditions",
      "/documents",
      "/servicing",
      "/funds",
      "/capital-calls",
      "/distributions",
      "/models",
      "/dialer",
      "/borrowers/entities",
    ],
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

interface MobileSidebarProps {
  role: string;
  isSuperAdmin?: boolean;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  accessibleModules?: string[];
}

export function MobileSidebar({
  role,
  isSuperAdmin,
  isOpen,
  onClose,
  userId,
  accessibleModules,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const { effectiveViewRole, isViewingAs } = useViewAs();

  const navRole = isViewingAs ? effectiveViewRole : role;
  const allNavItems = getNavItems(navRole);

  // Filter admin nav items by module access
  const navItems =
    navRole === "admin" && accessibleModules && accessibleModules.length > 0
      ? allNavItems.filter(
          (item) => !item.moduleName || accessibleModules.includes(item.moduleName)
        )
      : allNavItems;

  const showControlCenter =
    isSuperAdmin &&
    !isViewingAs &&
    (!accessibleModules ||
      accessibleModules.length === 0 ||
      accessibleModules.includes("control-center"));

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultHref =
    role === "admin" ? "/pipeline" : role === "investor" ? "/i/dashboard" : "/b/dashboard";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-[220px] p-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
      >
        {/* Header — match desktop: white Requity logo */}
        <div className="flex items-center justify-between px-4 py-[18px]">
          <Link href={defaultHref} className="flex items-center gap-2" onClick={onClose}>
            <img
              src={`${SUPABASE_URL}/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2`}
              alt="Requity"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Nav items — same classes as desktop sidebar */}
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
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors min-h-[44px]",
                  isActive
                    ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — Control Center, same as desktop */}
        <div className="px-2 pb-2 space-y-0.5">
          {showControlCenter && (
            <Link
              href="/control-center"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] transition-colors min-h-[44px]",
                pathname.startsWith("/control-center")
                  ? "bg-sidebar-active text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground font-medium"
              )}
            >
              <Cog className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
              <span>Control Center</span>
            </Link>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* User footer — match desktop */}
        <div
          className="px-4 py-3"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="text-[11px] text-sidebar-foreground/40 font-medium">
            <span className="capitalize">
              {isViewingAs ? effectiveViewRole : isSuperAdmin ? "Super Admin" : role}
            </span>{" "}
            Portal
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
