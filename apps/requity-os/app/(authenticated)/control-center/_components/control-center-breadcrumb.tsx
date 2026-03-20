"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { NAV_GROUPS } from "../_config/nav";

/** Resolve pathname to the matching nav item label */
function resolveLabel(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label;
      }
    }
  }
  return null;
}

export function ControlCenterBreadcrumb() {
  const pathname = usePathname();

  // Don't render on the root control-center page
  if (pathname === "/control-center") return null;

  const label = resolveLabel(pathname);
  if (!label) return null;

  return (
    <nav className="flex items-center gap-1.5 mb-4 text-sm">
      <Link
        href="/control-center"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} strokeWidth={1.5} className="shrink-0" />
        <span>Control Center</span>
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground font-medium">{label}</span>
    </nav>
  );
}
