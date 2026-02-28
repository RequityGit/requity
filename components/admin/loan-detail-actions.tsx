"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
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
import { FileUpload } from "@/components/shared/file-upload";
import {
  LOAN_TYPES,
  LOAN_STAGES,
  LOAN_STAGE_LABELS,
  DOCUMENT_TYPES,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import {
  Pencil,
  CheckCircle2,
  XCircle,
  DollarSign,
  Upload,
  ClipboardList,
  Activity,
} from "lucide-react";
import type { DrawRequest, LoanPayment, Document, LoanCondition } from "@/lib/supabase/types";
import { LoanConditionsTab } from "@/components/admin/loan-conditions-tab";

interface LoanInfo {
  id: string;
  loan_number: string | null;
  borrower_id: string | null;
  borrower_name: string;
  loan_type: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  loan_amount: number | null;
  interest_rate: number | null;
  term_months: number | null;
  origination_date: string | null;
  maturity_date: string | null;
  stage: string;
  ltv: number | null;
  appraised_value: number | null;
  notes: string | null;
}

interface ActivityLogEntry {
  id: string;
  loan_id: string;
  user_id: string | null;
  activity_type: string;
  description: string | null;
  old_value: string | null;
  new_value: string | null;
  field_name: string | null;
  created_at: string;
  user?: { full_name: string | null } | null;
}

interface LoanDetailActionsProps {
  loan: LoanInfo;
  drawRequests: DrawRequest[];
  payments: LoanPayment[];
  documents: Document[];
  conditions: LoanCondition[];
  activityLog: ActivityLogEntry[];
  currentUserId: string;
  loanId: string;
}

export function LoanDetailActions({
  loan,
  drawRequests,
  payments,
  documents,
  conditions,
  activityLog,
  currentUserId,
  loanId,
}: LoanDetailActionsProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <EditLoanDialog loan={loan} />
        <RecordPaymentDialog loanId={loan.id} borrowerId={loan.borrower_id ?? ""} />
        <UploadDocumentDialog loanId={loan.id} uploaderId={loan.borrower_id ?? ""} />
      </div>

      {/* Tabbed data */}
      <Tabs defaultValue="conditions">
        <TabsList>
          <TabsTrigger value="conditions" className="gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            Conditions ({conditions.length})
          </TabsTrigger>
          <TabsTrigger value="draw-requests">
            Draw Requests ({drawRequests.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="h-3.5 w-3.5" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="mt-4">
          <LoanConditionsTab
            conditions={conditions}
            loanId={loanId}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="draw-requests" className="mt-4">
          <DrawRequestsTab
            drawRequests={drawRequests}
            loanId={loan.id}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsTable payments={payments} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTable documents={documents} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityLogTab activityLog={activityLog} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Loan Dialog
// ---------------------------------------------------------------------------

function EditLoanDialog({ loan }: { loan: LoanInfo }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    loan_type: loan.loan_type ?? "",
    property_address: loan.property_address ?? "",
    property_city: loan.property_city || "",
    property_state: loan.property_state || "",
    property_zip: loan.property_zip || "",
    loan_amount: (loan.loan_amount ?? 0).toString(),
    interest_rate: loan.interest_rate?.toString() ?? "",
    term_months: loan.term_months?.toString() ?? "",
    stage: loan.stage,
    appraised_value: loan.appraised_value?.toString() || "",
    origination_date: loan.origination_date || "",
    maturity_date: loan.maturity_date || "",
    notes: loan.notes || "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      // All optional fields use conditional spread so that empty/null values
      // are not sent to PostgREST. This prevents "schema cache" errors when a
      // column exists in the migration but PostgREST hasn't refreshed yet.
      const { error } = await supabase
        .from("loans")
        .update({
          loan_amount: parseFloat(form.loan_amount),
          stage: form.stage as any,
          stage_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(form.loan_type ? { type: form.loan_type as any } : {}),
          ...(form.property_address ? { property_address: form.property_address } : {}),
          ...(form.property_city ? { property_city: form.property_city } : { property_city: null }),
          ...(form.property_state ? { property_state: form.property_state } : { property_state: null }),
          ...(form.property_zip ? { property_zip: form.property_zip } : { property_zip: null }),
          ...(form.interest_rate ? { interest_rate: parseFloat(form.interest_rate) } : {}),
          ...(form.term_months ? { loan_term_months: parseInt(form.term_months) } : {}),
          ...(form.appraised_value ? { appraised_value: parseFloat(form.appraised_value) } : {}),
          ...(form.origination_date ? { origination_date: form.origination_date } : {}),
          ...(form.maturity_date ? { maturity_date: form.maturity_date } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        })
        .eq("id", loan.id);

      if (error) throw error;

      toast({ title: "Loan updated successfully" });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      const isSchemaError = err.message?.includes("schema cache") || err.message?.includes("Could not find the");
      toast({
        title: "Error updating loan",
        description: isSchemaError
          ? "Database schema needs to be refreshed. Please contact your administrator to reload the Supabase schema cache."
          : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Loan {loan.loan_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select
                value={form.loan_type}
                onValueChange={(v) => updateField("loan_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => updateField("stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LOAN_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Property Address</Label>
            <Input
              value={form.property_address}
              onChange={(e) => updateField("property_address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.property_city}
                onChange={(e) => updateField("property_city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={form.property_state}
                onChange={(e) => updateField("property_state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ZIP</Label>
              <Input
                value={form.property_zip}
                onChange={(e) => updateField("property_zip", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Loan Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.loan_amount}
                onChange={(e) => updateField("loan_amount", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.interest_rate}
                onChange={(e) => updateField("interest_rate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Term (months)</Label>
              <Input
                type="number"
                value={form.term_months}
                onChange={(e) => updateField("term_months", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Appraised Value ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.appraised_value}
                onChange={(e) =>
                  updateField("appraised_value", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Origination Date</Label>
              <Input
                type="date"
                value={form.origination_date}
                onChange={(e) =>
                  updateField("origination_date", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Maturity Date</Label>
              <Input
                type="date"
                value={form.maturity_date}
                onChange={(e) => updateField("maturity_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Draw Requests Tab (with approve/deny)
// ---------------------------------------------------------------------------

function DrawRequestsTab({
  drawRequests,
  loanId,
}: {
  drawRequests: DrawRequest[];
  loanId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleReview(
    drawId: string,
    action: "approved" | "denied",
    amountApproved?: number
  ) {
    setProcessing(drawId);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("draw_requests")
        .update({
          status: action,
          amount_approved: action === "approved" ? amountApproved : null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", drawId);

      if (error) throw error;

      toast({
        title: `Draw request ${action}`,
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error reviewing draw request",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  }

  const columns: Column<DrawRequest>[] = [
    {
      key: "draw_number",
      header: "Draw #",
      cell: (row) => row.draw_number,
    },
    {
      key: "amount_requested",
      header: "Requested",
      cell: (row) => formatCurrency(row.amount_requested),
    },
    {
      key: "amount_approved",
      header: "Approved",
      cell: (row) => formatCurrency(row.amount_approved),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => row.description || "—",
    },
    {
      key: "submitted_at",
      header: "Submitted",
      cell: (row) => formatDate(row.submitted_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => {
        if (row.status !== "submitted" && row.status !== "under_review")
          return null;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-green-700 hover:text-green-800"
              disabled={processing === row.id}
              onClick={(e) => {
                e.stopPropagation();
                handleReview(row.id, "approved", row.amount_requested);
              }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-red-700 hover:text-red-800"
              disabled={processing === row.id}
              onClick={(e) => {
                e.stopPropagation();
                handleReview(row.id, "denied");
              }}
            >
              <XCircle className="h-3 w-3" />
              Deny
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable<DrawRequest>
      columns={columns}
      data={drawRequests}
      emptyMessage="No draw requests for this loan."
    />
  );
}

// ---------------------------------------------------------------------------
// Record Payment Dialog
// ---------------------------------------------------------------------------

function RecordPaymentDialog({
  loanId,
  borrowerId,
}: {
  loanId: string;
  borrowerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !paymentDate) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from("loan_payments").insert({
        loan_id: loanId,
        amount: parseFloat(amount),
        principal_amount: principalAmount
          ? parseFloat(principalAmount)
          : null,
        interest_amount: interestAmount ? parseFloat(interestAmount) : null,
        payment_date: paymentDate,
        status: "paid",
        notes: notes || null,
      });

      if (error) throw error;

      toast({ title: "Payment recorded successfully" });
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error recording payment",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setAmount("");
    setPrincipalAmount("");
    setInterestAmount("");
    setPaymentDate("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Principal ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Interest ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Upload Document Dialog
// ---------------------------------------------------------------------------

function UploadDocumentDialog({
  loanId,
  uploaderId,
}: {
  loanId: string;
  uploaderId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentType || !file) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const filePath = `loans/${loanId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        owner_id: uploaderId,
        uploaded_by: uploaderId,
        loan_id: loanId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        description: displayName || null,
        status: "pending",
      });

      if (dbError) throw dbError;

      toast({ title: "Document uploaded successfully" });
      setOpen(false);
      setDocumentType("");
      setDisplayName("");
      setFile(null);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error uploading document",
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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Display Name (optional)</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Appraisal Report"
            />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
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
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Simple Payments Table
// ---------------------------------------------------------------------------

function PaymentsTable({ payments }: { payments: LoanPayment[] }) {
  const columns: Column<LoanPayment>[] = [
    {
      key: "payment_date",
      header: "Date",
      cell: (row) => formatDate(row.payment_date),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.amount),
    },
    {
      key: "principal_amount",
      header: "Principal",
      cell: (row) => formatCurrency(row.principal_amount),
    },
    {
      key: "interest_amount",
      header: "Interest",
      cell: (row) => formatCurrency(row.interest_amount),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable<LoanPayment>
      columns={columns}
      data={payments}
      emptyMessage="No payments for this loan."
    />
  );
}

// ---------------------------------------------------------------------------
// Simple Documents Table
// ---------------------------------------------------------------------------

function DocumentsTable({ documents }: { documents: Document[] }) {
  const columns: Column<Document>[] = [
    {
      key: "file_name",
      header: "File Name",
      cell: (row) => (
        <span className="font-medium">{row.description || row.file_name}</span>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {row.document_type?.replace(/_/g, " ") ?? "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status ?? "pending"} />,
    },
  ];

  return (
    <DataTable<Document>
      columns={columns}
      data={documents}
      emptyMessage="No documents for this loan."
    />
  );
}

// ---------------------------------------------------------------------------
// Activity Log Tab
// ---------------------------------------------------------------------------

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  loan_created: "Loan Created",
  stage_change: "Stage Change",
  condition_status_change: "Condition Updated",
  field_updated: "Field Updated",
  document_uploaded: "Document Uploaded",
  draw_submitted: "Draw Submitted",
  draw_reviewed: "Draw Reviewed",
  payment_recorded: "Payment Recorded",
  note_added: "Note Added",
};

function ActivityLogTab({
  activityLog,
}: {
  activityLog: ActivityLogEntry[];
}) {
  if (activityLog.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <div className="space-y-0">
          {activityLog.map((entry, idx) => {
            const isLast = idx === activityLog.length - 1;
            const typeLabel =
              ACTIVITY_TYPE_LABELS[entry.activity_type] ||
              entry.activity_type.replace(/_/g, " ");
            const userName =
              (entry as any).user?.full_name || "System";
            const timestamp = new Date(entry.created_at);
            const timeStr = timestamp.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div key={entry.id} className="flex gap-3">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#1a2b4a] mt-2 flex-shrink-0" />
                  {!isLast && (
                    <div className="w-px flex-1 bg-slate-200 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-4 flex-1 min-w-0 ${isLast ? "" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-[#1a2b4a]">
                      {typeLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      by {userName}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {timeStr}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {entry.description}
                    </p>
                  )}
                  {entry.old_value && entry.new_value && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="line-through">{entry.old_value.replace(/_/g, " ")}</span>
                      {" → "}
                      <span className="font-medium">{entry.new_value.replace(/_/g, " ")}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
