"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  LOAN_DB_TYPES,
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
  Calculator,
  MessageCircle,
  Mail,
} from "lucide-react";
import type { DrawRequest, LoanPayment, Document, LoanCondition, PricingProgram, LeverageAdjuster } from "@/lib/supabase/types";
import { LoanConditionsTab } from "@/components/admin/loan-conditions-tab";
import { LoanPricingTab } from "@/components/admin/loan-pricing-tab";
import { LoanUnderwritingTab } from "@/components/admin/loan-underwriting-tab";
import { LoanChatter } from "@/components/shared/loan-chatter";
import { EmailActivityFeed, type EmailRecord } from "@/components/crm/email-activity-feed";
import { DealEmailTab } from "@/components/deal/deal-email-tab";
import { DealChatTab } from "@/components/deal/deal-chat-tab";
import type { UnderwritingInputs } from "@/lib/underwriting/types";
import { Scale, Building2, Handshake, HardHat } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { DeleteLoanButton } from "@/components/admin/delete-loan-button";
import { LenderQuotesTab } from "@/components/admin/lender-quotes-tab";
import type { LenderQuote } from "@/lib/supabase/types";
import { ScopeOfWorkTab } from "@/components/admin/budget-draws/scope-of-work-tab";
import type {
  ConstructionBudget,
  BudgetLineItem,
} from "@/components/admin/budget-draws/types";

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
  purchase_price?: number | null;
  points?: number | null;
  after_repair_value?: number | null;
  rehab_budget?: number | null;
  property_type?: string | null;
  heated_sqft?: number | null;
  annual_property_tax?: number | null;
  annual_insurance?: number | null;
  monthly_hoa?: number | null;
  monthly_utilities?: number | null;
  holding_period_months?: number | null;
  sales_disposition_pct?: number | null;
  mobilization_draw?: number | null;
  lender_fees_flat?: number | null;
  title_closing_escrow?: number | null;
  num_partners?: number | null;
  credit_score?: number | null;
  experience_count?: number | null;
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

