"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { LOAN_PRIORITIES, LOAN_DB_TYPES, LOAN_PURPOSES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Search, Check, X, UserPlus } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
}

interface Borrower {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
}

interface CreateLoanDialogProps {
  teamMembers: TeamMember[];
  borrowers: Borrower[];
  currentUserId: string;
  /** Open the dialog on mount (e.g. from URL params) */
  initialOpen?: boolean;
  /** Pre-select a borrower by ID */
  initialBorrowerId?: string;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export function CreateLoanDialog({
  teamMembers,
  borrowers,
  currentUserId,
  initialOpen = false,
  initialBorrowerId,
}: CreateLoanDialogProps) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [borrowerDropdownOpen, setBorrowerDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const borrowerRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filteredBorrowers = useMemo(() => {
    if (!borrowerSearch.trim()) return borrowers;
    const query = borrowerSearch.toLowerCase();
    return borrowers.filter(
      (b) =>
        b.full_name?.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.company_name?.toLowerCase().includes(query)
    );
  }, [borrowers, borrowerSearch]);

  // Calculate dropdown position relative to viewport
  const updateDropdownPosition = useCallback(() => {
    if (borrowerRef.current) {
      const rect = borrowerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Recalculate position when dropdown opens
  useEffect(() => {
    if (!borrowerDropdownOpen) {
      setDropdownPosition(null);
      return;
    }
    updateDropdownPosition();
  }, [borrowerDropdownOpen, updateDropdownPosition]);

  // Close dropdown on dialog scroll or window resize
  useEffect(() => {
    if (!borrowerDropdownOpen) return;

    const handleResize = () => setBorrowerDropdownOpen(false);
    window.addEventListener("resize", handleResize);

    const dialogEl = borrowerRef.current?.closest('[role="dialog"]');
    const handleScroll = () => setBorrowerDropdownOpen(false);
    if (dialogEl) {
      dialogEl.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (dialogEl) {
        dialogEl.removeEventListener("scroll", handleScroll, true);
      }
    };
  }, [borrowerDropdownOpen]);

  // Close dropdown on click outside (checks both trigger and portal)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideTrigger = borrowerRef.current?.contains(target);
      const isInsideDropdown = dropdownMenuRef.current?.contains(target);
      if (!isInsideTrigger && !isInsideDropdown) {
        setBorrowerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [form, setForm] = useState({
    borrower_id: initialBorrowerId || "",
    type: "",
    purpose: "",
    property_address: "",
    property_city: "",
    property_state: "",
    property_zip: "",
    loan_amount: "",
    purchase_price: "",
    appraised_value: "",
    arv: "",
    interest_rate: "",
    points: "",
    origination_fee: "",
    term_months: "",
    originator_id: "",
    processor_id: "",
    priority: "normal",
    expected_close_date: "",
    notes: "",
  });

  const selectedBorrower = borrowers.find((b) => b.id === form.borrower_id);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      borrower_id: "",
      type: "",
      purpose: "",
      property_address: "",
      property_city: "",
      property_state: "",
      property_zip: "",
      loan_amount: "",
      purchase_price: "",
      appraised_value: "",
      arv: "",
      interest_rate: "",
      points: "",
      origination_fee: "",
      term_months: "",
      originator_id: "",
      processor_id: "",
      priority: "normal",
      expected_close_date: "",
      notes: "",
    });
    setBorrowerSearch("");
    setBorrowerDropdownOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.borrower_id || !form.loan_amount || !form.type || !form.purpose) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Create the loan
      // All optional fields use conditional spread so that empty/null values
      // are not sent to PostgREST. This prevents "schema cache" errors when a
      // column exists in the migration but PostgREST hasn't refreshed yet.
      const originatorName = teamMembers.find((t) => t.id === form.originator_id)?.full_name;
      const { data: newLoan, error: loanError } = await supabase
        .from("loans")
        .insert({
          borrower_id: form.borrower_id,
          type: form.type as "commercial" | "dscr" | "guc" | "rtl" | "transactional",
          purpose: form.purpose as "purchase" | "refinance" | "cash_out_refinance",
          loan_amount: parseFloat(form.loan_amount),
          ...(form.property_address ? { property_address: form.property_address } : {}),
          ...(form.property_city ? { property_city: form.property_city } : {}),
          ...(form.property_state ? { property_state: form.property_state } : {}),
          ...(form.property_zip ? { property_zip: form.property_zip } : {}),
          ...(form.appraised_value ? { appraised_value: parseFloat(form.appraised_value) } : {}),
          ...(form.interest_rate ? { interest_rate: parseFloat(form.interest_rate) } : {}),
          ...(form.term_months ? { loan_term_months: parseInt(form.term_months) } : {}),
          ...(originatorName ? { originator: originatorName } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
          ...(form.purchase_price ? { purchase_price: parseFloat(form.purchase_price) } : {}),
          ...(form.arv ? { arv: parseFloat(form.arv) } : {}),
          ...(form.points ? { points: parseFloat(form.points) } : {}),
          ...(form.origination_fee ? { origination_fee: parseFloat(form.origination_fee) } : {}),
          ...(form.originator_id ? { originator_id: form.originator_id } : {}),
          ...(form.processor_id ? { processor_id: form.processor_id } : {}),
          ...(form.priority !== "normal" ? { priority: form.priority } : {}),
          ...(form.expected_close_date ? { expected_close_date: form.expected_close_date } : {}),
        })
        .select()
        .single();

      if (loanError) throw loanError;

      // 2. Log the loan creation in activity log
      await supabase.from("loan_activity_log").insert({
        loan_id: newLoan.id,
        performed_by: currentUserId,
        action: "loan_created",
        description: `Loan created for ${form.property_address || "new property"}`,
      });

      toast({ title: "Loan created successfully" });
      setOpen(false);
      resetForm();
      router.push(`/admin/deals/${newLoan.id}`);
    } catch (err: any) {
      console.error("Loan creation error:", err);
      toast({
        title: "Error creating loan",
        description: err.details || err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Borrower Selection - Typeahead Search */}
          <div className="space-y-2">
            <Label>
              Borrower <span className="text-red-500">*</span>
            </Label>
            <div ref={borrowerRef} className="relative">
              {selectedBorrower && !borrowerDropdownOpen ? (
                <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <span>
                    {selectedBorrower.full_name}
                    {selectedBorrower.company_name
                      ? ` (${selectedBorrower.company_name})`
                      : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      updateField("borrower_id", "");
                      setBorrowerSearch("");
                      setBorrowerDropdownOpen(true);
                    }}
                    className="ml-2 rounded-sm opacity-50 hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    value={borrowerSearch}
                    onChange={(e) => {
                      setBorrowerSearch(e.target.value);
                      setBorrowerDropdownOpen(true);
                    }}
                    onFocus={() => setBorrowerDropdownOpen(true)}
                    placeholder="Search by name, email, or company..."
                    className="pl-9"
                  />
                </div>
              )}
              {borrowerDropdownOpen &&
                dropdownPosition &&
                createPortal(
                  <div
                    ref={dropdownMenuRef}
                    className="rounded-md border bg-popover shadow-md"
                    style={{
                      position: "fixed",
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                      zIndex: 9999,
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {filteredBorrowers.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No borrowers found
                        </div>
                      ) : (
                        filteredBorrowers.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              updateField("borrower_id", b.id);
                              setBorrowerSearch("");
                              setBorrowerDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            {form.borrower_id === b.id && (
                              <Check className="h-4 w-4 shrink-0" />
                            )}
                            <div className={form.borrower_id === b.id ? "" : "pl-6"}>
                              <div className="font-medium">{b.full_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {b.email}
                                {b.company_name ? ` · ${b.company_name}` : ""}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="border-t p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setBorrowerDropdownOpen(false);
                          window.open("/admin/borrowers/new", "_blank");
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4 shrink-0" />
                        <span>Add Borrower</span>
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>

          {/* Loan Type & Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>
                Loan Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => updateField("type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
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
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => updateField("priority", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expected Close Date</Label>
              <Input
                type="date"
                value={form.expected_close_date}
                onChange={(e) => updateField("expected_close_date", e.target.value)}
              />
            </div>
          </div>

          {/* Property Information */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Property Information
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Property Address</Label>
                <Input
                  value={form.property_address}
                  onChange={(e) => updateField("property_address", e.target.value)}
                  placeholder="123 Main Street"
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
                  <Select
                    value={form.property_state}
                    onValueChange={(v) => updateField("property_state", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State..." />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={form.property_zip}
                    onChange={(e) => updateField("property_zip", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Financial Terms
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  Loan Purpose <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.purpose}
                  onValueChange={(v) => updateField("purpose", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_PURPOSES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Loan Amount ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.loan_amount}
                  onChange={(e) => updateField("loan_amount", e.target.value)}
                  placeholder="500000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.purchase_price}
                  onChange={(e) => updateField("purchase_price", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Appraised Value ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.appraised_value}
                  onChange={(e) => updateField("appraised_value", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ARV ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.arv}
                  onChange={(e) => updateField("arv", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.interest_rate}
                  onChange={(e) => updateField("interest_rate", e.target.value)}
                  placeholder="11.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Term (months)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.term_months}
                  onChange={(e) => updateField("term_months", e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label>Points (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.points}
                  onChange={(e) => updateField("points", e.target.value)}
                  placeholder="2.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Origination Fee ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.origination_fee}
                  onChange={(e) => updateField("origination_fee", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Team Assignment
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Originator</Label>
                <Select
                  value={form.originator_id}
                  onValueChange={(v) => updateField("originator_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select originator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Processor</Label>
                <Select
                  value={form.processor_id}
                  onValueChange={(v) => updateField("processor_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select processor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Internal notes about this loan..."
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
            <Button type="submit" disabled={loading || !form.borrower_id || !form.loan_amount || !form.type || !form.purpose}>
              {loading ? "Creating..." : "Create Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
