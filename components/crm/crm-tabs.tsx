"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { formatDate } from "@/lib/format";
import { CRM_CONTACT_TYPES, CRM_CONTACT_STATUSES } from "@/lib/constants";
import {
  Users,
  UserPlus,
  CalendarClock,
  TrendingUp,
  Landmark,
  Building2,
  Target,
  Search,
  X,
  ShieldCheck,
  Clock,
  BarChart3,
  CreditCard,
  Briefcase,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

export interface CrmContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  contact_type: string;
  source: string | null;
  status: string;
  assigned_to_name: string | null;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  activity_count: number;
  // Enriched fields from joined tables
  linked_investor_id: string | null;
  borrower_id: string | null;
  accreditation_status: string | null;
  credit_score: number | null;
  experience_count: number | null;
}

interface TeamMember {
  id: string;
  full_name: string;
}

interface CrmTabsProps {
  contacts: CrmContactRow[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

type TabValue = "all" | "investors" | "borrowers" | "leads";

// ── Component ────────────────────────────────────────────────────────────

export function CrmTabs({
  contacts,
  teamMembers,
  currentUserId,
}: CrmTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab: TabValue =
    tabParam === "investors" || tabParam === "borrowers" || tabParam === "leads"
      ? tabParam
      : "all";

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sync URL when tab changes
  const handleTabChange = useCallback(
    (value: string) => {
      const tab = value as TabValue;
      setActiveTab(tab);
      // Reset filters when changing tabs
      setSearch("");
      setTypeFilter("all");
      setStatusFilter("all");

      const params = new URLSearchParams(searchParams.toString());
      if (tab === "all") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`/admin/crm${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Sync tab state if URL changes externally
  useEffect(() => {
    const newTab =
      tabParam === "investors" ||
      tabParam === "borrowers" ||
      tabParam === "leads"
        ? tabParam
        : "all";
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // ── Tab-based filtering ────────────────────────────────────────────────

  const tabContacts = useMemo(() => {
    switch (activeTab) {
      case "investors":
        return contacts.filter(
          (c) =>
            c.contact_type === "investor" || c.linked_investor_id !== null
        );
      case "borrowers":
        return contacts.filter(
          (c) => c.contact_type === "borrower" || c.borrower_id !== null
        );
      case "leads":
        return contacts.filter((c) =>
          ["lead", "prospect"].includes(c.contact_type)
        );
      default:
        return contacts;
    }
  }, [contacts, activeTab]);

  // Apply search and filters on top of tab filtering
  const filtered = useMemo(() => {
    let result = [...tabContacts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((c) => c.contact_type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [tabContacts, search, typeFilter, statusFilter]);

  const hasFilters =
    search.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  // ── Tab counts ─────────────────────────────────────────────────────────

  const allCount = contacts.length;
  const investorCount = contacts.filter(
    (c) => c.contact_type === "investor" || c.linked_investor_id !== null
  ).length;
  const borrowerCount = contacts.filter(
    (c) => c.contact_type === "borrower" || c.borrower_id !== null
  ).length;
  const leadCount = contacts.filter((c) =>
    ["lead", "prospect"].includes(c.contact_type)
  ).length;

  // ── Default contact type for Add dialog ────────────────────────────────

  const defaultContactType = useMemo(() => {
    switch (activeTab) {
      case "investors":
        return "investor";
      case "borrowers":
        return "borrower";
      case "leads":
        return "lead";
      default:
        return "lead";
    }
  }, [activeTab]);

  // ── Stats per tab ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const followUpsDue = (list: CrmContactRow[]) =>
      list.filter((c) => {
        if (!c.next_follow_up_date) return false;
        const due = new Date(c.next_follow_up_date);
        due.setHours(0, 0, 0, 0);
        return due <= now && c.status !== "converted" && c.status !== "inactive";
      }).length;

    switch (activeTab) {
      case "investors": {
        const investorContacts = tabContacts;
        const verified = investorContacts.filter(
          (c) =>
            c.accreditation_status === "verified" ||
            c.accreditation_status === "accredited"
        ).length;
        const pending = investorContacts.filter(
          (c) => c.accreditation_status === "pending"
        ).length;
        return [
          {
            title: "Total Investors",
            value: investorContacts.length,
            description: "Investor contacts",
            icon: <Landmark className="h-5 w-5" />,
          },
          {
            title: "Verified / Accredited",
            value: verified,
            description: "Accreditation confirmed",
            icon: <ShieldCheck className="h-5 w-5" />,
          },
          {
            title: "Pending Accreditation",
            value: pending,
            description: "Awaiting verification",
            icon: <Clock className="h-5 w-5" />,
          },
          {
            title: "Follow-Ups Due",
            value: followUpsDue(investorContacts),
            description: "Due today or overdue",
            icon: <CalendarClock className="h-5 w-5" />,
          },
        ];
      }
      case "borrowers": {
        const borrowerContacts = tabContacts;
        const active = borrowerContacts.filter(
          (c) => c.status === "active"
        ).length;
        const scores = borrowerContacts
          .map((c) => c.credit_score)
          .filter((s): s is number => s !== null);
        const avgScore =
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        return [
          {
            title: "Total Borrowers",
            value: borrowerContacts.length,
            description: "Borrower contacts",
            icon: <Building2 className="h-5 w-5" />,
          },
          {
            title: "Active Borrowers",
            value: active,
            description: "Currently active",
            icon: <Users className="h-5 w-5" />,
          },
          {
            title: "Avg Credit Score",
            value: avgScore || "—",
            description: "Across linked borrowers",
            icon: <CreditCard className="h-5 w-5" />,
          },
          {
            title: "Follow-Ups Due",
            value: followUpsDue(borrowerContacts),
            description: "Due today or overdue",
            icon: <CalendarClock className="h-5 w-5" />,
          },
        ];
      }
      case "leads": {
        const leadContacts = tabContacts;
        const newThisWeek = leadContacts.filter(
          (c) => new Date(c.created_at) >= weekAgo
        ).length;
        const convertedCount = contacts.filter((c) => {
          if (c.status !== "converted") return false;
          const updated = new Date(c.created_at);
          return updated >= monthStart;
        }).length;
        const totalLeadsEver = contacts.filter((c) =>
          ["lead", "prospect"].includes(c.contact_type)
        ).length;
        const conversionRate =
          totalLeadsEver > 0
            ? Math.round((convertedCount / totalLeadsEver) * 100)
            : 0;
        return [
          {
            title: "Total Leads",
            value: leadContacts.length,
            description: "Leads & prospects",
            icon: <Target className="h-5 w-5" />,
          },
          {
            title: "New This Week",
            value: newThisWeek,
            description: "Added in last 7 days",
            icon: <UserPlus className="h-5 w-5" />,
          },
          {
            title: "Follow-Ups Due",
            value: followUpsDue(leadContacts),
            description: "Due today or overdue",
            icon: <CalendarClock className="h-5 w-5" />,
          },
          {
            title: "Conversion Rate",
            value: `${conversionRate}%`,
            description: "Leads converted (MTD)",
            icon: <BarChart3 className="h-5 w-5" />,
          },
        ];
      }
      default: {
        const convertedThisMonth = contacts.filter((c) => {
          if (c.status !== "converted") return false;
          const updated = new Date(c.created_at);
          return updated >= monthStart;
        }).length;
        const activeLeads = contacts.filter(
          (c) =>
            ["lead", "prospect"].includes(c.contact_type) &&
            ["active", "nurturing", "qualified"].includes(c.status)
        ).length;
        return [
          {
            title: "Total Contacts",
            value: contacts.length,
            description: "All CRM contacts",
            icon: <Users className="h-5 w-5" />,
          },
          {
            title: "Active Leads",
            value: activeLeads,
            description: "Leads & prospects",
            icon: <UserPlus className="h-5 w-5" />,
          },
          {
            title: "Follow-Ups Due",
            value: followUpsDue(contacts),
            description: "Due today or overdue",
            icon: <CalendarClock className="h-5 w-5" />,
          },
          {
            title: "Converted (MTD)",
            value: convertedThisMonth,
            description: "Contacts converted",
            icon: <TrendingUp className="h-5 w-5" />,
          },
        ];
      }
    }
  }, [activeTab, contacts, tabContacts]);

  // ── Columns per tab ────────────────────────────────────────────────────

  const nameColumn: Column<CrmContactRow> = {
    key: "name",
    header: "Name",
    cell: (row) => (
      <Link
        href={`/admin/crm/${row.id}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {row.first_name} {row.last_name}
      </Link>
    ),
  };

  const emailColumn: Column<CrmContactRow> = {
    key: "email",
    header: "Email",
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.email || "—"}
      </span>
    ),
  };

