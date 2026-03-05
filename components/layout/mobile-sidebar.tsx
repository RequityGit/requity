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
  X,
  User,
  FlaskConical,
} from "lucide-react";
import { useViewAs } from "@/contexts/view-as-context";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
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
  { label: "Dashboard", href: "/investor/dashboard", icon: LayoutDashboard },
  {
    label: "My Investments",
    href: "/investor/funds",
    icon: Landmark,
    activePaths: ["/investor/capital-calls", "/investor/distributions"],
  },
  { label: "Documents", href: "/investor/documents", icon: FileText },
  { label: "Account", href: "/investor/account", icon: User },
];

const borrowerNav: NavItem[] = [
  { label: "Dashboard", href: "/borrower/dashboard", icon: LayoutDashboard },
  { label: "Draw Requests", href: "/borrower/draws", icon: Hammer },
  { label: "Payments", href: "/borrower/payments", icon: CreditCard },
  { label: "Documents", href: "/borrower/documents", icon: FileText },
  { label: "Account", href: "/borrower/account", icon: User },
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
    activePaths: ["/admin/originations", "/admin/loans", "/admin/conditions", "/admin/pricing"],
    moduleName: "pipeline",
  },
  {
    label: "DSCR Pricing",
    href: "/admin/dscr",
    icon: Calculator,
    moduleName: "dscr-pricing",
  },
  { label: "Models", href: "/admin/models", icon: FlaskConical, activePaths: ["/admin/models"], moduleName: "models" },
  { label: "Servicing", href: "/admin/servicing", icon: Banknote, moduleName: "servicing" },
  {
    label: "Investments",
    href: "/admin/funds",
    icon: Landmark,
    activePaths: ["/admin/capital-calls", "/admin/distributions"],
    moduleName: "investments",
  },
  { label: "Documents", href: "/admin/document-center", icon: FolderOpen, activePaths: ["/admin/documents"], moduleName: "documents" },
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
  const { totalUnread } = useUnreadCounts(userId);

  const navRole = isViewingAs ? effectiveViewRole : role;
  const allNavItems = getNavItems(navRole);

  // Filter admin nav items by module access
  const navItems =
    navRole === "admin" && accessibleModules && accessibleModules.length > 0
      ? allNavItems.filter(
          (item) => !item.moduleName || accessibleModules.includes(item.moduleName)
        )
      : allNavItems;

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

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-[18px]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background text-[13px] font-extrabold leading-none">R</span>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.03em] text-foreground">
              Requity
            </span>
          </div>
        </div>

        <Separator />

        {/* Nav items */}
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
                  "flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] transition-colors min-h-[44px]",
                  isActive
                    ? "bg-accent text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                )}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="px-2 pb-2 space-y-0.5">
          {showChatter && (
            <Link
              href="/chat"
              className={cn(
                "flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] transition-colors min-h-[44px] relative",
                pathname.startsWith("/chat")
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
              )}
            >
              <div className="relative flex-shrink-0">
                <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </div>
              <span>Chatter</span>
              {totalUnread > 0 && (
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
                "flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] transition-colors min-h-[44px]",
                pathname.startsWith("/sops")
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
              )}
            >
              <BookOpen className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
              <span>Knowledge Base</span>
            </Link>
          )}
          {showControlCenter && (
            <Link
              href="/control-center"
              className={cn(
                "flex items-center gap-2.5 px-3 py-3 rounded-lg text-[13px] transition-colors min-h-[44px]",
                pathname.startsWith("/control-center")
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
              )}
            >
              <Cog className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
              <span>Control Center</span>
            </Link>
          )}
        </div>

        <Separator />

        <div
          className="px-4 py-3"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="text-[11px] text-muted-foreground font-medium">
            <span className="capitalize">
              {isViewingAs
                ? effectiveViewRole
                : isSuperAdmin
                  ? "Super Admin"
                  : role}
            </span>{" "}
            Portal
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