interface LoanForPricing {
  id: string;
  purchase_price: number | null;
  rehab_budget: number | null;
  after_repair_value: number | null;
  arv: number | null;
  credit_score: number | null;
  experience_deals_24mo: number | null;
  legal_status: string | null;
  property_type: string | null;
  flood_zone: boolean | null;
  is_in_flood_zone: boolean | null;
  rural_status: string | null;
  holding_period_months: number | null;
  loan_term_months: number | null;
  requested_loan_amount: number | null;
  loan_amount: number | null;
  heated_sqft: number | null;
  mobilization_draw: number | null;
  annual_property_tax: number | null;
  annual_insurance: number | null;
  monthly_utilities: number | null;
  monthly_hoa: number | null;
  title_closing_escrow: number | null;
  lender_fees_flat: number | null;
  sales_disposition_pct: number | null;
  num_partners: number | null;
  program_id: string | null;
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
  programs?: PricingProgram[];
  adjusters?: LeverageAdjuster[];
  loanForPricing?: LoanForPricing;
  underwritingVersions?: any[];
  emails?: EmailRecord[];
  borrowerEmail?: string;
  borrowerName?: string;
  currentUserName?: string;
  isSuperAdmin?: boolean;
  lenderQuotes?: LenderQuote[];
  lenderCompanies?: { id: string; name: string }[];
  constructionBudget?: ConstructionBudget | null;
  budgetLineItems?: BudgetLineItem[];
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
  programs,
  adjusters,
  loanForPricing,
  underwritingVersions,
  emails = [],
  borrowerEmail,
  borrowerName,
  currentUserName,
  isSuperAdmin = false,
  lenderQuotes = [],
  lenderCompanies = [],
  constructionBudget = null,
  budgetLineItems = [],
}: LoanDetailActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "conditions";
  const hasPricing = programs && programs.length > 0 && adjusters && loanForPricing;
  const isCommercial = loan.loan_type === "commercial";
  const uwVersions = underwritingVersions ?? [];

  // Build loan defaults for pre-populating first underwriting version
  const loanDefaults: Partial<UnderwritingInputs> = {
    loan_amount: loan.loan_amount,
    purchase_price: loan.purchase_price ?? null,
    appraised_value: loan.appraised_value,
    interest_rate: loan.interest_rate,
    points: loan.points ?? null,
    loan_term_months: loan.term_months,
    loan_type: loan.loan_type,
    property_address: loan.property_address,
    after_repair_value: loan.after_repair_value ?? null,
    rehab_budget: loan.rehab_budget ?? null,
    property_type: loan.property_type ?? null,
    heated_sqft: loan.heated_sqft ?? null,
    annual_property_tax: loan.annual_property_tax ?? null,
    annual_insurance: loan.annual_insurance ?? null,
    monthly_hoa: loan.monthly_hoa ?? null,
    monthly_utilities: loan.monthly_utilities ?? null,
    holding_period_months: loan.holding_period_months ?? null,
    sales_disposition_pct: loan.sales_disposition_pct ?? null,
    mobilization_draw: loan.mobilization_draw ?? null,
    lender_fees_flat: loan.lender_fees_flat ?? null,
    title_closing_escrow: loan.title_closing_escrow ?? null,
    num_partners: loan.num_partners ?? null,
    credit_score: loan.credit_score ?? null,
    experience_count: loan.experience_count ?? null,
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <EditLoanDialog loan={loan} />
        <RecordPaymentDialog loanId={loan.id} borrowerId={loan.borrower_id ?? ""} />
        <UploadDocumentDialog loanId={loan.id} uploaderId={loan.borrower_id ?? ""} />
      </div>

      {/* Tabbed data */}
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="underwriting" className="gap-1">
            <Scale className="h-3.5 w-3.5" />
            Underwriting
          </TabsTrigger>
          <TabsTrigger value="conditions" className="gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            Conditions ({conditions.length})
          </TabsTrigger>
          <TabsTrigger value="deal-chat" className="gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            Chatter
          </TabsTrigger>
          <TabsTrigger value="scope-of-work" className="gap-1">
            <HardHat className="h-3.5 w-3.5" />
            Scope of Work
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="deal-email" className="gap-1">
            <Mail className="h-3.5 w-3.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-1">
            <Handshake className="h-3.5 w-3.5" />
            Quotes ({lenderQuotes.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="h-3.5 w-3.5" />
            Activity
          </TabsTrigger>
          {hasPricing && (
            <TabsTrigger value="pricing" className="gap-1">
              <Calculator className="h-3.5 w-3.5" />
              Pricing
            </TabsTrigger>
          )}
          {isCommercial && (
            <TabsTrigger value="commercial-uw" className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Commercial UW
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="underwriting" className="mt-4">
          <LoanUnderwritingTab
            loanId={loanId}
            versions={uwVersions}
            currentUserId={currentUserId}
            loanDefaults={loanDefaults}
          />
        </TabsContent>

        <TabsContent value="conditions" className="mt-4">
          <LoanConditionsTab
            conditions={conditions}
            loanId={loanId}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="deal-chat" className="mt-4">
          <DealChatTab
            loanId={loanId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </TabsContent>

        <TabsContent value="scope-of-work" className="mt-4">
          <ScopeOfWorkTab
            loanId={loanId}
            budget={constructionBudget ?? null}
            lineItems={budgetLineItems}
            currentUserId={currentUserId}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsTable payments={payments} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTable documents={documents} />
        </TabsContent>

        <TabsContent value="deal-email" className="mt-4">
          <DealEmailTab
            loanId={loanId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            defaultToEmail={borrowerEmail}
            defaultToName={borrowerName}
            propertyAddress={loan.property_address ?? undefined}
            loanType={loan.loan_type ?? undefined}
          />
        </TabsContent>

        <TabsContent value="quotes" className="mt-4">
          <LenderQuotesTab
            quotes={lenderQuotes}
            loanId={loanId}
            companies={lenderCompanies}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityLogTab activityLog={activityLog} />
        </TabsContent>

        {hasPricing && (
          <TabsContent value="pricing" className="mt-4">
            <LoanPricingTab
              loan={loanForPricing}
              programs={programs}
              adjusters={adjusters}
            />
          </TabsContent>
        )}

        {isCommercial && (
          <TabsContent value="commercial-uw" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Commercial Underwriting Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Full commercial underwriting with rent roll, pro forma, financing analysis, and exit modeling.
                </p>
                <Link href={`/admin/loans/${loanId}/commercial-uw`}>
                  <Button>
                    <Building2 className="h-4 w-4 mr-2" />
                    Open Commercial Underwriting
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {isSuperAdmin && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Delete Loan</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove this loan and all associated conditions.
              </p>
            </div>
            <DeleteLoanButton loanId={loan.id} loanNumber={loan.loan_number} />
          </div>
        </>
      )}
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
                  {LOAN_DB_TYPES.map((t) => (
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

// DrawRequestsTab removed — replaced by BudgetDrawsTab

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
        .from("loan-documents")
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
              entry.activity_type?.replace(/_/g, " ") ||
              "Unknown";
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
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {!isLast && (
                    <div className="w-px flex-1 bg-slate-200 my-1" />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-4 flex-1 min-w-0 ${isLast ? "" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
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
                      <span className="line-through">{String(entry.old_value).replace(/_/g, " ")}</span>
                      {" → "}
                      <span className="font-medium">{String(entry.new_value).replace(/_/g, " ")}</span>
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
