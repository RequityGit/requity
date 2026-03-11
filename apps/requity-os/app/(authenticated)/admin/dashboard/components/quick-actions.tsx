"use client";

import { Plus, FileBarChart, MailOpen, Shield } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "New Deal",
    icon: Plus,
    color: "border-[#1B7A44]/15 bg-[#1B7A44]/5 text-[#1B7A44] hover:bg-[#1B7A44]/10",
    href: "/admin/pipeline",
  },
  {
    label: "Run Reports",
    icon: FileBarChart,
    color: "border-gold/15 bg-gold/5 text-gold hover:bg-gold/10",
    href: "/admin/reports",
  },
  {
    label: "Check Inbox",
    icon: MailOpen,
    color: "border-[#2E6EA6]/15 bg-[#2E6EA6]/5 text-[#2E6EA6] hover:bg-[#2E6EA6]/10",
    href: "/admin/inbox",
  },
  {
    label: "Compliance",
    icon: Shield,
    color: "border-muted-foreground/15 bg-muted-foreground/5 text-muted-foreground hover:bg-muted-foreground/10",
    href: "/admin/compliance",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {actions.map((q) => {
        const Icon = q.icon;
        return (
          <Link
            key={q.label}
            href={q.href}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3.5 text-sm font-semibold transition-colors duration-150 ${q.color}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {q.label}
          </Link>
        );
      })}
    </div>
  );
}
