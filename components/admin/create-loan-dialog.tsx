"use client";

import { useState, useEffect } from "react";
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
import { LOAN_TYPES, LOAN_PRIORITIES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle } from "lucide-react";

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
}: CreateLoanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    borrower_id: "",
    loan_type: "",
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

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      borrower_id: "",
      loan_type: "",
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.borrower_id || !form.loan_amount) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // 1. Create the loan
      const { data: newLoan, error: loanError } = await supabase
        .from("loans")
        .insert({
          borrower_id: form.borrower_id,
          loan_type: form.loan_type || null,
          property_address: form.property_address || null,
          property_city: form.property_city || null,
          property_state: form.property_state || null,
          property_zip: form.property_zip || null,
          loan_amount: parseFloat(form.loan_amount),
          purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
          appraised_value: form.appraised_value ? parseFloat(form.appraised_value) : null,
          arv: form.arv ? parseFloat(form.arv) : null,
          interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
          points: form.points ? parseFloat(form.points) : null,
          origination_fee: form.origination_fee ? parseFloat(form.origination_fee) : null,
          term_months: form.term_months ? parseInt(form.term_months) : null,
          originator_id: form.originator_id || null,
          originator: teamMembers.find((t) => t.id === form.originator_id)?.full_name || null,
          processor_id: form.processor_id || null,
          priority: form.priority,
          expected_close_date: form.expected_close_date || null,
          notes: form.notes || null,
          stage: "lead",
          stage_updated_at: now,
          application_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (loanError) throw loanError;

      // 2. Log the loan creation in activity log
      await supabase.from("loan_activity_log").insert({
        loan_id: newLoan.id,
        user_id: currentUserId,
        activity_type: "loan_created",
        description: `Loan created for ${form.property_address || "new property"}`,
      });

      // 3. Auto-populate conditions from template based on loan type
      if (form.loan_type) {
        await populateConditionsFromTemplate(supabase, newLoan.id, form.loan_type);
      }

      toast({ title: "Loan created successfully" });
      setOpen(false);
      resetForm();
      router.push(`/admin/loans/${newLoan.id}`);
    } catch (err: any) {
      toast({
        title: "Error creating loan",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function populateConditionsFromTemplate(
    supabase: any,
    loanId: string,
    loanType: string
  ) {
    // Find the default template for this loan type
    const { data: template } = await supabase
      .from("condition_templates")
      .select("id")
      .eq("loan_type", loanType)
      .eq("is_default", true)
      .single();

    if (!template) return;

    // Get all template items
    const { data: items } = await supabase
      .from("condition_template_items")
      .select("*")
      .eq("template_id", template.id)
      .order("sort_order");

    if (!items || items.length === 0) return;

    // Create loan conditions from template items
    const today = new Date();
    const conditions = items.map((item: any) => {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + (item.due_date_offset_days || 5));

      return {
        loan_id: loanId,
        template_item_id: item.id,
        name: item.name,
        description: item.description,
        borrower_description: item.borrower_description,
        category: item.category,
        responsible_party: item.responsible_party,
        is_critical_path: item.is_critical_path,
        sort_order: item.sort_order,
        status: "not_requested",
        due_date: dueDate.toISOString().split("T")[0],
      };
    });

    await supabase.from("loan_conditions").insert(conditions);
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
          {/* Borrower Selection */}
          <div className="space-y-2">
            <Label>
              Borrower <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.borrower_id}
              onValueChange={(v) => updateField("borrower_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select borrower..." />
              </SelectTrigger>
              <SelectContent>
                {borrowers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.full_name}
                    {b.company_name ? ` (${b.company_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loan Type & Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select
                value={form.loan_type}
                onValueChange={(v) => updateField("loan_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
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
            <h4 className="text-sm font-semibold text-[#1a2b4a] mb-3">
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
            <h4 className="text-sm font-semibold text-[#1a2b4a] mb-3">
              Financial Terms
            </h4>
            <div className="grid grid-cols-3 gap-4">
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
            <h4 className="text-sm font-semibold text-[#1a2b4a] mb-3">
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
            <Button type="submit" disabled={loading || !form.borrower_id || !form.loan_amount}>
              {loading ? "Creating..." : "Create Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
