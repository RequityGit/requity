"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Lock } from "lucide-react";
import {
  addLoanToServicingAction,
  type ServicingLoanFormData,
} from "@/app/(authenticated)/(admin)/servicing/actions";

interface AddServicingLoanDialogProps {
  isSuperAdmin: boolean;
}

const SERVICING_LOAN_TYPES = [
  { value: "RTL", label: "RTL" },
  { value: "Commercial", label: "Commercial" },
  { value: "DSCR", label: "DSCR" },
  { value: "Transactional", label: "Transactional" },
];

const SERVICING_LOAN_PURPOSES = [
  { value: "Purchase", label: "Purchase" },
  { value: "Refinance", label: "Refinance" },
  { value: "Transactional", label: "Transactional" },
];

const SERVICING_LOAN_STATUSES = [
  { value: "Active", label: "Active" },
  { value: "Paid Off", label: "Paid Off" },
  { value: "Sold", label: "Sold" },
  { value: "In Default", label: "In Default" },
];

const PAYMENT_TYPES = [
  { value: "Interest Only", label: "Interest Only" },
  { value: "P&I", label: "P&I" },
];

const ACH_STATUSES = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const emptyForm: ServicingLoanFormData = {
  loan_id: "",
  borrower_name: "",
  entity_name: "",
  property_address: "",
  city_state_zip: "",
  loan_type: "",
  loan_purpose: "",
  asset_class: "",
  program: "",
  originator: "",
  notes: "",
  loan_status: "Active",
  total_loan_amount: "",
  construction_holdback: "",
  funds_released: "",
  current_balance: "",
  draw_funds_available: "",
  interest_rate: "",
  dutch_interest: false,
  origination_date: "",
  maturity_date: "",
  term_months: "",
  payment_type: "Interest Only",
  monthly_payment: "",
  fund_name: "",
  fund_ownership_pct: "",
  purchase_price: "",
  origination_value: "",
  stabilized_value: "",
  ltv_origination: "",
  ltc: "",
  borrower_credit_score: "",
  origination_fee: "",
  exit_fee: "",
  default_rate: "",
  ach_status: "",
};

