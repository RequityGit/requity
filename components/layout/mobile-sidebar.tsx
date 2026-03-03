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
  X,
  User,
} from "lucide-react";
import { useViewAs } from "@/contexts/view-as-context";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useEffect } from "react";

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
    label: "Originations",
    href: "/admin/originations",
    icon: Briefcase,
    activePaths: ["/admin/loans", "/admin/conditions", "/admin/pricing"],
    moduleName: "pipeline",
  },
  {
    label: "DSCR Pricing",
    href: "/admin/dscr",
    icon: Calculator,
    moduleName: "dscr-pricing",
  },
  {
    label: "Equity",
    href: "/admin/equity-pipeline",
    icon: Building2,
    moduleName: "pipeline",
  },
  { label: "Servicing", href: "/admin/servicing", icon: Banknote, moduleName: "servicing" },
  {
    label: "Investments",
    href: "/admin/funds",
    icon: Landmark,
    activePaths: ["/admin/capital-calls", "/admin/distributions"],
    moduleName: "investments",
  },
  { label: "Documents", href: "/admin/documents", icon: FolderOpen, moduleName: "documents" },
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

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className="absolute inset-y-0 left-0 w-[280px] flex flex-col animate-in slide-in-from-left duration-300"
        style={{ background: "#0A1628" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <img
            src="https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20White.svg?v=2"
            alt="Requity"
            className="h-12 w-auto"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/10 transition-colors text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
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
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-gold/20 text-gold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        {showChatter && (
          <div className="px-3 pb-1">
            <Link
              href="/chat"
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] relative",
                pathname.startsWith("/chat")
                  ? "bg-gold/20 text-gold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="relative flex-shrink-0">
                <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
                {totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-[#F0719B] text-white text-[10px] font-bold">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span>Chatter</span>
              {totalUnread > 0 && (
                <span className="ml-auto bg-[#F0719B] text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </Link>
          </div>
        )}
        {showKnowledgeBase && (
          <div className="px-3 pb-2">
            <Link
              href="/sops"
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                pathname.startsWith("/sops")
                  ? "bg-gold/20 text-gold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <BookOpen className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
              <span>Knowledge Base</span>
            </Link>
          </div>
        )}
        {showControlCenter && (
          <div className="px-3 pb-2">
            <Link
              href="/control-center"
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                pathname.startsWith("/control-center")
                  ? "bg-gold/20 text-gold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Cog className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
              <span>Control Center</span>
            </Link>
          </div>
        )}
        <div
          className="p-4 border-t border-white/10"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="text-xs text-white/50">
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
      </div>
    </div>
  );
}