  const phoneColumn: Column<CrmContactRow> = {
    key: "phone",
    header: "Phone",
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.phone || "—"}
      </span>
    ),
  };

  const statusColumn: Column<CrmContactRow> = {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  };

  const assignedToColumn: Column<CrmContactRow> = {
    key: "assigned_to_name",
    header: "Assigned To",
    cell: (row) => row.assigned_to_name || "—",
  };

  const followUpColumn: Column<CrmContactRow> = {
    key: "next_follow_up_date",
    header: "Next Follow-Up",
    cell: (row) => {
      if (!row.next_follow_up_date) return "—";
      const isOverdue = new Date(row.next_follow_up_date) < new Date();
      return (
        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
          {formatDate(row.next_follow_up_date)}
        </span>
      );
    },
  };

  const lastContactedColumn: Column<CrmContactRow> = {
    key: "last_contacted_at",
    header: "Last Contacted",
    cell: (row) =>
      row.last_contacted_at ? formatDate(row.last_contacted_at) : "—",
  };

  const columns: Column<CrmContactRow>[] = useMemo(() => {
    switch (activeTab) {
      case "investors":
        return [
          nameColumn,
          emailColumn,
          phoneColumn,
          {
            key: "accreditation_status",
            header: "Accreditation",
            cell: (row) =>
              row.accreditation_status ? (
                <StatusBadge status={row.accreditation_status} />
              ) : (
                "—"
              ),
          },
          statusColumn,
          assignedToColumn,
          followUpColumn,
          lastContactedColumn,
        ];
      case "borrowers":
        return [
          nameColumn,
          emailColumn,
          phoneColumn,
          {
            key: "credit_score",
            header: "Credit Score",
            cell: (row) => {
              if (row.credit_score === null) return "—";
              const score = row.credit_score;
              const color =
                score >= 740
                  ? "text-green-600"
                  : score >= 680
                  ? "text-amber-600"
                  : "text-red-600";
              return (
                <span className={`font-medium ${color}`}>{score}</span>
              );
            },
          },
          {
            key: "experience_count",
            header: "Experience",
            cell: (row) =>
              row.experience_count !== null ? row.experience_count : "—",
          },
          statusColumn,
          assignedToColumn,
          followUpColumn,
          lastContactedColumn,
        ];
      case "leads":
        return [
          nameColumn,
          {
            key: "company_name",
            header: "Company",
            cell: (row) => row.company_name || "—",
          },
          {
            key: "source",
            header: "Source",
            cell: (row) =>
              row.source ? <StatusBadge status={row.source} /> : "—",
          },
          emailColumn,
          phoneColumn,
          statusColumn,
          assignedToColumn,
          followUpColumn,
          lastContactedColumn,
        ];
      default:
        return [
          nameColumn,
          {
            key: "company_name",
            header: "Company",
            cell: (row) => row.company_name || "—",
          },
          {
            key: "contact_type",
            header: "Type",
            cell: (row) => <StatusBadge status={row.contact_type} />,
          },
          emailColumn,
          phoneColumn,
          statusColumn,
          assignedToColumn,
          followUpColumn,
        ];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Show type filter only on "all" tab
  const showTypeFilter = activeTab === "all";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <KpiCard
            key={stat.title}
            title={stat.title}
            value={stat.value.toString()}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              All Contacts
              <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
                {allCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="investors" className="gap-1.5">
              <Landmark className="h-3.5 w-3.5" />
              Investors
              <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
                {investorCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="borrowers" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Borrowers
              <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
                {borrowerCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Leads
              {leadCount > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
                  {leadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <AddContactDialog
            teamMembers={teamMembers}
            currentUserId={currentUserId}
            defaultContactType={defaultContactType}
          />
        </div>

        {/* Shared filter bar for all tabs */}
        <div className="flex items-center gap-3 flex-wrap mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9"
            />
          </div>

          {showTypeFilter && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CRM_CONTACT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {CRM_CONTACT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Tab content - all share the same table, just different columns */}
        <TabsContent value="all" className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage="No contacts found."
          />
        </TabsContent>
        <TabsContent value="investors" className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage="No investor contacts found."
          />
        </TabsContent>
        <TabsContent value="borrowers" className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage="No borrower contacts found."
          />
        </TabsContent>
        <TabsContent value="leads" className="mt-4">
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage="No leads found."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
