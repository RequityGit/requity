"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/shared/data-table";
import { KpiCard } from "@/components/shared/kpi-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { DeleteContactButton } from "@/components/crm/delete-contact-button";
import { formatDate } from "@/lib/format";
import {
  CRM_RELATIONSHIP_TYPES,
  RELATIONSHIP_COLORS,
  CRM_LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_COLORS,
} from "@/lib/constants";
import {
  Users,
  UserPlus,
  CalendarClock,
  Search,
  X,
  Filter,
  Target,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────

export interface CrmContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  company_id: string | null;
  lifecycle_stage: string | null;
  dnc: boolean;
  source: string | null;
  assigned_to_name: string | null;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  activity_count: number;
  relationships: string[];
}

interface TeamMember {
  id: string;
  full_name: string;
}

interface CrmContactListProps {
  contacts: CrmContactRow[];
  teamMembers: TeamMember[];
  currentUserId: string;
  isSuperAdmin?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function RelationshipPills({ types }: { types: string[] }) {
  if (!types.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t) => {
        const label =
          CRM_RELATIONSHIP_TYPES.find((r) => r.value === t)?.label ?? t;
        const colors = RELATIONSHIP_COLORS[t] ?? "bg-gray-100 text-gray-800 border-gray-200";
        return (
          <Badge
            key={t}
            variant="outline"
            className={cn("text-[10px] font-medium px-1.5 py-0", colors)}
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );
}

function LifecycleStageBadge({
  stage,
  dnc,
}: {
  stage: string | null;
  dnc: boolean;
}) {
  const label = stage
    ? CRM_LIFECYCLE_STAGES.find((s) => s.value === stage)?.label ?? stage
    : "—";
  const colors = stage
    ? LIFECYCLE_STAGE_COLORS[stage] ?? "bg-gray-100 text-gray-800"
    : "";
  return (
    <div className="flex items-center gap-1.5">
      {stage ? (
        <Badge
          variant="outline"
          className={cn("text-xs font-medium capitalize", colors)}
        >
          {label}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
      {dnc && (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold bg-red-100 text-red-800 border-red-200"
        >
          DNC
        </Badge>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export function CrmContactList({
  contacts,
  teamMembers,
  currentUserId,
  isSuperAdmin = false,
}: CrmContactListProps) {
  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState<string[]>([]);
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all");

  // Toggle a relationship type in the multi-select filter
  function toggleRelationship(type: string) {
    setRelationshipFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  // Apply all filters
  const filtered = useMemo(() => {
    let result = [...contacts];

    // Search
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

    // Relationship filter (multi-select, OR logic)
    if (relationshipFilter.length > 0) {
      result = result.filter((c) =>
        relationshipFilter.some((rt) => c.relationships.includes(rt))
      );
    }

    // Lifecycle stage filter
    if (lifecycleFilter !== "all") {
      result = result.filter((c) => c.lifecycle_stage === lifecycleFilter);
    }

    return result;
  }, [contacts, search, relationshipFilter, lifecycleFilter]);

  const hasFilters =
    search.trim() !== "" ||
    relationshipFilter.length > 0 ||
    lifecycleFilter !== "all";

  // ── KPI Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const totalContacts = contacts.length;

    const newThisWeek = contacts.filter(
      (c) => new Date(c.created_at) >= weekAgo
    ).length;

    const followUpsDue = contacts.filter((c) => {
      if (!c.next_follow_up_date) return false;
      const due = new Date(c.next_follow_up_date);
      due.setHours(0, 0, 0, 0);
      return due <= now;
    }).length;

    const pipeline = contacts.filter(
      (c) =>
        c.lifecycle_stage === "lead" || c.lifecycle_stage === "prospect"
    ).length;

    return [
      {
        title: "Total Contacts",
        value: totalContacts,
        description: "Active relationships",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "New This Week",
        value: newThisWeek,
        description: "Added in last 7 days",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        title: "Follow-Ups Due",
        value: followUpsDue,
        description: "Due today or overdue",
        icon: <CalendarClock className="h-5 w-5" />,
      },
      {
        title: "Pipeline",
        value: pipeline,
        description: "Leads & prospects",
        icon: <Target className="h-5 w-5" />,
      },
    ];
  }, [contacts]);

  // ── Columns ──────────────────────────────────────────────────────────

  const columns: Column<CrmContactRow>[] = useMemo(() => {
    const cols: Column<CrmContactRow>[] = [
      {
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
      },
      {
        key: "company_name",
        header: "Company",
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.company_name || "—"}
          </span>
        ),
      },
      {
        key: "relationships",
        header: "Relationships",
        cell: (row) => <RelationshipPills types={row.relationships} />,
      },
      {
        key: "email",
        header: "Email",
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.email || "—"}
          </span>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.phone || "—"}
          </span>
        ),
      },
      {
        key: "lifecycle_stage",
        header: "Lifecycle Stage",
        cell: (row) => (
          <LifecycleStageBadge stage={row.lifecycle_stage} dnc={row.dnc} />
        ),
      },
      {
        key: "assigned_to_name",
        header: "Assigned To",
        cell: (row) => row.assigned_to_name || "—",
      },
      {
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
      },
      {
        key: "last_contacted_at",
        header: "Last Contacted",
        cell: (row) =>
          row.last_contacted_at ? formatDate(row.last_contacted_at) : "—",
      },
    ];
    if (isSuperAdmin) {
      cols.push({
        key: "actions",
        header: "",
        cell: (row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DeleteContactButton
              contactId={row.id}
              contactName={`${row.first_name} ${row.last_name}`}
              variant="icon"
            />
          </div>
        ),
        className: "w-10",
      });
    }
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const relationshipFilterLabel =
    relationshipFilter.length === 0
      ? "All Relationships"
      : relationshipFilter.length === 1
      ? CRM_RELATIONSHIP_TYPES.find((r) => r.value === relationshipFilter[0])
          ?.label ?? relationshipFilter[0]
      : `${relationshipFilter.length} selected`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
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

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a2b4a]">Contacts</h3>
        <AddContactDialog
          teamMembers={teamMembers}
          currentUserId={currentUserId}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="pl-9"
          />
        </div>

        {/* Relationship multi-select filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[170px]">
              <Filter className="h-3.5 w-3.5" />
              {relationshipFilterLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Relationship Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CRM_RELATIONSHIP_TYPES.map((rt) => (
              <DropdownMenuCheckboxItem
                key={rt.value}
                checked={relationshipFilter.includes(rt.value)}
                onCheckedChange={() => toggleRelationship(rt.value)}
                onSelect={(e) => e.preventDefault()}
              >
                {rt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Lifecycle stage filter */}
        <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
          <SelectTrigger className="w-[160px]">
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

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setRelationshipFilter([]);
              setLifecycleFilter("all");
            }}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No contacts found."
      />
    </div>
  );
}

// Keep backward-compat export name
export { CrmContactList as CrmTabs };
