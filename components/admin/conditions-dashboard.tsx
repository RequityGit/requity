"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONDITION_STATUSES,
  CONDITION_CATEGORIES,
  RESPONSIBLE_PARTIES,
  LOAN_STAGE_LABELS,
} from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";

interface ConditionWithLoan {
  id: string;
  loan_id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  responsible_party: string;
  is_critical_path: boolean;
  due_date: string | null;
  received_date: string | null;
  approved_date: string | null;
  rejection_reason: string | null;
  sort_order: number;
  loan?: {
    id: string;
    loan_number: string | null;
    property_address: string | null;
    stage: string;
    borrower_id: string;
    loan_amount: number;
    borrower?: { full_name: string | null } | null;
  } | null;
}

interface ConditionsDashboardProps {
  conditions: ConditionWithLoan[];
  currentUserId: string;
}

type ViewMode = "outstanding" | "overdue" | "all";

export function ConditionsDashboard({
  conditions: initialConditions,
  currentUserId,
}: ConditionsDashboardProps) {
  const [conditions, setConditions] = useState(initialConditions);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("outstanding");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterParty, setFilterParty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();
  const { toast } = useToast();

  const today = new Date();

  // Summary stats
  const stats = useMemo(() => {
    const total = conditions.length;
    const approved = conditions.filter(
      (c: ConditionWithLoan) => c.status === "approved" || c.status === "waived"
    ).length;
    const outstanding = conditions.filter(
      (c: ConditionWithLoan) => !["approved", "waived"].includes(c.status)
    ).length;
    const overdue = conditions.filter(
      (c: ConditionWithLoan) =>
        c.due_date &&
        new Date(c.due_date) < today &&
        !["approved", "waived"].includes(c.status)
    ).length;
    const criticalOutstanding = conditions.filter(
      (c: ConditionWithLoan) =>
        c.is_critical_path && !["approved", "waived"].includes(c.status)
    ).length;
    const uniqueLoans = new Set(conditions.map((c: ConditionWithLoan) => c.loan_id)).size;

    return { total, approved, outstanding, overdue, criticalOutstanding, uniqueLoans };
  }, [conditions]);

  // Filtered conditions
  const filteredConditions = useMemo(() => {
    let result = conditions;

    // View mode filter
    if (viewMode === "outstanding") {
      result = result.filter(
        (c: ConditionWithLoan) => !["approved", "waived"].includes(c.status)
      );
    } else if (viewMode === "overdue") {
      result = result.filter(
        (c: ConditionWithLoan) =>
          c.due_date &&
          new Date(c.due_date) < today &&
          !["approved", "waived"].includes(c.status)
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter((c: ConditionWithLoan) => c.category === filterCategory);
    }

    // Party filter
    if (filterParty !== "all") {
      result = result.filter((c: ConditionWithLoan) => c.responsible_party === filterParty);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((c: ConditionWithLoan) => c.status === filterStatus);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c: ConditionWithLoan) =>
          c.name.toLowerCase().includes(q) ||
          (c.loan as any)?.property_address?.toLowerCase().includes(q) ||
          (c.loan as any)?.loan_number?.toLowerCase().includes(q) ||
          (c.loan as any)?.borrower?.full_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [conditions, viewMode, filterCategory, filterParty, filterStatus, search]);

  // Group by loan
  const groupedByLoan = useMemo(() => {
    const groups: Record<string, ConditionWithLoan[]> = {};
    for (const c of filteredConditions) {
      if (!groups[c.loan_id]) groups[c.loan_id] = [];
      groups[c.loan_id].push(c);
    }
    return groups;
  }, [filteredConditions]);

  async function quickStatusChange(conditionId: string, newStatus: string) {
    const supabase = createClient();
    const now = new Date().toISOString();

    const updateData: any = { status: newStatus, updated_at: now };
    if (newStatus === "requested") updateData.requested_date = now.split("T")[0];
    else if (newStatus === "received") updateData.received_date = now.split("T")[0];
    else if (newStatus === "approved") {
      updateData.approved_date = now.split("T")[0];
      updateData.approved_by = currentUserId;
    }

    const { error } = await supabase
      .from("loan_conditions")
      .update(updateData)
      .eq("id", conditionId);

    if (error) {
      toast({
        title: "Error updating condition",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const condition = conditions.find((c: ConditionWithLoan) => c.id === conditionId);
    if (!condition) return;
    await supabase.from("loan_activity_log").insert({
      loan_id: condition.loan_id,
      user_id: currentUserId,
      activity_type: "condition_status_change",
      description: `${condition.name}: status changed to ${newStatus}`,
      old_value: condition.status,
      new_value: newStatus,
      field_name: "condition_status",
    });

    setConditions((prev: ConditionWithLoan[]) =>
      prev.map((c: ConditionWithLoan) =>
        c.id === conditionId ? { ...c, ...updateData } : c
      )
    );
    toast({ title: `Condition updated to ${newStatus.replace(/_/g, " ")}` });
  }

  const hasFilters =
    filterCategory !== "all" ||
    filterParty !== "all" ||
    filterStatus !== "all" ||
    search.trim() !== "";

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Active Loans" value={stats.uniqueLoans} />
        <StatCard label="Total Conditions" value={stats.total} />
        <StatCard
          label="Outstanding"
          value={stats.outstanding}
          color="text-amber-700"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          color="text-red-700"
        />
        <StatCard
          label="Critical Open"
          value={stats.criticalOutstanding}
          color="text-red-700"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          color="text-green-700"
        />
      </div>

      {/* View mode + Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* View mode tabs */}
            <div className="flex rounded-md border overflow-hidden">
              {(
                [
                  { key: "outstanding", label: "Outstanding" },
                  { key: "overdue", label: "Overdue" },
                  { key: "all", label: "All" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === mode.key
                      ? "bg-navy text-white"
                      : "bg-navy-mid text-surface-muted hover:bg-navy-light"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conditions, loans, borrowers..."
                className="pl-9 h-8"
              />
            </div>

            {/* Filters */}
            <Select
              value={filterCategory}
              onValueChange={setFilterCategory}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CONDITION_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterParty} onValueChange={setFilterParty}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {RESPONSIBLE_PARTIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CONDITION_STATUSES.map((s) => (
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
                className="h-8 text-xs gap-1"
                onClick={() => {
                  setSearch("");
                  setFilterCategory("all");
                  setFilterParty("all");
                  setFilterStatus("all");
                }}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conditions grouped by loan */}
      <div className="space-y-4">
        {Object.entries(groupedByLoan).map(([loanId, loanConditions]) => {
          const loan = loanConditions[0]?.loan;
          const borrowerName =
            (loan as any)?.borrower?.full_name ?? "Unknown";
          const stageLabel =
            LOAN_STAGE_LABELS[
              loan?.stage as keyof typeof LOAN_STAGE_LABELS
            ] ?? loan?.stage;

          return (
            <Card key={loanId}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-white">
                          {loan?.loan_number ?? "—"}
                        </span>
                        <StatusBadge status={loan?.stage ?? "lead"} />
                        <span className="text-xs text-surface-muted">
                          {loanConditions.length} conditions
                        </span>
                      </div>
                      <p className="text-xs text-surface-muted">
                        {loan?.property_address ?? "No address"} —{" "}
                        {borrowerName} —{" "}
                        {formatCurrency(loan?.loan_amount ?? 0)}
                      </p>
                    </div>
                  </div>
                  <Link href={`/admin/loans/${loanId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                    >
                      View Loan
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-3">
                <div className="space-y-1.5">
                  {loanConditions.map((condition) => {
                    const isOverdue =
                      condition.due_date &&
                      new Date(condition.due_date) < today &&
                      !["approved", "waived"].includes(condition.status);
                    const isComplete =
                      condition.status === "approved" ||
                      condition.status === "waived";

                    return (
                      <div
                        key={condition.id}
                        className={`flex items-center gap-3 py-2 px-3 rounded-lg border ${
                          isComplete
                            ? "bg-status-success/10/50 border-green-100"
                            : isOverdue
                              ? "bg-red-50/50 border-red-100"
                              : "bg-navy-mid"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-status-success" />
                          ) : isOverdue ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-surface-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {condition.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 uppercase"
                            >
                              {condition.category}
                            </Badge>
                            {condition.is_critical_path && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                                Critical
                              </Badge>
                            )}
                            <StatusBadge status={condition.status} />
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-surface-muted mt-0.5">
                            <span>
                              {RESPONSIBLE_PARTIES.find(
                                (p) =>
                                  p.value === condition.responsible_party
                              )?.label ?? condition.responsible_party}
                            </span>
                            {condition.due_date && (
                              <span
                                className={
                                  isOverdue
                                    ? "text-status-danger font-medium"
                                    : ""
                                }
                              >
                                Due: {formatDate(condition.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {condition.status === "not_requested" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                quickStatusChange(
                                  condition.id,
                                  "requested"
                                )
                              }
                            >
                              Request
                            </Button>
                          )}
                          {condition.status === "requested" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                quickStatusChange(
                                  condition.id,
                                  "received"
                                )
                              }
                            >
                              Received
                            </Button>
                          )}
                          {(condition.status === "received" ||
                            condition.status === "under_review") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-700"
                              onClick={() =>
                                quickStatusChange(
                                  condition.id,
                                  "approved"
                                )
                              }
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredConditions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-surface-muted">
            {hasFilters
              ? "No conditions match the current filters."
              : "No conditions found across active loans."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-navy-mid rounded-lg border px-3 py-2">
      <p className="text-xs text-surface-muted">{label}</p>
      <p className={`text-lg font-semibold ${color || "text-surface-white"}`}>
        {value}
      </p>
    </div>
  );
}
