"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus } from "lucide-react";
import { createLenderQuote } from "@/app/(authenticated)/admin/loans/[id]/quote-actions";

interface Company {
  id: string;
  name: string;
}

interface CreateQuoteDialogProps {
  loanId: string;
  companies: Company[];
  trigger?: React.ReactNode;
}

export function CreateQuoteDialog({
  loanId,
  companies,
  trigger,
}: CreateQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [quoteName, setQuoteName] = useState("");
  const [lenderCompanyId, setLenderCompanyId] = useState("");
  const [lenderContactName, setLenderContactName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTermMonths, setLoanTermMonths] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setQuoteName("");
    setLenderCompanyId("");
    setLenderContactName("");
    setLoanAmount("");
    setInterestRate("");
    setLoanTermMonths("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quoteName.trim()) return;

    setLoading(true);
    try {
      const result = await createLenderQuote({
        quote_name: quoteName.trim(),
        loan_id: loanId,
        lender_company_id: lenderCompanyId || null,
        lender_contact_name: lenderContactName.trim() || null,
        loan_amount: loanAmount ? parseFloat(loanAmount) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        loan_term_months: loanTermMonths ? parseInt(loanTermMonths) : null,
        description: description.trim() || null,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Quote created successfully" });
      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Add Quote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Lender Quote</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quoteName">Quote Name *</Label>
            <Input
              id="quoteName"
              placeholder='e.g. "FiveStar Bank Quote"'
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Lender Company</Label>
            <Select value={lenderCompanyId} onValueChange={setLenderCompanyId}>
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
            <Label htmlFor="lenderContact">Lender Contact Name</Label>
            <Input
              id="lenderContact"
              placeholder="Contact at lender"
              value={lenderContactName}
              onChange={(e) => setLenderContactName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount</Label>
              <Input
                id="loanAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="$0.00"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                min="0"
                step="0.0001"
                placeholder="0.0000"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanTermMonths">Term (mo)</Label>
              <Input
                id="loanTermMonths"
                type="number"
                min="0"
                placeholder="12"
                value={loanTermMonths}
                onChange={(e) => setLoanTermMonths(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this quote..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !quoteName.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
