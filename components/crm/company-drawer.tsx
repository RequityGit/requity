"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CRM_COMPANY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { X, Building2 } from "lucide-react";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import type { CompanyRowV2 } from "./crm-v2-page";

// ── Company Drawer ─────────────────────────────────────────────────────

interface CompanyDrawerProps {
  company: CompanyRowV2;
  onClose: () => void;
}

export function CompanyDrawer({ company, onClose }: CompanyDrawerProps) {
  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-card border-l z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{company.name}</div>
              <div className="text-sm text-muted-foreground">
                {CRM_COMPANY_TYPES.find((t) => t.value === company.company_type)?.label ?? company.company_type}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex border-b">
        {[
          { l: "Contacts", v: company.contact_count.toString() },
          { l: "Files", v: company.file_count.toString() },
          { l: "Status", v: company.is_active !== false ? "Active" : "Inactive" },
        ].map((s, i) => (
          <div
            key={s.l}
            className={cn(
              "flex-1 px-5 py-3 text-center",
              i < 2 && "border-r"
            )}
          >
            <div className="text-[11px] text-muted-foreground">{s.l}</div>
            <div className="font-mono text-sm font-semibold text-foreground mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-1">
          {[
            { l: "Location", v: company.city && company.state ? `${company.city}, ${company.state}` : company.city || company.state || "—" },
            { l: "Status", v: company.is_active !== false ? "Active" : "Inactive" },
            { l: "Website", v: company.website || "—", link: !!company.website },
            { l: "Email", v: company.email || "—" },
          ].map((f) => (
            <div key={f.l} className="flex items-center justify-between py-2.5 border-b">
              <span className="text-sm text-muted-foreground">{f.l}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  f.link ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                )}
              >
                {f.v}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5 border-b">
            <span className="text-sm text-muted-foreground">Phone</span>
            <ClickToCallNumber number={company.phone} className="text-sm font-medium" />
          </div>
        </div>

        {company.notes && (
          <div className="mt-6 bg-muted/50 rounded-lg p-3.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</div>
            <div className="text-sm text-foreground leading-relaxed">{company.notes}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 justify-center" asChild>
          <Link href={`/admin/crm/companies/${company.id}`}>
            <Building2 className="h-3.5 w-3.5" />
            Full Details
          </Link>
        </Button>
      </div>
    </div>
  );
}
