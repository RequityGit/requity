"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Building2,
  Users,
  Briefcase,
  PiggyBank,
  CreditCard,
  Home,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Landmark,
  FolderOpen,
  Receipt,
  Hammer,
  Settings2,
  Contact,
  Calculator,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const investorNav: NavItem[] = [
  { label: "Dashboard", href: "/investor/dashboard", icon: LayoutDashboard },
  { label: "My Investments", href: "/investor/funds", icon: Landmark },
  { label: "Contributions", href: "/investor/capital-calls", icon: DollarSign },
  {
    label: "Distributions",
    href: "/investor/distributions",
    icon: PiggyBank,
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
  { label: "CRM", href: "/admin/crm", icon: Contact },
  { label: "Investors", href: "/admin/investors", icon: Users },
  { label: "Borrowers", href: "/admin/borrowers", icon: Building2 },
  { label: "Loans", href: "/admin/loans", icon: Home },
  { label: "Conditions", href: "/admin/conditions", icon: ClipboardList },
  { label: "Pricing", href: "/admin/pricing", icon: Calculator },
  { label: "Investments", href: "/admin/funds", icon: Landmark },
  { label: "Documents", href: "/admin/documents", icon: FolderOpen },
  { label: "Operations", href: "/admin/operations", icon: Settings2 },
  {
    label: "Contributions",
    href: "/admin/capital-calls",
    icon: DollarSign,
  },
  {
    label: "Distributions",
    href: "/admin/distributions",
    icon: Receipt,
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

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = getNavItems(role);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r bg-[#1a2b4a] text-white flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-teal-400" />
            <span className="font-bold text-lg">Requity</span>
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
            pathname === item.href || pathname.startsWith(item.href + "/");
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

      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <div className="text-xs text-white/50">
            <span className="capitalize">{role}</span> Portal
          </div>
        )}
      </div>
    </aside>
  );
}
