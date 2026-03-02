"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { formatRelativeTime } from "@/lib/notifications";
import type { ApprovalRequestWithProfiles, ApprovalStatus, ApprovalPriority } from "@/lib/approvals/types";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_PRIORITY_COLORS,
  APPROVAL_STATUS_COLORS,
  ENTITY_TYPE_LABELS,
} from "@/lib/approvals/types";

interface ApprovalsListViewProps {
  approvals: ApprovalRequestWithProfiles[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

function getSlaStatus(slaDeadline: string | null, slaBreached: boolean) {
  if (slaBreached) return { label: "Breached", color: "text-red-600 bg-red-50", icon: AlertTriangle };
  if (!slaDeadline) return { label: "No SLA", color: "text-gray-500 bg-gray-50", icon: Clock };

  const now = new Date();
  const deadline = new Date(slaDeadline);
  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return { label: "Overdue", color: "text-red-600 bg-red-50", icon: AlertTriangle };
  if (hoursRemaining <= 4) return { label: `${Math.ceil(hoursRemaining)}h left`, color: "text-amber-600 bg-amber-50", icon: Clock };
  return { label: `${Math.ceil(hoursRemaining)}h left`, color: "text-green-600 bg-green-50", icon: Clock };
}

export function ApprovalsListView({ approvals, currentUserId, isSuperAdmin }: ApprovalsListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const filteredApprovals = useMemo(() => {
    let result = [...approvals];

    // Filter by tab
    if (activeTab !== "all") {
      result = result.filter((a) => a.status === activeTab);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.submitter_name?.toLowerCase().includes(q)) ||
          (a.approver_name?.toLowerCase().includes(q)) ||
          (a.deal_snapshot as any)?.borrower_name?.toLowerCase().includes(q) ||
          a.entity_type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [approvals, activeTab, search]);

  // Counts per tab
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: approvals.length };
    for (const a of approvals) {
      c[a.status] = (c[a.status] ?? 0) + 1;
    }
    return c;
  }, [approvals]);

  const myPendingCount = useMemo(
    () => approvals.filter((a) => a.assigned_to === currentUserId && a.status === "pending").length,
    [approvals, currentUserId]
  );

  // Pagination
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(filteredApprovals.length / PAGE_SIZE));
  const paginated = filteredApprovals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description={
          myPendingCount > 0
            ? `You have ${myPendingCount} pending approval${myPendingCount > 1 ? "s" : ""}`
            : "Manage approval requests across the organization."
        }
        action={
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/operations/approvals/settings")}>
                <Settings2 className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/admin/operations")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Operations
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(0); }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              Pending
              {(counts.pending ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {counts.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="changes_requested" className="gap-1.5">
              Changes Requested
              {(counts.changes_requested ?? 0) > 0 && (
                <Badge variant="warning" className="ml-1 h-5 px-1.5 text-xs">
                  {counts.changes_requested}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {counts.all}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search approvals..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
        </div>

        {/* All tab contents share the same table */}
        {["pending", "changes_requested", "approved", "declined", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No approvals found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((approval) => {
                      const snapshot = approval.deal_snapshot as Record<string, any>;
                      const sla = getSlaStatus(approval.sla_deadline, approval.sla_breached);
                      const SlaIcon = sla.icon;
                      const priorityColors = APPROVAL_PRIORITY_COLORS[approval.priority as ApprovalPriority];
                      const statusColors = APPROVAL_STATUS_COLORS[approval.status as ApprovalStatus];

                      return (
                        <TableRow
                          key={approval.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => router.push(`/admin/operations/approvals/${approval.id}`)}
                        >
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {snapshot?.borrower_name || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {snapshot?.property_address || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ENTITY_TYPE_LABELS[approval.entity_type as keyof typeof ENTITY_TYPE_LABELS] || approval.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {approval.submitter_name || "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {snapshot?.loan_amount ? formatCurrency(Number(snapshot.loan_amount)) : "—"}
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", priorityColors?.badge)}>
                              {approval.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            {approval.status === "pending" ? (
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", sla.color)}>
                                <SlaIcon className="h-3 w-3" />
                                {sla.label}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", statusColors?.badge)}>
                              {APPROVAL_STATUS_LABELS[approval.status as ApprovalStatus] || approval.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatRelativeTime(approval.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredApprovals.length)} of{" "}
                  {filteredApprovals.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
