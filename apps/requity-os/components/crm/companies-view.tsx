"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCrmCompanyAction } from "@/app/(authenticated)/admin/crm/actions";
import { useToast } from "@/components/ui/use-toast";
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
  MoreHorizontal,
  Eye,
  Trash2,
} from "lucide-react";
import { CompanyStatusDot } from "./crm-primitives";
import type { CompanyRowV2 } from "./crm-v2-page";

interface CompaniesViewProps {
  companies: CompanyRowV2[];
  isSuperAdmin?: boolean;
}

export function CompaniesView({ companies, isSuperAdmin = false }: CompaniesViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [companySearch, setCompanySearch] = useState("");
  const [companySortKey, setCompanySortKey] = useState<string>("name");
  const [companySortDir, setCompanySortDir] = useState<"asc" | "desc">("asc");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteCrmCompanyAction(deleteTarget.id);
      if (result.error) {
        toast({ title: "Error deleting company", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Company deleted" });
        router.refresh();
      }
    } catch {
      toast({ title: "Error deleting company", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (companySearch.trim()) {
      const q = companySearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_type.toLowerCase().includes(q) ||
          c.company_types?.some((ct) => ct.toLowerCase().includes(q))
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
    <div className="space-y-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
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
          <div className="flex-1" />
          <AddCompanyDialog />
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
                        <div className="flex flex-wrap gap-1">
                          {(c.company_types?.length ? c.company_types : [c.company_type]).map((ct) => (
                            <span key={ct} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {CRM_COMPANY_TYPES.find((t) => t.value === ct)?.label ?? ct}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 num text-sm text-foreground text-right">
                        {c.contact_count}
                      </td>
                      <td className="px-4 py-3 num text-sm text-foreground text-right">
                        {c.file_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <CompanyStatusDot isActive={c.is_active} />
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/crm/companies/${c.id}`)}
                              className="gap-2 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View / Edit
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                                  className="gap-2 text-xs text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This
              company will be removed from the CRM. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