function LockedLabel({
  children,
  locked,
  required,
}: {
  children: React.ReactNode;
  locked: boolean;
  required?: boolean;
}) {
  return (
    <Label className="flex items-center gap-1.5">
      {children}
      {required && <span className="text-red-500">*</span>}
      {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
    </Label>
  );
}

export function AddServicingLoanDialog({
  isSuperAdmin,
}: AddServicingLoanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ServicingLoanFormData>({ ...emptyForm });
  const router = useRouter();
  const { toast } = useToast();

  // Fields locked for non-super-admins
  const financialLocked = !isSuperAdmin;

  function updateField(field: keyof ServicingLoanFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.loan_id.trim() || !form.total_loan_amount) return;

    setLoading(true);
    try {
      const result = await addLoanToServicingAction(form);

      if ("error" in result && result.error) {
        toast({
          title: "Error adding loan to servicing",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Loan added to servicing", description: `${form.loan_id} has been boarded.` });
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      console.error("Add to servicing error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Loan to Servicing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Loan to Servicing</DialogTitle>
          <DialogDescription>
            Board a new loan into the servicing tape.
            {financialLocked && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                Financial fields are locked. Only super admins can set loan amounts, rates, and dates.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Loan Identification ─── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Loan Identification
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <LockedLabel locked={false} required>Loan ID</LockedLabel>
                <Input
                  value={form.loan_id}
                  onChange={(e) => updateField("loan_id", e.target.value)}
                  placeholder="RQ-XXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={false}>Loan Type</LockedLabel>
                <Select
                  value={form.loan_type}
                  onValueChange={(v) => updateField("loan_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICING_LOAN_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Status</LockedLabel>
                <Select
                  value={form.loan_status}
                  onValueChange={(v) => updateField("loan_status", v)}
                  disabled={financialLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICING_LOAN_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ─── Borrower & Property ─── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Borrower & Property
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <LockedLabel locked={false}>Borrower Name</LockedLabel>
                <Input
                  value={form.borrower_name}
                  onChange={(e) => updateField("borrower_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={false}>Entity Name</LockedLabel>
                <Input
                  value={form.entity_name}
                  onChange={(e) => updateField("entity_name", e.target.value)}
                  placeholder="Smith Capital LLC"
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={false}>Property Address</LockedLabel>
                <Input
                  value={form.property_address}
                  onChange={(e) => updateField("property_address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={false}>City / State / Zip</LockedLabel>
                <Input
                  value={form.city_state_zip}
                  onChange={(e) => updateField("city_state_zip", e.target.value)}
                  placeholder="Dallas, TX 75201"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <LockedLabel locked={false}>Loan Purpose</LockedLabel>
                <Select
                  value={form.loan_purpose}
                  onValueChange={(v) => updateField("loan_purpose", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICING_LOAN_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LockedLabel locked={false}>Asset Class</LockedLabel>
                <Input
                  value={form.asset_class}
                  onChange={(e) => updateField("asset_class", e.target.value)}
                  placeholder="SFR, Multifamily, etc."
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={false}>Program</LockedLabel>
                <Input
                  value={form.program}
                  onChange={(e) => updateField("program", e.target.value)}
                  placeholder="Fix & Flip, Bridge, etc."
                />
              </div>
            </div>
          </div>

          {/* ─── Financial Terms (locked for non-super-admins) ─── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              Financial Terms
              {financialLocked && (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Super admin only
                </span>
              )}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <LockedLabel locked={financialLocked} required>Total Loan Amount ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.total_loan_amount}
                  onChange={(e) => updateField("total_loan_amount", e.target.value)}
                  placeholder="500000"
                  disabled={financialLocked}
                  required
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Current Balance ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.current_balance}
                  onChange={(e) => updateField("current_balance", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Construction Holdback ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.construction_holdback}
                  onChange={(e) => updateField("construction_holdback", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Funds Released ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.funds_released}
                  onChange={(e) => updateField("funds_released", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Draw Funds Available ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.draw_funds_available}
                  onChange={(e) => updateField("draw_funds_available", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Interest Rate (%)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.interest_rate}
                  onChange={(e) => updateField("interest_rate", e.target.value)}
                  placeholder="12.0"
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Default Rate (%)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.default_rate}
                  onChange={(e) => updateField("default_rate", e.target.value)}
                  placeholder="24.0"
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Dutch Interest</LockedLabel>
                <Select
                  value={form.dutch_interest ? "yes" : "no"}
                  onValueChange={(v) => updateField("dutch_interest", v === "yes")}
                  disabled={financialLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Monthly Payment ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monthly_payment}
                  onChange={(e) => updateField("monthly_payment", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
            </div>
          </div>

          {/* ─── Dates & Terms (locked for non-super-admins) ─── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              Dates & Terms
              {financialLocked && (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Super admin only
                </span>
              )}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Origination Date</LockedLabel>
                <DatePicker
                  value={form.origination_date}
                  onChange={(value) => updateField("origination_date", value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Maturity Date</LockedLabel>
                <DatePicker
                  value={form.maturity_date}
                  onChange={(value) => updateField("maturity_date", value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Term (months)</LockedLabel>
                <Input
                  type="number"
                  min="1"
                  value={form.term_months}
                  onChange={(e) => updateField("term_months", e.target.value)}
                  placeholder="12"
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Payment Type</LockedLabel>
                <Select
                  value={form.payment_type}
                  onValueChange={(v) => updateField("payment_type", v)}
                  disabled={financialLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ─── Valuation & Credit (locked for non-super-admins) ─── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              Valuation & Credit
              {financialLocked && (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Super admin only
                </span>
              )}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Purchase Price ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.purchase_price}
                  onChange={(e) => updateField("purchase_price", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Origination Value ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.origination_value}
                  onChange={(e) => updateField("origination_value", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Stabilized Value ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.stabilized_value}
                  onChange={(e) => updateField("stabilized_value", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>LTV at Origination (%)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.ltv_origination}
                  onChange={(e) => updateField("ltv_origination", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>LTC (%)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.ltc}
                  onChange={(e) => updateField("ltc", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Credit Score</LockedLabel>
                <Input
                  type="number"
                  min="300"
                  max="850"
                  value={form.borrower_credit_score}
                  onChange={(e) => updateField("borrower_credit_score", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
            </div>
          </div>

          {/* ─── Fund & Fees (locked for non-super-admins) ─── */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              Fund & Fees
              {financialLocked && (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Super admin only
                </span>
              )}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Fund Name</LockedLabel>
                <Input
                  value={form.fund_name}
                  onChange={(e) => updateField("fund_name", e.target.value)}
                  placeholder="Requity Debt Fund I"
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Fund Ownership (%)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.fund_ownership_pct}
                  onChange={(e) => updateField("fund_ownership_pct", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>ACH Status</LockedLabel>
                <Select
                  value={form.ach_status}
                  onValueChange={(v) => updateField("ach_status", v)}
                  disabled={financialLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACH_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Origination Fee ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.origination_fee}
                  onChange={(e) => updateField("origination_fee", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
              <div className="space-y-2">
                <LockedLabel locked={financialLocked}>Exit Fee ($)</LockedLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.exit_fee}
                  onChange={(e) => updateField("exit_fee", e.target.value)}
                  disabled={financialLocked}
                />
              </div>
            </div>
          </div>

          {/* ─── Originator & Notes ─── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <LockedLabel locked={false}>Originator</LockedLabel>
              <Input
                value={form.originator}
                onChange={(e) => updateField("originator", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <LockedLabel locked={false}>Notes</LockedLabel>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Internal notes about this servicing loan..."
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
            <Button
              type="submit"
              disabled={loading || !form.loan_id.trim() || (!isSuperAdmin && !form.total_loan_amount)}
            >
              {loading ? "Adding..." : "Add to Servicing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
