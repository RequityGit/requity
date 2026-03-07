"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Hammer,
  CreditCard,
  Landmark,
  Banknote,
  Briefcase,
  Contact,
  ListTodo,
  MoreHorizontal,
} from "lucide-react";
import { useViewAs } from "@/contexts/view-as-context";

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  activePaths?: string[];
}

const borrowerBottomNav: BottomNavItem[] = [
  { label: "Dashboard", href: "/borrower/dashboard", icon: LayoutDashboard },
  {
    label: "My Loans",
    href: "/borrower/dashboard",
    icon: Briefcase,
    activePaths: ["/borrower/loans"],
  },
  { label: "Documents", href: "/borrower/documents", icon: FileText },
];

const investorBottomNav: BottomNavItem[] = [
  { label: "Dashboard", href: "/investor/dashboard", icon: LayoutDashboard },
  {
    label: "Portfolio",
    href: "/investor/funds",
    icon: Landmark,
    activePaths: ["/investor/capital-calls", "/investor/distributions"],
  },
  {
    label: "Distributions",
    href: "/investor/distributions",
    icon: Banknote,
  },
  { label: "Documents", href: "/investor/documents", icon: FileText },
];

const adminBottomNav: BottomNavItem[] = [
  {
    label: "Pipeline",
    href: "/admin/pipeline",
    icon: Briefcase,
    activePaths: ["/admin/originations", "/admin/loans"],
  },
  { label: "Contacts", href: "/admin/crm", icon: Contact },
  {
    label: "Tasks",
    href: "/admin/operations",
    icon: ListTodo,
  },
  { label: "More", href: "/admin/dashboard", icon: MoreHorizontal },
];

function getBottomNavItems(role: string): BottomNavItem[] {
  switch (role) {
    case "investor":
      return investorBottomNav;
    case "borrower":
      return borrowerBottomNav;
    case "admin":
      return adminBottomNav;
    default:
      return [];
  }
}

export function MobileBottomNav({
  role,
  userId,
}: {
  role: string;
  userId?: string;
}) {
  const pathname = usePathname();
  const { effectiveViewRole, isViewingAs } = useViewAs();

  const navRole = isViewingAs ? effectiveViewRole : role;
  const navItems = getBottomNavItems(navRole);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (item.activePaths?.some(
              (p) => pathname === p || pathname.startsWith(p + "/")
            ) ?? false);

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-2 py-1 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon
                className="h-5 w-5"
                strokeWidth={1.5}
              />
              <span className={cn(
                "text-[10px] leading-tight",
                isActive && "font-semibold"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
