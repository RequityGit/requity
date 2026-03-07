"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TabConfig {
  label: string;
  href: string;
  disabled?: boolean;
}

const TABS: TabConfig[] = [
  { label: "Overview", href: "/control-center" },
  { label: "Users & Roles", href: "/control-center/users" },
  { label: "Loan Condition Templates", href: "/control-center/conditions" },
  { label: "Email Templates", href: "/control-center/email-templates" },
  { label: "User Email Templates", href: "/control-center/user-email-templates" },
  { label: "Term Sheet Templates", href: "/control-center/term-sheets" },
  {
    label: "Underwriting Assumptions",
    href: "/control-center/underwriting",
  },
  { label: "Payoff Settings", href: "/control-center/payoff-settings" },
  { label: "Field Manager", href: "/control-center/field-manager" },
  { label: "Pricing Engine", href: "/control-center/pricing", disabled: true },
  {
    label: "System Settings",
    href: "/control-center/settings",
    disabled: true,
  },
  { label: "Audit Log", href: "/control-center/audit", disabled: true },
];

export function ControlCenterTabs() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="border-b">
        <nav className="-mb-px flex space-x-6" aria-label="Control Center tabs">
          {TABS.map((tab) => {
            const isActive =
              tab.href === "/control-center"
                ? pathname === "/control-center"
                : pathname.startsWith(tab.href);

            if (tab.disabled) {
              return (
                <Tooltip key={tab.href}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 py-3 text-sm font-medium",
                        "text-muted-foreground/50 cursor-not-allowed"
                      )}
                    >
                      {tab.label}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Soon
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
