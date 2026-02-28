"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import {
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { LoanCondition } from "@/lib/supabase/types";

interface LoanConditionsTabProps {
  conditions: LoanCondition[];
  loanId: string;
  currentUserId: string;
}

export function LoanConditionsTab({
  conditions: initialConditions,
  loanId,
  currentUserId,
}: LoanConditionsTabProps) {
  const [conditions, setConditions] = useState(initialConditions);
  const [expandedPta, setExpandedPta] = useState(true);
  const [expandedPtf, setExpandedPtf] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const ptaConditions = conditions
    .filter((c) => c.category === "pta")
    .sort((a, b) => a.sort_order - b.sort_order);
  const ptfConditions = conditions
    .filter((c) => c.category === "ptf")
    .sort((a, b) => a.sort_order - b.sort_order);

  // Summary stats
  const totalCount = conditions.length;
  const approvedCount = conditions.filter(
    (c) => c.status === "approved" || c.status === "waived"
  ).length;
  const receivedCount = conditions.filter(
    (c) => c.status === "received" || c.status === "under_review"
  ).length;
  const outstandingCount = conditions.filter(
    (c) => !["approved", "waived"].includes(c.status)
  ).length;
  const overdueCount = conditions.filter(
    (c) =>
      c.due_date &&
      new Date(c.due_date) < new Date() &&
      !["approved", "waived"].includes(c.status)
  ).length;

  const ptaTotal = ptaConditions.length;
  const ptaComplete = ptaConditions.filter(
    (c) => c.status === "approved" || c.status === "waived"
  ).length;
  const ptfTotal = ptfConditions.length;
  const ptfComplete = ptfConditions.filter(
    (c) => c.status === "approved" || c.status === "waived"
  ).length;

  async function updateConditionStatus(
    conditionId: string,
    newStatus: string,
    rejectionReason?: string
  ) {
    const supabase = createClient();
    const now = new Date().toISOString();

    const updateData: any = {
      status: newStatus,
      updated_at: now,
    };

    if (newStatus === "requested") {
      updateData.requested_date = now.split("T")[0];
    } else if (newStatus === "received") {
      updateData.received_date = now.split("T")[0];
    } else if (newStatus === "approved") {
      updateData.approved_date = now.split("T")[0];
      updateData.approved_by = currentUserId;
    } else if (newStatus === "waived") {
      updateData.waived_by = currentUserId;
    } else if (newStatus === "rejected") {
      updateData.rejection_reason = rejectionReason || null;
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

    // Log activity
    const condition = conditions.find((c) => c.id === conditionId);
    await supabase.from("loan_activity_log").insert({
      loan_id: loanId,
      user_id: currentUserId,
      activity_type: "condition_status_change",
      description: `${condition?.name}: status changed to ${newStatus}`,
      old_value: condition?.status,
      new_value: newStatus,
      field_name: "condition_status",
    });

    setConditions((prev) =>
      prev.map((c) =>
        c.id === conditionId ? { ...c, ...updateData } : c
      )
    );
    toast({ title: `Condition updated to ${newStatus.replace(/_/g, " ")}` });
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Total" value={totalCount} />
        <SummaryCard
          label="Approved"
          value={approvedCount}
          color="text-green-700"
        />
        <SummaryCard
          label="Received"
          value={receivedCount}
          color="text-indigo-700"
        />
        <SummaryCard
          label="Outstanding"
          value={outstandingCount}
          color="text-amber-700"
        />
        <SummaryCard
          label="Overdue"
          value={overdueCount}
          color="text-red-700"
        />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-2 gap-4">
        <ProgressCard label="PTA" completed={ptaComplete} total={ptaTotal} />
        <ProgressCard label="PTF" completed={ptfComplete} total={ptfTotal} />
      </div>

      {/* Add Condition Button */}
      <div className="flex justify-end">
        <AddConditionDialog loanId={loanId} onAdded={() => router.refresh()} />
      </div>

      {/* PTA Section */}
      <ConditionSection
        title="Prior to Approval (PTA)"
        conditions={ptaConditions}
        expanded={expandedPta}
        onToggle={() => setExpandedPta(!expandedPta)}
        onStatusChange={updateConditionStatus}
        currentUserId={currentUserId}
        loanId={loanId}
      />

      {/* PTF Section */}
      <ConditionSection
        title="Prior to Funding (PTF)"
        conditions={ptfConditions}
        expanded={expandedPtf}
        onToggle={() => setExpandedPtf(!expandedPtf)}
        onStatusChange={updateConditionStatus}
        currentUserId={currentUserId}
        loanId={loanId}
      />

      {conditions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-surface-muted">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conditions have been added to this loan yet.</p>
            <p className="text-sm mt-1">
              Conditions are auto-populated when a loan type is selected, or you
              can add them manually.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------
function SummaryCard({
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

// ---------------------------------------------------------------------------
// Progress Card
// ---------------------------------------------------------------------------
function ProgressCard({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-navy-mid rounded-lg border px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-surface-white">{label}</span>
        <span className="text-xs text-surface-muted">
          {completed}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-navy-mid rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Condition Section (PTA or PTF)
// ---------------------------------------------------------------------------
function ConditionSection({
  title,
  conditions,
  expanded,
  onToggle,
  onStatusChange,
  currentUserId,
  loanId,
}: {
  title: string;
  conditions: LoanCondition[];
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: string, status: string, reason?: string) => void;
  currentUserId: string;
  loanId: string;
}) {
  if (conditions.length === 0) return null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3 px-4"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <CardTitle className="text-sm">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {conditions.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-2">
            {conditions.map((condition) => (
              <ConditionRow
                key={condition.id}
                condition={condition}
                onStatusChange={onStatusChange}
                currentUserId={currentUserId}
                loanId={loanId}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Single Condition Row
// ---------------------------------------------------------------------------
function ConditionRow({
  condition,
  onStatusChange,
  currentUserId,
  loanId,
}: {
  condition: LoanCondition;
  onStatusChange: (id: string, status: string, reason?: string) => void;
  currentUserId: string;
  loanId: string;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isOverdue =
    condition.due_date &&
    new Date(condition.due_date) < new Date() &&
    !["approved", "waived"].includes(condition.status);
  const isComplete =
    condition.status === "approved" || condition.status === "waived";

  const partyLabel =
    RESPONSIBLE_PARTIES.find((p) => p.value === condition.responsible_party)
      ?.label ?? condition.responsible_party;

  // Quick action buttons based on current status
  function getQuickActions() {
    switch (condition.status) {
      case "not_requested":
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onStatusChange(condition.id, "requested")}
          >
            Request
          </Button>
        );
      case "requested":
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onStatusChange(condition.id, "received")}
          >
            Mark Received
          </Button>
        );
      case "received":
      case "under_review":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-green-700"
              onClick={() => onStatusChange(condition.id, "approved")}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-red-700"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border ${
          isComplete
            ? "bg-status-success/10/50 border-green-100"
            : isOverdue
              ? "bg-red-50/50 border-red-100"
              : "bg-navy-mid"
        }`}
      >
        {/* Status indicator */}
        <div className="mt-0.5">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-status-success" />
          ) : isOverdue ? (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          ) : (
            <Clock className="h-4 w-4 text-surface-muted" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-surface-white">
              {condition.name}
            </span>
            {condition.is_critical_path && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                Critical
              </Badge>
            )}
            <StatusBadge status={condition.status} />
          </div>
          {condition.description && (
            <p className="text-xs text-surface-muted mt-0.5">
              {condition.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-[11px] text-surface-muted">
            <span>{partyLabel}</span>
            {condition.due_date && (
              <span className={isOverdue ? "text-status-danger font-medium" : ""}>
                Due: {formatDate(condition.due_date)}
              </span>
            )}
            {condition.received_date && (
              <span>Received: {formatDate(condition.received_date)}</span>
            )}
            {condition.approved_date && (
              <span className="text-green-700">
                Approved: {formatDate(condition.approved_date)}
              </span>
            )}
          </div>
          {condition.rejection_reason && (
            <p className="text-xs text-status-danger mt-1">
              Rejection reason: {condition.rejection_reason}
            </p>
          )}
          {condition.internal_note && (
            <p className="text-xs text-surface-muted mt-1 italic">
              Note: {condition.internal_note}
            </p>
          )}
        </div>

        {/* Status select + quick actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {getQuickActions()}
          <Select
            value={condition.status}
            onValueChange={(v) => {
              if (v === "rejected") {
                setRejectOpen(true);
              } else {
                onStatusChange(condition.id, v);
              }
            }}
          >
            <SelectTrigger className="w-[130px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-surface-muted">
              Rejecting: <strong>{condition.name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Reason for rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs to be corrected..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onStatusChange(condition.id, "rejected", rejectReason);
                setRejectOpen(false);
                setRejectReason("");
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Add Condition Dialog
// ---------------------------------------------------------------------------
function AddConditionDialog({
  loanId,
  onAdded,
}: {
  loanId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    borrower_description: "",
    category: "pta",
    responsible_party: "borrower",
    is_critical_path: false,
    due_date: "",
    internal_note: "",
  });

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("loan_conditions").insert({
        loan_id: loanId,
        name: form.name,
        description: form.description || null,
        borrower_description: form.borrower_description || null,
        category: form.category,
        responsible_party: form.responsible_party,
        is_critical_path: form.is_critical_path,
        due_date: form.due_date || null,
        internal_note: form.internal_note || null,
        status: "not_requested",
      });

      if (error) throw error;

      toast({ title: "Condition added" });
      setOpen(false);
      setForm({
        name: "",
        description: "",
        borrower_description: "",
        category: "pta",
        responsible_party: "borrower",
        is_critical_path: false,
        due_date: "",
        internal_note: "",
      });
      onAdded();
    } catch (err: any) {
      toast({
        title: "Error adding condition",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Condition
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Condition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Condition Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Bank Statements (2 months)"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsible Party</Label>
              <Select
                value={form.responsible_party}
                onValueChange={(v) => updateField("responsible_party", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_PARTIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_critical_path}
                  onChange={(e) =>
                    updateField("is_critical_path", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                Critical path item
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Internal Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              placeholder="Visible to team only"
            />
          </div>
          <div className="space-y-2">
            <Label>Borrower Description</Label>
            <Textarea
              value={form.borrower_description}
              onChange={(e) =>
                updateField("borrower_description", e.target.value)
              }
              rows={2}
              placeholder="What the borrower sees"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name}>
              {loading ? "Adding..." : "Add Condition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
