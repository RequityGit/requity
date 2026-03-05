"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/kpi-card";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import {
  CRM_COMPANY_TYPES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Building2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { CompanyStatusDot } from "./crm-primitives";
import type { CompanyRowV2 } from "./crm-v2-page";

interface CompaniesViewProps {
  companies: CompanyRowV2[];
}

export function CompaniesView({ companies }: CompaniesViewProps) {
  const router = useRouter();

  const [companySearch, setCompanySearch] = useState("");
  const [companySortKey, setCompanySortKey] = useState<string>("name");
  const [companySortDir, setCompanySortDir] = useState<"asc" | "desc">("asc");

  const companyStats = useMemo(() => {
    const active = companies.filter((c) => c.is_active !== false).length;
    const inactive = companies.length - active;
    return { active, inactive };
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (companySearch.trim()) {
      const q = companySearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_type.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const key = companySortKey as keyof CompanyRowV2;
      let av = a[key];
      let bv = b[key];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") av = av.toLowerCase() as never;
      if (typeof bv === "string") bv = bv.toLowerCase() as never;

      if (av < bv) return companySortDir === "asc" ? -1 : 1;
      if (av > bv) return companySortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, companySearch, companySortKey, companySortDir]);

  function handleCompanySort(key: string) {
    if (companySortKey === key) {
      setCompanySortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCompanySortKey(key);
      setCompanySortDir("asc");
    }
  }

  function SortHeader({
    label,
    sortKey,
    className,
  }: {
    label: string;
    sortKey: string;
    className?: string;
  }) {
    const isActive = companySortKey === sortKey;
    return (
      <th
        onClick={() => handleCompanySort(sortKey)}
        className={cn(
          "text-xs font-medium text-muted-foreground text-left px-4 py-2.5 cursor-pointer select-none whitespace-nowrap",
          className
        )}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive ? (
            companySortDir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div />
        <AddCompanyDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Companies"
          value={companies.length.toString()}
          description="Across all types"
          icon={<Building2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Active"
          value={companyStats.active.toString()}
          description="Active relationships"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Lenders"
          value={companies.filter((c) => c.company_type === "lender").length.toString()}
          description="Lending partners"
          icon={<Building2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Files"
          value={companies.reduce((s, c) => s + c.file_count, 0).toString()}
          description="Uploaded documents"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            placeholder="Search companies..."
            className="pl-9 h-9"
          />
          {companySearch && (
            <button
              onClick={() => setCompanySearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <SortHeader label="Company" sortKey="name" />
                  <SortHeader label="Type" sortKey="company_type" />
                  <SortHeader label="Contacts" sortKey="contact_count" className="text-right" />
                  <SortHeader label="Files" sortKey="file_count" className="text-right" />
                  <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Location</th>
                  <SortHeader label="Status" sortKey="is_active" />
                  <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5 w-12" />
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No companies found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/admin/crm/companies/${c.id}`)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/50",
                        i < filteredCompanies.length - 1 && "border-b border-border/50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {CRM_COMPANY_TYPES.find((t) => t.value === c.company_type)?.label ?? c.company_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground text-right">
                        {c.contact_count}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-foreground text-right">
                        {c.file_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <CompanyStatusDot isActive={c.is_active} />
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/crm/companies/${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <Briefcase className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {filteredCompanies.length} of {companies.length} companies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
