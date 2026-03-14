"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Table2,
  AlignLeft,
  BarChart2,
  Layers,
  Home,
  Phone,
  FileText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolboxItem = {
  id: string;
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
};

type ToolboxSection = {
  id: string;
  label: string;
  items: ToolboxItem[];
};

const SECTIONS: ToolboxSection[] = [
  {
    id: "lending-models",
    label: "Lending Models",
    items: [
      {
        id: "comm-model",
        label: "Comm Model",
        desc: "Commercial bridge loan underwriting and cash flow analysis.",
        href: "/models/commercial",
        icon: Table2,
      },
      {
        id: "rtl-model",
        label: "RTL Model",
        desc: "Residential transition loan sizing and term calculations.",
        href: "/models/rtl",
        icon: AlignLeft,
      },
      {
        id: "dscr-model",
        label: "DSCR Model",
        desc: "Debt service coverage ratio analysis and lender rate pricing.",
        href: "/models/dscr",
        icon: BarChart2,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        id: "servicing",
        label: "Servicing",
        desc: "Loan payment schedules, billing cycles, and draw management.",
        href: "/servicing",
        icon: Layers,
      },
      {
        id: "investments",
        label: "Investments",
        desc: "Property portfolio, asset management, and acquisition tracking.",
        href: "/funds",
        icon: Home,
      },
      {
        id: "power-dialer",
        label: "Power Dialer",
        desc: "Outbound call sequencing and borrower outreach automation.",
        href: "/dialer",
        icon: Phone,
      },
    ],
  },
  {
    id: "records-documents",
    label: "Records & Documents",
    items: [
      {
        id: "document-center",
        label: "Document Center",
        desc: "All documents across loans, entities, and investors in one place.",
        href: "/documents",
        icon: FileText,
      },
      {
        id: "borrower-entities",
        label: "Borrower Entities",
        desc: "Borrower legal entities, signatories, and ownership records.",
        href: "/borrowers/entities",
        icon: Users,
      },
    ],
  },
];

export default function ToolboxPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Toolbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Specialized tools for lending, operations, and records management.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.id} className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
            {section.label}
          </p>
          <div className="rounded-lg border border-border bg-border overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {section.items.map((item) => {
                if (item.soon) {
                  return (
                    <div
                      key={item.id}
                      className="relative bg-background p-4 text-left opacity-40 cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                          <item.icon
                            size={16}
                            strokeWidth={1.5}
                            className="text-foreground"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {item.label}
                            </span>
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 bg-muted text-muted-foreground">
                              Soon
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative bg-background p-4 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <item.icon
                          size={16}
                          strokeWidth={1.5}
                          className="text-foreground"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate block">
                          {item.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.5}
                      className="absolute top-3 right-3 text-muted-foreground"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
