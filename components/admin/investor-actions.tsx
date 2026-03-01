"use client";

import { useState } from "react";
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
import { FileUpload } from "@/components/shared/file-upload";
import { DOCUMENT_TYPES, DISTRIBUTION_TYPES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDownCircle, DollarSign, Upload } from "lucide-react";

interface Fund {
  id: string;
  name: string;
}

interface CommitmentRef {
  id: string;
  fund_id: string;
  fundName: string;
}

interface InvestorActionsProps {
  investorId: string;
  funds: Fund[];
  commitments: CommitmentRef[];
}

export function InvestorActions({
  investorId,
  funds,
  commitments,
}: InvestorActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <RecordCapitalCallDialog
        investorId={investorId}
        commitments={commitments}
      />
      <RecordDistributionDialog
        investorId={investorId}
        commitments={commitments}
      />
      <UploadDocumentDialog investorId={investorId} funds={funds} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Record Capital Call Dialog
// ---------------------------------------------------------------------------

function RecordCapitalCallDialog({
  investorId,
  commitments,
}: {
  investorId: string;
  commitments: CommitmentRef[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commitmentId, setCommitmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const selectedCommitment = commitments.find((c) => c.id === commitmentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commitmentId || !amount || !dueDate) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const commitment = commitments.find((c) => c.id === commitmentId);
      if (!commitment) throw new Error("Commitment not found");

      const { error } = await supabase.from("capital_calls").insert({
        fund_id: commitment.fund_id,
        investor_id: investorId,
        commitment_id: commitmentId,
        call_amount: parseFloat(amount),
        total_amount: parseFloat(amount),
        call_number: 1,
        due_date: dueDate,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Contribution recorded successfully" });
      setOpen(false);
      resetCapitalCallForm();
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error recording contribution",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetCapitalCallForm() {
    setCommitmentId("");
    setAmount("");
    setDueDate("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowDownCircle className="h-4 w-4" />
          Record Contribution
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Contribution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Investment / Commitment</Label>
            <Select value={commitmentId} onValueChange={setCommitmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a commitment" />
              </SelectTrigger>
              <SelectContent>
                {commitments.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fundName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
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
              {loading ? "Saving..." : "Record Contribution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Record Distribution Dialog
// ---------------------------------------------------------------------------

function RecordDistributionDialog({
  investorId,
  commitments,
}: {
  investorId: string;
  commitments: CommitmentRef[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commitmentId, setCommitmentId] = useState("");
  const [distributionType, setDistributionType] = useState("");
  const [amount, setAmount] = useState("");
  const [distributionDate, setDistributionDate] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commitmentId || !distributionType || !amount || !distributionDate)
      return;

    setLoading(true);
    try {
      const supabase = createClient();
      const commitment = commitments.find((c) => c.id === commitmentId);
      if (!commitment) throw new Error("Commitment not found");

      const { error } = await supabase.from("distributions").insert({
        fund_id: commitment.fund_id,
        investor_id: investorId,
        commitment_id: commitmentId,
        distribution_type: distributionType,
        amount: parseFloat(amount),
        total_amount: parseFloat(amount),
        distribution_number: 1,
        distribution_date: distributionDate,
        description: description || null,
        status: "pending",
      });

      if (error) throw error;

      toast({ title: "Distribution recorded successfully" });
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error recording distribution",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCommitmentId("");
    setDistributionType("");
    setAmount("");
    setDistributionDate("");
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Record Distribution
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Distribution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Investment / Commitment</Label>
            <Select value={commitmentId} onValueChange={setCommitmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a commitment" />
              </SelectTrigger>
              <SelectContent>
                {commitments.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fundName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Distribution Type</Label>
            <Select
              value={distributionType}
              onValueChange={setDistributionType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DISTRIBUTION_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Distribution Date</Label>
            <Input
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {loading ? "Saving..." : "Record Distribution"}
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
  investorId,
  funds,
}: {
  investorId: string;
  funds: Fund[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [fundId, setFundId] = useState("");
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

      // Upload file to storage
      const filePath = `investors/${investorId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("investor-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert({
        owner_id: investorId,
        uploaded_by: investorId,
        fund_id: fundId || null,
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
      resetForm();
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

  function resetForm() {
    setDocumentType("");
    setFundId("");
    setDisplayName("");
    setFile(null);
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
            <Label>Investment (optional)</Label>
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger>
                <SelectValue placeholder="Select investment" />
              </SelectTrigger>
              <SelectContent>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
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
              placeholder="e.g. 2024 K-1 Statement"
            />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <FileUpload onFileSelect={setFile} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
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
