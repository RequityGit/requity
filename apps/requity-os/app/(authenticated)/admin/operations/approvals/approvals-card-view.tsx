"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  Landmark,
  FileText,
  Calendar,
} from "lucide-react";
import { ApprovalCard } from "./approval-card";
import { ApprovalFormModal } from "./approval-form-modal";
import { AssigneeFilter } from "@/components/shared/assignee-filter";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface EnrichedApproval {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  priority: string;
  submitted_by: string;
  assigned_to: string;
  submission_notes: string | null;
  decision_notes: string | null;
  deal_snapshot: Record<string, unknown>;
  sla_deadline: string | null;
  sla_breached: boolean;
  decision_at: string | null;
  created_at: string;
  updated_at: string;
  submitter_name: string;
  approver_name: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes Requested" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

interface ApprovalsCardViewProps {
  approvals: EnrichedApproval[];
  profiles: Profile[];
  currentUserId: string;
  isSuperAdmin: boolean;
}

export function ApprovalsCardView({
  approvals: initialApprovals,
  profiles,
  currentUserId,
  isSuperAdmin,
}: ApprovalsCardViewProps) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [personFilter, setPersonFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(["pending"]);
  const [showNewModal, setShowNewModal] = useState(false);
  const { toast } = useToast();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("approvals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approval_requests" },
        () => {
          // Refetch on any change since we need profile enrichment
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Person filter options
  const personOptions = useMemo(() => {
    const ids = new Set<string>();
    approvals.forEach((a) => {
      ids.add(a.submitted_by);
      ids.add(a.assigned_to);
    });
    return Array.from(ids)
      .map((id) => {
        const profile = profiles.find((p) => p.id === id);
        return {
          value: id,
          label: profile?.full_name || "Unknown",
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [approvals, profiles]);

  // Filtered approvals
  const filtered = useMemo(() => {
    return approvals.filter((a) => {
      if (
        personFilter.length > 0 &&
        !personFilter.includes(a.submitted_by) &&
        !personFilter.includes(a.assigned_to)
      )
        return false;
      if (statusFilter.length > 0 && !statusFilter.includes(a.status))
        return false;
      return true;
    });
  }, [approvals, personFilter, statusFilter]);

  // Approve/reject handler
  const handleAction = useCallback(
    async (approvalId: string, newStatus: string, decisionNotes: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("approval_requests" as never)
        .update({
          status: newStatus,
          decision_notes: decisionNotes || null,
          decision_at: new Date().toISOString(),
        } as never)
        .eq("id" as never, approvalId as never);

      if (error) {
        toast({
          title: "Failed to update approval",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setApprovals((prev) =>
          prev.map((a) =>
            a.id === approvalId
              ? {
                  ...a,
                  status: newStatus,
                  decision_notes: decisionNotes || null,
                  decision_at: new Date().toISOString(),
                }
              : a
          )
        );

        // Also log to audit trail
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", currentUserId)
          .single();

        await supabase.from("approval_audit_log" as never).insert({
          approval_id: approvalId,
          action: newStatus === "approved" ? "approved" : "declined",
          performed_by: currentUserId,
          notes: decisionNotes || null,
          metadata: {},
          deal_snapshot: {},
        } as never);

        toast({
          title: newStatus === "approved" ? "Approved" : "Declined",
          description: `Approval has been ${newStatus}.`,
        });
      }
    },
    [currentUserId, toast]
  );

  const handleApprovalSaved = useCallback(
    (approval: EnrichedApproval) => {
      setApprovals((prev) => {
        const existing = prev.find((a) => a.id === approval.id);
        if (existing) {
          return prev.map((a) => (a.id === approval.id ? approval : a));
        }
        return [approval, ...prev];
      });
    },
    []
  );

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Approvals"
        description="Decision gates across deals, draws, and operations."
        action={
          <Button onClick={() => setShowNewModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            New approval
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex gap-3 mb-5">
        <AssigneeFilter
          options={personOptions}
          selected={personFilter}
          onChange={setPersonFilter}
          profiles={profiles}
          label="Person"
        />
        <StatusFilterSelect
          selected={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Approval cards */}
      <div className="flex flex-col gap-3 max-w-[760px]">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2
              className="h-8 w-8 mx-auto mb-2 opacity-40"
              strokeWidth={1.5}
            />
            <div className="text-sm font-semibold">All clear</div>
            <div className="text-xs mt-1">
              No approvals matching these filters.
            </div>
          </div>
        )}
        {filtered.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            profiles={profiles}
            currentUserId={currentUserId}
            isSuperAdmin={isSuperAdmin}
            onAction={handleAction}
          />
        ))}
      </div>

      {/* New Approval Modal */}
      {showNewModal && (
        <ApprovalFormModal
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setShowNewModal(false)}
          onSaved={handleApprovalSaved}
        />
      )}
    </div>
  );
}

// Status filter component
function StatusFilterSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useState<HTMLDivElement | null>(null);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const isAll = selected.length === 0;
  const display = isAll
    ? "All"
    : selected.length === 1
      ? STATUS_OPTIONS.find((o) => o.value === selected[0])?.label || "1"
      : `${selected.length} selected`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-[7px] rounded-md border text-[13px] font-medium cursor-pointer min-w-[140px] justify-between transition-colors",
          open
            ? "border-ring bg-secondary text-foreground"
            : "border-border bg-secondary text-foreground hover:border-ring/50"
        )}
      >
        <span className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0">
            Status
          </span>
          <span className="truncate">{display}</span>
        </span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full mt-1 left-0 bg-popover border border-border rounded-md shadow-md z-50 min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-100">
            <button
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors",
                isAll ? "bg-accent font-semibold" : "hover:bg-accent"
              )}
            >
              All
            </button>
            <div className="h-px bg-border" />
            {STATUS_OPTIONS.map((opt) => {
              const active = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors",
                    active ? "bg-accent font-semibold" : "hover:bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
