"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "My Investments", href: "/investor/funds" },
  { label: "Contributions", href: "/investor/capital-calls" },
  { label: "Distributions", href: "/investor/distributions" },
];

export function InvestmentTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="flex gap-4 overflow-x-auto mobile-scroll" aria-label="Investment navigation">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-1 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap min-h-[44px] flex items-center",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
