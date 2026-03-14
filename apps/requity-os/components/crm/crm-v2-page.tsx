"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/shared/kpi-card";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import { DeleteContactButton } from "@/components/crm/delete-contact-button";
import {
  CRM_RELATIONSHIP_TYPES,
  CRM_LIFECYCLE_STAGES,
  CRM_COMPANY_TYPES,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Clock,
  TrendingUp,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { CrmAvatar, RelPill, StageDot, CompanyStatusDot } from "./crm-primitives";
import { DeleteCompanyButton } from "./delete-company-button";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";

// ── Types ────────────────────────────────────────────────────────────────

export interface CrmContactRow {
  id: string;
  contact_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  company_id: string | null;
  lifecycle_stage: string | null;
  dnc: boolean;
  source: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_initials: string | null;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  activity_count: number;
  relationships: string[];
  notes: string | null;
  city: string | null;
  state: string | null;
}

export interface CompanyRowV2 {
  id: string;
  company_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  company_type: string;
  company_types: string[] | null;
  company_subtype: string | null;
  city: string | null;
  state: string | null;
  contact_count: number;
  file_count: number;
  active_deals: number;
  is_active: boolean | null;
  notes: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
}

interface CrmV2PageProps {
  contacts: CrmContactRow[];
  companies: CompanyRowV2[];
  teamMembers: TeamMember[];
  currentUserId: string;
  isSuperAdmin?: boolean;
  initialView?: "contacts" | "companies";
}

// ── Main Component ───────────────────────────────────────────────────────

export function CrmV2Page({
  contacts,
  companies,
  teamMembers,
  currentUserId,
  isSuperAdmin = false,
  initialView = "contacts",
}: CrmV2PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [activeView, setActiveView] = useState<"contacts" | "companies">(initialView);

  // Contact filters
  const [contactSearch, setContactSearch] = useState(searchParams.get("q") ?? "");
  const [relFilter, setRelFilter] = useState(searchParams.get("rel") ?? "all");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") ?? "all");
  const [contactSortKey, setContactSortKey] = useState<string>("last_contacted_at");
  const [contactSortDir, setContactSortDir] = useState<"asc" | "desc">("desc");

  // Company filters
  const [companySearch, setCompanySearch] = useState("");
  const [companySortKey, setCompanySortKey] = useState<string>("name");
  const [companySortDir, setCompanySortDir] = useState<"asc" | "desc">("asc");

  // URL sync for filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeView !== "contacts") params.set("view", activeView);
    if (contactSearch) params.set("q", contactSearch);
    if (relFilter !== "all") params.set("rel", relFilter);
    if (stageFilter !== "all") params.set("stage", stageFilter);
    const str = params.toString();
    const newUrl = str ? `?${str}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [activeView, contactSearch, relFilter, stageFilter]);

  // ── Contact Stats ────────────────────────────────────────────────────
  const contactStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contactedThisWeek = contacts.filter((c) => {
      if (!c.last_contacted_at) return false;
      return new Date(c.last_contacted_at) >= weekAgo;
    }).length;

    const needsFollowUp = contacts.filter((c) => {
      if (c.lifecycle_stage === "past") return false;
      if (!c.last_contacted_at) return true;
      return new Date(c.last_contacted_at) < thirtyDaysAgo;
    }).length;

    const pipeline = contacts.filter(
      (c) =>
        c.relationships.includes("borrower") &&
        c.lifecycle_stage !== "past"
    ).length;

    return { contactedThisWeek, needsFollowUp, pipeline };
  }, [contacts]);

  // ── Company Stats ────────────────────────────────────────────────────
  const companyStats = useMemo(() => {
    const active = companies.filter((c) => c.is_active !== false).length;
    const inactive = companies.length - active;
    return { active, inactive };
  }, [companies]);

  // ── Filter Contacts ──────────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    if (relFilter !== "all") {
      result = result.filter((c) => c.relationships.includes(relFilter));
    }

    if (stageFilter !== "all") {
      result = result.filter((c) => c.lifecycle_stage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      const key = contactSortKey as keyof CrmContactRow;
      let av = a[key];
      let bv = b[key];

      // Handle null values - push to end
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") av = av.toLowerCase() as never;
      if (typeof bv === "string") bv = bv.toLowerCase() as never;

      if (av < bv) return contactSortDir === "asc" ? -1 : 1;
      if (av > bv) return contactSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, contactSearch, relFilter, stageFilter, contactSortKey, contactSortDir]);

  // ── Filter Companies ─────────────────────────────────────────────────
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

  const hasContactFilters = contactSearch.trim() !== "" || relFilter !== "all" || stageFilter !== "all";

  function handleContactSort(key: string) {
    if (contactSortKey === key) {
      setContactSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setContactSortKey(key);
      setContactSortDir("asc");
    }
  }

  function handleCompanySort(key: string) {
    if (companySortKey === key) {
      setCompanySortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCompanySortKey(key);
      setCompanySortDir("asc");
    }
  }

  function clearAllFilters() {
    setContactSearch("");
    setRelFilter("all");
    setStageFilter("all");
  }

  // ── Sort Header ──────────────────────────────────────────────────────
  function SortHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
    className,
  }: {
    label: string;
    sortKey: string;
    currentSort: string;
    currentDir: "asc" | "desc";
    onSort: (key: string) => void;
    className?: string;
  }) {
    const isActive = currentSort === sortKey;
    return (
      <th
        onClick={() => onSort(sortKey)}
        className={cn(
          "text-xs font-medium text-muted-foreground text-left px-4 py-2.5 cursor-pointer select-none whitespace-nowrap",
          className
        )}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive ? (
            currentDir === "asc" ? (
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
      {/* View Toggle + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(
            [
              { key: "contacts" as const, label: "Contacts", icon: Users, count: contacts.length },
              { key: "companies" as const, label: "Companies", icon: Building2, count: companies.length },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeView === v.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
              <span
                className={cn(
                  "num text-[11px] px-1.5 py-0.5 rounded-md",
                  activeView === v.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {v.count}
              </span>
            </button>
          ))}
        </div>

        {activeView === "contacts" ? (
          <AddContactDialog teamMembers={teamMembers} currentUserId={currentUserId} />
        ) : (
          <AddCompanyDialog />
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeView === "contacts" ? (
          <>
            <KpiCard
              title="Total Contacts"
              value={contacts.length.toString()}
              description="Active relationships"
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              title="Contacted This Week"
              value={contactStats.contactedThisWeek.toString()}
              description="In last 7 days"
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <KpiCard
              title="Needs Follow-Up"
              value={contactStats.needsFollowUp.toString()}
              description="30+ days since contact"
              icon={<Clock className="h-5 w-5" />}
            />
            <KpiCard
              title="Pipeline"
              value={contactStats.pipeline.toString()}
              description="Borrower leads & prospects"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Contacts View */}
      {activeView === "contacts" && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-9 h-9"
              />
              {contactSearch && (
                <button
                  onClick={() => setContactSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={relFilter} onValueChange={setRelFilter}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <SelectValue placeholder="All Relationships" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationships</SelectItem>
                {CRM_RELATIONSHIP_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {CRM_LIFECYCLE_STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Chips */}
          {hasContactFilters && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Active:</span>
              {contactSearch && (
                <button
                  onClick={() => setContactSearch("")}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
                >
                  &ldquo;{contactSearch}&rdquo; <X className="h-2.5 w-2.5" />
                </button>
              )}
              {relFilter !== "all" && (
                <button
                  onClick={() => setRelFilter("all")}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
                >
                  {CRM_RELATIONSHIP_TYPES.find((r) => r.value === relFilter)?.label ?? relFilter}{" "}
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
              {stageFilter !== "all" && (
                <button
                  onClick={() => setStageFilter("all")}
                  className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
                >
                  {CRM_LIFECYCLE_STAGES.find((s) => s.value === stageFilter)?.label ?? stageFilter}{" "}
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Contacts Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <SortHeader label="Name" sortKey="first_name" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Company</th>
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Relationships</th>
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Email</th>
                    <SortHeader label="Phone" sortKey="phone" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    <SortHeader label="Stage" sortKey="lifecycle_stage" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Assigned</th>
                    <SortHeader label="Last Contacted" sortKey="last_contacted_at" currentSort={contactSortKey} currentDir={contactSortDir} onSort={handleContactSort} />
                    {isSuperAdmin && (
                      <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5 w-12" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 9 : 8} className="text-center py-16">
                        {hasContactFilters ? (
                          <div>
                            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No contacts match your filters</p>
                            <button onClick={clearAllFilters} className="text-xs text-blue-600 dark:text-blue-400 mt-1 hover:underline">
                              Clear Filters
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No contacts yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Add your first contact to start building your CRM</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c, i) => (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/contacts/${c.contact_number}`)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          i < filteredContacts.length - 1 && "border-b border-border/50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {c.first_name} {c.last_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {c.company_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.relationships.length > 0 ? (
                              c.relationships.map((r) => <RelPill key={r} type={r} />)
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                          {c.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          <ClickToCallNumber number={c.phone} />
                        </td>
                        <td className="px-4 py-3">
                          <StageDot stage={c.lifecycle_stage} />
                        </td>
                        <td className="px-4 py-3">
                          {c.assigned_to_name ? (
                            <div className="flex items-center gap-1.5">
                              <CrmAvatar text={c.assigned_to_initials ?? c.assigned_to_name.split(" ").map((p: string) => p[0]).join("").toUpperCase()} size="sm" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {c.assigned_to_name.split(" ")[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 num text-xs text-muted-foreground whitespace-nowrap">
                          {c.last_contacted_at ? formatDate(c.last_contacted_at) : "—"}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <DeleteContactButton
                              contactId={c.id}
                              contactName={`${c.first_name} ${c.last_name}`}
                              variant="icon"
                            />
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </span>
              <span className="num text-xs text-muted-foreground">
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Companies View */}
      {activeView === "companies" && (
        <div className="space-y-3">
          {/* Search */}
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

          {/* Companies Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <SortHeader label="Company" sortKey="name" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} />
                    <SortHeader label="Type" sortKey="company_type" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} />
                    <SortHeader label="Contacts" sortKey="contact_count" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} className="text-right" />
                    <SortHeader label="Files" sortKey="file_count" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} className="text-right" />
                    <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5">Location</th>
                    <SortHeader label="Status" sortKey="is_active" currentSort={companySortKey} currentDir={companySortDir} onSort={handleCompanySort} />
                    {isSuperAdmin && (
                      <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5 w-12" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 8 : 7} className="text-center py-16">
                        <Building2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No companies found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c, i) => (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/companies/${c.company_number}`)}
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
                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <DeleteCompanyButton
                              companyId={c.id}
                              companyName={c.name}
                              variant="icon"
                            />
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {filteredCompanies.length} of {companies.length} companies
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
