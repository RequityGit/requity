"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Loan } from "@/lib/supabase/types";

export function NewDrawForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      fetchActiveLoans();
    }
  }, [open]);

  async function fetchActiveLoans() {
    setLoadingLoans(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("loans")
        .select("*")
        .eq("borrower_id", user.id)
        .eq("stage", "active")
        .order("property_address", { ascending: true });

      setLoans(data ?? []);
    } finally {
      setLoadingLoans(false);
    }
  }

  function resetForm() {
    setSelectedLoanId("");
    setAmount("");
    setDescription("");
    setInvoiceFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedLoanId) {
      setError("Please select a loan.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      // Get the next draw number for this loan
      const { count } = await supabase
        .from("draw_requests")
        .select("*", { count: "exact", head: true })
        .eq("loan_id", selectedLoanId);

      const drawNumber = (count ?? 0) + 1;

      // Insert draw request
      const { data: drawRequest, error: insertError } = await supabase
        .from("draw_requests")
        .insert({
          loan_id: selectedLoanId,
          borrower_id: user.id,
          draw_number: drawNumber,
          amount_requested: parsedAmount,
          description: description || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Upload invoice file if provided
      if (invoiceFile && drawRequest) {
        const fileExt = invoiceFile.name.split(".").pop();
        const filePath = `${user.id}/${selectedLoanId}/draws/${drawRequest.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("loan-documents")
          .upload(filePath, invoiceFile);

        if (!uploadError) {
          // Create a document record
          await supabase.from("documents").insert({
            owner_id: user.id,
            uploaded_by: user.id,
            loan_id: selectedLoanId,
            document_type: "other",
            file_name: invoiceFile.name,
            file_path: filePath,
            file_size: invoiceFile.size,
            mime_type: invoiceFile.type,
            description: `Draw #${drawNumber} invoice`,
            status: "pending",
          });
        }
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Draw Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Draw Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Loan Selection */}
          <div className="space-y-2">
            <Label htmlFor="loan">Loan</Label>
            {loadingLoans ? (
              <div className="flex items-center gap-2 text-sm text-surface-muted py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading loans...
              </div>
            ) : (
              <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a loan" />
                </SelectTrigger>
                <SelectContent>
                  {loans.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.property_address} ({loan.loan_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Requested ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the work or expenses for this draw..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Invoice / Supporting Document</Label>
            <FileUpload
              onFileSelect={(file) => setInvoiceFile(file)}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              maxSize={10}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); resetForm(); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Draw Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
