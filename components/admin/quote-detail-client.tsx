"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  updateLenderQuote,
  changeQuoteStatus,
  addQuoteActivity,
  deleteLenderQuote,
} from "@/app/(authenticated)/admin/loans/[id]/quote-actions";
import {
  Pencil,
  Loader2,
  ArrowRight,
  XCircle,
  CheckCircle2,
  MessageSquare,
  Phone,
  Mail,
  FileUp,
  Trash2,
  Save,
  DollarSign,
} from "lucide-react";
import type { LenderQuote } from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  request_for_quote: "Request for Quote",
  term_sheet_unsigned: "Term Sheet - Unsigned",
  term_sheet_accepted: "Term Sheet - Accepted",
  declined: "Declined",
  complete: "Complete",
};

const STATUS_COLORS: Record<string, string> = {
  request_for_quote: "bg-blue-100 text-blue-800 border-blue-200",
  term_sheet_unsigned: "bg-amber-100 text-amber-800 border-amber-200",
  term_sheet_accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const STATUS_ORDER = [
  "request_for_quote",
  "term_sheet_unsigned",
  "term_sheet_accepted",
  "complete",
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  status_change: <ArrowRight className="h-3.5 w-3.5" />,
  note: <MessageSquare className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  document_uploaded: <FileUp className="h-3.5 w-3.5" />,
};

interface ActivityWithName {
  id: string;
  created_at: string;
  quote_id: string;
  activity_type: string;
  description: string;
  old_status: string | null;
  new_status: string | null;
  created_by: string | null;
  creator_name: string;
}

interface Company {
  id: string;
  name: string;
}

interface QuoteDetailClientProps {
  quote: LenderQuote;
  loanId: string;
  loanNumber: string | null;
  borrowerName: string;
  lenderCompanyName: string | null;
  companies: Company[];
  activities: ActivityWithName[];
  requityFeeIncome: number | null;
  currentUserId: string;
}

export function QuoteDetailClient({
  quote,
  loanId,
  loanNumber,
  borrowerName,
  lenderCompanyName,
  companies,
  activities,
  requityFeeIncome,
  currentUserId,
}: QuoteDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Activity form state
  const [activityType, setActivityType] = useState("note");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    quote_name: quote.quote_name,
    lender_company_id: quote.lender_company_id ?? "",
    lender_contact_name: quote.lender_contact_name ?? "",
    loan_amount: quote.loan_amount?.toString() ?? "",
    interest_rate: quote.interest_rate?.toString() ?? "",
    loan_term_months: quote.loan_term_months?.toString() ?? "",
    interest_only_period_months:
      quote.interest_only_period_months?.toString() ?? "",
    ltv: quote.ltv?.toString() ?? "",
    amortization_months: quote.amortization_months?.toString() ?? "",
    origination_fee: quote.origination_fee?.toString() ?? "",
    uw_processing_fee: quote.uw_processing_fee?.toString() ?? "",
    requity_lending_fee: quote.requity_lending_fee?.toString() ?? "",
    prepayment_penalty: quote.prepayment_penalty ?? "",
    ym_spread: quote.ym_spread?.toString() ?? "",
    ym_amount: quote.ym_amount?.toString() ?? "",
    term_sheet_url: quote.term_sheet_url ?? "",
    description: quote.description ?? "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function parseNum(val: string): number | null {
    if (!val.trim()) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  function parseInt2(val: string): number | null {
    if (!val.trim()) return null;
    const n = parseInt(val);
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateLenderQuote(quote.id, {
        quote_name: form.quote_name,
        lender_company_id: form.lender_company_id || null,
        lender_contact_name: form.lender_contact_name || null,
        loan_amount: parseNum(form.loan_amount),
        interest_rate: parseNum(form.interest_rate),
        loan_term_months: parseInt2(form.loan_term_months),
        interest_only_period_months: parseInt2(
          form.interest_only_period_months
        ),
        ltv: parseNum(form.ltv),
        amortization_months: parseInt2(form.amortization_months),
        origination_fee: parseNum(form.origination_fee),
        uw_processing_fee: parseNum(form.uw_processing_fee),
        requity_lending_fee: parseNum(form.requity_lending_fee),
        prepayment_penalty: form.prepayment_penalty || null,
        ym_spread: parseNum(form.ym_spread),
        ym_amount: parseNum(form.ym_amount),
        term_sheet_url: form.term_sheet_url || null,
        description: form.description || null,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Quote updated" });
      setEditing(false);
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusAdvance() {
    const currentIdx = STATUS_ORDER.indexOf(quote.status);
    if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];

    setStatusLoading(true);
    try {
      const result = await changeQuoteStatus(quote.id, nextStatus);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: `Status updated to ${STATUS_LABELS[nextStatus] ?? nextStatus}`,
      });
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDecline() {
    setStatusLoading(true);
    try {
      const result = await changeQuoteStatus(
        quote.id,
        "declined",
        declineReason || undefined
      );
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Quote declined" });
      setDeclineDialogOpen(false);
      setDeclineReason("");
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityDescription.trim()) return;

    setActivityLoading(true);
    try {
      const result = await addQuoteActivity({
        quote_id: quote.id,
        activity_type: activityType,
        description: activityDescription.trim(),
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Activity logged" });
      setActivityDescription("");
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActivityLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const result = await deleteLenderQuote(quote.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Quote deleted" });
      router.push(`/admin/loans/${loanId}?tab=quotes`);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  const nextStatus =
    STATUS_ORDER[STATUS_ORDER.indexOf(quote.status) + 1] ?? null;
  const isTerminal =
    quote.status === "declined" || quote.status === "complete";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column — Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-sm px-3 py-1",
                    STATUS_COLORS[quote.status] ?? ""
                  )}
                >
                  {STATUS_LABELS[quote.status] ?? quote.status}
                </Badge>
                {quote.status_changed_at && (
                  <span className="text-xs text-muted-foreground">
                    since {formatDate(quote.status_changed_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isTerminal && nextStatus && (
                  <Button
                    size="sm"
                    onClick={handleStatusAdvance}
                    disabled={statusLoading}
                    className="gap-1"
                  >
                    {statusLoading && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <ArrowRight className="h-3.5 w-3.5" />
                    {STATUS_LABELS[nextStatus]}
                  </Button>
                )}
                {!isTerminal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineDialogOpen(true)}
                    disabled={statusLoading}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Decline
                  </Button>
                )}
              </div>
            </div>

            {/* Status progression dots */}
            <div className="mt-4 flex items-center gap-1">
              {STATUS_ORDER.map((s, i) => {
                const currentIdx = STATUS_ORDER.indexOf(quote.status);
                const isActive = i <= currentIdx;
                const isCurrent = s === quote.status;
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        isCurrent
                          ? "bg-blue-600 ring-2 ring-blue-200"
                          : isActive
                            ? "bg-blue-400"
                            : "bg-gray-200"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px]",
                        isCurrent
                          ? "text-blue-700 font-medium"
                          : isActive
                            ? "text-blue-500"
                            : "text-gray-400"
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </span>
                    {i < STATUS_ORDER.length - 1 && (
                      <div
                        className={cn(
                          "w-6 h-0.5",
                          isActive ? "bg-blue-300" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quote Information */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Quote Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setEditing(!editing)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <EditForm
                form={form}
                updateField={updateField}
                companies={companies}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <ReadOnlyView
                quote={quote}
                lenderCompanyName={lenderCompanyName}
                requityFeeIncome={requityFeeIncome}
              />
            )}
          </CardContent>
        </Card>

        {/* Linked Records */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Linked Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Loan</p>
                <a
                  href={`/admin/loans/${loanId}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {loanNumber ?? "—"}
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Borrower</p>
                <p className="text-sm font-medium">{borrowerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Lender Company
                </p>
                <p className="text-sm font-medium">
                  {lenderCompanyName ?? "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Zone */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-medium text-red-600">Delete Quote</p>
            <p className="text-xs text-muted-foreground">
              Permanently remove this quote and its activity log.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Right Column — Activity Timeline */}
      <div className="space-y-4">
        {/* Add Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Log Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddActivity} className="space-y-3">
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="document_uploaded">
                    Document Uploaded
                  </SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="What happened?"
                rows={3}
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={activityLoading || !activityDescription.trim()}
              >
                {activityLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Log Activity
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Activity Timeline ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          activity.activity_type === "status_change"
                            ? "bg-blue-100 text-blue-600"
                            : activity.activity_type === "call"
                              ? "bg-purple-100 text-purple-600"
                              : activity.activity_type === "email"
                                ? "bg-amber-100 text-amber-600"
                                : activity.activity_type ===
                                    "document_uploaded"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {ACTIVITY_ICONS[activity.activity_type] ?? (
                          <MessageSquare className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.creator_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <DateField label="Created" value={quote.created_at} />
              <DateField label="Quote Requested" value={quote.requested_at} />
              <DateField label="Term Sheet Received" value={quote.received_at} />
              <DateField label="Accepted" value={quote.accepted_at} />
              <DateField label="Declined" value={quote.declined_at} />
              {quote.declined_reason && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Decline Reason
                  </p>
                  <p className="text-sm text-red-600">
                    {quote.declined_reason}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decline Dialog */}
      <AlertDialog
        open={declineDialogOpen}
        onOpenChange={setDeclineDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this quote?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="declineReason">Reason (optional)</Label>
            <Textarea
              id="declineReason"
              placeholder="Why is this quote being declined?"
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialogOpen(false)}
              disabled={statusLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={statusLoading}
            >
              {statusLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Decline Quote
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{quote.quote_name}&quot; and
              all associated activity. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Read-Only View ────────────────────────────────────────────────────────

function ReadOnlyView({
  quote,
  lenderCompanyName,
  requityFeeIncome,
}: {
  quote: LenderQuote;
  lenderCompanyName: string | null;
  requityFeeIncome: number | null;
}) {
  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
        <DetailField label="Quote Name" value={quote.quote_name} />
        <DetailField label="Lender" value={lenderCompanyName ?? "—"} />
        <DetailField
          label="Lender Contact"
          value={quote.lender_contact_name ?? "—"}
        />
      </div>

      <Separator />

      {/* Loan Terms */}
      <h4 className="text-sm font-medium text-[#1a2b4a]">Loan Terms</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
        <DetailField
          label="Loan Amount"
          value={formatCurrency(quote.loan_amount)}
        />
        <DetailField
          label="Interest Rate"
          value={formatPercent(quote.interest_rate)}
        />
        <DetailField
          label="Loan Term"
          value={
            quote.loan_term_months != null
              ? `${quote.loan_term_months} months`
              : "—"
          }
        />
        <DetailField
          label="IO Period"
          value={
            quote.interest_only_period_months != null
              ? `${quote.interest_only_period_months} months`
              : "—"
          }
        />
        <DetailField
          label="LTV"
          value={
            quote.ltv != null ? formatPercent(quote.ltv * 100) : "—"
          }
        />
        <DetailField
          label="Amortization"
          value={
            quote.amortization_months != null
              ? `${quote.amortization_months} months`
              : "—"
          }
        />
      </div>

      <Separator />

      {/* Fees */}
      <h4 className="text-sm font-medium text-[#1a2b4a]">Fees</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
        <DetailField
          label="Origination Fee"
          value={formatPercent(quote.origination_fee)}
        />
        <DetailField
          label="UW / Processing Fee"
          value={formatCurrencyDetailed(quote.uw_processing_fee)}
        />
        <DetailField
          label="Requity Lending Fee"
          value={formatPercent(quote.requity_lending_fee)}
        />
        <div>
          <p className="text-xs text-muted-foreground">
            Requity Fee Income
          </p>
          <p className="text-sm font-semibold text-green-700">
            {requityFeeIncome != null
              ? formatCurrency(requityFeeIncome)
              : "—"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Prepayment / YM */}
      <h4 className="text-sm font-medium text-[#1a2b4a]">
        Prepayment / Yield Maintenance
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
        <DetailField
          label="Prepayment Penalty"
          value={quote.prepayment_penalty ?? "—"}
        />
        <DetailField
          label="YM Spread"
          value={formatPercent(quote.ym_spread)}
        />
        <DetailField
          label="YM Amount"
          value={formatCurrencyDetailed(quote.ym_amount)}
        />
      </div>

      {/* Notes & Term Sheet */}
      {(quote.description || quote.term_sheet_url) && (
        <>
          <Separator />
          {quote.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">
                {quote.description}
              </p>
            </div>
          )}
          {quote.term_sheet_url && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Term Sheet
              </p>
              <a
                href={quote.term_sheet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Term Sheet
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Edit Form ─────────────────────────────────────────────────────────────

function EditForm({
  form,
  updateField,
  companies,
  saving,
  onSave,
  onCancel,
}: {
  form: Record<string, string>;
  updateField: (field: string, value: string) => void;
  companies: Company[];
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quote Name *</Label>
          <Input
            value={form.quote_name}
            onChange={(e) => updateField("quote_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Lender Company</Label>
          <Select
            value={form.lender_company_id}
            onValueChange={(v) => updateField("lender_company_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select lender..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Lender Contact</Label>
          <Input
            value={form.lender_contact_name}
            onChange={(e) =>
              updateField("lender_contact_name", e.target.value)
            }
          />
        </div>
      </div>

      <Separator />

      {/* Loan Terms */}
      <h4 className="text-sm font-medium text-[#1a2b4a]">Loan Terms</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Loan Amount</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.loan_amount}
            onChange={(e) => updateField("loan_amount", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Interest Rate (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.0001"
            value={form.interest_rate}
            onChange={(e) => updateField("interest_rate", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Term (months)</Label>
          <Input
            type="number"
            min="0"
            value={form.loan_term_months}
            onChange={(e) => updateField("loan_term_months", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>IO Period (months)</Label>
          <Input
            type="number"
            min="0"
            value={form.interest_only_period_months}
            onChange={(e) =>
              updateField("interest_only_period_months", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label>LTV (decimal, e.g. 0.75)</Label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.0001"
            value={form.ltv}
            onChange={(e) => updateField("ltv", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Amortization (months)</Label>
          <Input
            type="number"
            min="0"
            value={form.amortization_months}
            onChange={(e) =>
              updateField("amortization_months", e.target.value)
            }
          />
        </div>
      </div>

      <Separator />

      {/* Fees */}
      <h4 className="text-sm font-medium text-[#1a2b4a]">Fees</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Origination Fee (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.0001"
            value={form.origination_fee}
            onChange={(e) => updateField("origination_fee", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>UW / Processing Fee ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.uw_processing_fee}
            onChange={(e) =>
              updateField("uw_processing_fee", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Requity Lending Fee (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.0001"
            value={form.requity_lending_fee}
            onChange={(e) =>
              updateField("requity_lending_fee", e.target.value)
            }
          />
        </div>
      </div>

      <Separator />

      {/* Prepayment / YM */}
      <h4 className="text-sm font-medium text-[#1a2b4a]">
        Prepayment / Yield Maintenance
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Prepayment Penalty</Label>
          <Input
            value={form.prepayment_penalty}
            placeholder='e.g. "5-4-3-2-1"'
            onChange={(e) =>
              updateField("prepayment_penalty", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label>YM Spread (%)</Label>
          <Input
            type="number"
            min="0"
            step="0.0001"
            value={form.ym_spread}
            onChange={(e) => updateField("ym_spread", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>YM Amount ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.ym_amount}
            onChange={(e) => updateField("ym_amount", e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Notes / Term Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Term Sheet URL</Label>
          <Input
            value={form.term_sheet_url}
            placeholder="https://..."
            onChange={(e) => updateField("term_sheet_url", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>

      {/* Save / Cancel */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving} className="gap-1">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function DateField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{formatDate(value)}</p>
    </div>
  );
}
