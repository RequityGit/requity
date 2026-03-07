"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentDownload } from "@/components/borrower/document-download";
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
  CONDITION_STAGES,
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
  MessageCircle,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/lib/supabase/types";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";

type LoanCondition = Tables<"loan_conditions">;
type LoanDocument = Tables<"loan_documents">;

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
    .filter((c) => c.category === "prior_to_approval" || c.required_stage === "processing")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const ptfConditions = conditions
    .filter((c) => c.category === "prior_to_funding" || c.required_stage === "closed_onboarding")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Summary stats
  const totalCount = conditions.length;
  const approvedCount = conditions.filter(
    (c) => c.status === "approved" || c.status === "waived"
  ).length;
  const receivedCount = conditions.filter(
    (c) => c.status === "submitted" || c.status === "under_review"
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
    _rejectionReason?: string
  ) {
    const supabase = createClient();
    const now = new Date().toISOString();

    const updateData: any = {
      status: newStatus,
      updated_at: now,
    };

    if (newStatus === "submitted") {
      updateData.submitted_at = now;
    } else if (newStatus === "approved" || newStatus === "rejected") {
      updateData.reviewed_at = now;
      updateData.reviewed_by = currentUserId;
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
      performed_by: currentUserId,
      action: "condition_status_change",
      description: `${condition?.condition_name}: status changed to ${newStatus}`,
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
          color="text-green-700 dark:text-green-400"
        />
        <SummaryCard
          label="Submitted"
          value={receivedCount}
          color="text-indigo-700 dark:text-indigo-400"
        />
        <SummaryCard
          label="Outstanding"
          value={outstandingCount}
          color="text-amber-700 dark:text-amber-400"
        />
        <SummaryCard
          label="Overdue"
          value={overdueCount}
          color="text-destructive"
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
          <CardContent className="py-8 text-center text-muted-foreground">
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
    <div className="bg-card rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold num ${color || "text-foreground"}`}>
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
    <div className="bg-card rounded-lg border px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground num">
          {completed}/{total} ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-2 bg-muted [&>div]:bg-green-600 dark:[&>div]:bg-green-500" />
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

  // Documents panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoaded, setPanelLoaded] = useState(false);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const isOverdue =
    condition.due_date &&
    new Date(condition.due_date) < new Date() &&
    !["approved", "waived"].includes(condition.status);
  const isComplete =
    condition.status === "approved" || condition.status === "waived";

  const partyLabel =
    RESPONSIBLE_PARTIES.find((p) => p.value === condition.responsible_party)
      ?.label ?? condition.responsible_party;

  async function loadPanelData() {
    const supabase = createClient();
    const { data: docsRes } = await supabase
      .from("loan_documents")
      .select("*")
      .eq("condition_id", condition.id)
      .order("created_at", { ascending: false });
    setDocuments(docsRes ?? []);
    setPanelLoaded(true);
  }

  async function togglePanel() {
    if (!panelOpen && !panelLoaded) {
      await loadPanelData();
    }
    setPanelOpen((prev) => !prev);
  }

  async function handleUploadDocument() {
    if (!uploadFile) return;
    setUploadLoading(true);

    const supabase = createClient();
    const fileName = `${Date.now()}_${uploadFile.name}`;
    const storagePath = `${loanId}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("loan-documents")
      .upload(storagePath, uploadFile);

    if (storageError) {
      toast({
        title: "Upload failed",
        description: storageError.message,
        variant: "destructive",
      });
      setUploadLoading(false);
      return;
    }

    const { data: docData, error: dbError } = await supabase
      .from("loan_documents")
      .insert({
        loan_id: loanId,
        condition_id: condition.id,
        document_name: uploadFile.name,
        file_url: storagePath,
        uploaded_by: currentUserId,
        file_size_bytes: uploadFile.size,
        mime_type: uploadFile.type,
      })
      .select()
      .single();

    if (dbError) {
      toast({
        title: "Error saving document record",
        description: dbError.message,
        variant: "destructive",
      });
    } else {
      setDocuments((prev) => [docData, ...prev]);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Document uploaded" });
    }
    setUploadLoading(false);
  }

  // Quick action buttons based on current status
  function getQuickActions() {
    switch (condition.status) {
      case "pending":
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onStatusChange(condition.id, "submitted")}
          >
            Submit
          </Button>
        );
      case "submitted":
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onStatusChange(condition.id, "under_review")}
          >
            Review
          </Button>
        );
      case "under_review":
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-green-700 dark:text-green-400"
              onClick={() => onStatusChange(condition.id, "approved")}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive"
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
      <div className="rounded-lg border overflow-hidden">
        {/* Main row */}
        <div
          className={`flex items-start gap-3 p-3 ${
            isComplete
              ? "bg-green-50/50 dark:bg-green-950/20"
              : isOverdue
                ? "bg-red-50/50 dark:bg-red-950/20"
                : "bg-card"
          }`}
        >
          {/* Status indicator */}
          <div className="mt-0.5">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : isOverdue ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {condition.condition_name}
              </span>
              {condition.critical_path_item && (
                <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0">
                  Critical
                </Badge>
              )}
              <StatusBadge status={condition.status} />
            </div>
            {condition.internal_description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {condition.internal_description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span>{partyLabel}</span>
              {condition.due_date && (
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  Due: {formatDate(condition.due_date)}
                </span>
              )}
              {condition.submitted_at && (
                <span>Submitted: {formatDate(condition.submitted_at)}</span>
              )}
              {condition.received_date && (
                <span>Received: {formatDate(condition.received_date)}</span>
              )}
              {condition.approved_date && (
                <span className="text-green-700 dark:text-green-400">
                  Approved: {formatDate(condition.approved_date)}
                </span>
              )}
              {condition.reviewed_at && (
                <span className="text-green-700 dark:text-green-400">
                  Reviewed: {formatDate(condition.reviewed_at)}
                </span>
              )}
            </div>
            {condition.rejection_reason && (
              <p className="text-xs text-destructive mt-1">
                Rejection reason: {condition.rejection_reason}
              </p>
            )}
            {condition.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Note: {condition.notes}
              </p>
            )}
            {/* Toggle button */}
            <button
              onClick={togglePanel}
              className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              {panelLoaded
                ? `Notes & ${documents.length} doc${documents.length !== 1 ? "s" : ""}`
                : "Notes & Documents"}
              {panelOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
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

        {/* Comments & Documents Panel */}
        {panelOpen && (
          <div className="border-t bg-muted/60 p-4 space-y-4">
            {/* Documents Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Documents ({documents.length})
                </h4>
                {/* Compact upload trigger */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setUploadFile(e.target.files?.[0] ?? null)
                    }
                  />
                  {uploadFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {uploadFile.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setUploadFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={handleUploadDocument}
                        disabled={uploadLoading}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {uploadLoading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Attach File
                    </Button>
                  )}
                </div>
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No documents attached yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 text-xs bg-card rounded border px-3 py-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="flex-1 truncate">{doc.document_name}</span>
                      <span className="text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </span>
                      <DocumentDownload
                        filePath={doc.file_url}
                        fileName={doc.document_name}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Notes Section */}
            <UnifiedNotes
              entityType="condition"
              entityId={condition.id}
              loanId={loanId}
              showInternalToggle
              compact
            />
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Rejecting: <strong>{condition.condition_name}</strong>
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
    condition_name: "",
    internal_description: "",
    borrower_description: "",
    category: "borrower_documents",
    required_stage: "processing",
    responsible_party: "borrower",
    critical_path_item: false,
    due_date: "",
    notes: "",
  });

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.condition_name) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("loan_conditions").insert({
        loan_id: loanId,
        condition_name: form.condition_name,
        internal_description: form.internal_description || null,
        borrower_description: form.borrower_description || null,
        category: form.category as any,
        required_stage: form.required_stage as any,
        responsible_party: form.responsible_party,
        critical_path_item: form.critical_path_item,
        due_date: form.due_date || null,
        notes: form.notes || null,
        status: "pending" as any,
      });

      if (error) throw error;

      toast({ title: "Condition added" });
      setOpen(false);
      setForm({
        condition_name: "",
        internal_description: "",
        borrower_description: "",
        category: "borrower_documents",
        required_stage: "processing",
        responsible_party: "borrower",
        critical_path_item: false,
        due_date: "",
        notes: "",
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
              Condition Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.condition_name}
              onChange={(e) => updateField("condition_name", e.target.value)}
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
              <div className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={form.critical_path_item}
                  onCheckedChange={(v) =>
                    updateField("critical_path_item", !!v)
                  }
                />
                Critical path item
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Internal Description</Label>
            <Textarea
              value={form.internal_description}
              onChange={(e) => updateField("internal_description", e.target.value)}
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
            <Button type="submit" disabled={loading || !form.condition_name}>
              {loading ? "Adding..." : "Add Condition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
