"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/components/ui/use-toast";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Plus, Loader2 } from "lucide-react";

interface DocumentUploadFormProps {
  profiles: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
  }>;
  funds: Array<{ id: string; name: string }>;
  loans: Array<{
    id: string;
    property_address: string | null;
    borrower_id: string | null;
  }>;
}

export function DocumentUploadForm({
  profiles,
  funds,
  loans,
}: DocumentUploadFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fundId, setFundId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerId || !documentType || !file) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Upload file to storage
      const filePath = `admin/${ownerId}/${documentType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert document record
      const { error: dbError } = await supabase.from("documents").insert({
        owner_id: ownerId,
        uploaded_by: ownerId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        description: displayName || null,
        fund_id: fundId || null,
        loan_id: loanId || null,
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
    setOwnerId("");
    setDocumentType("");
    setDisplayName("");
    setFundId("");
    setLoanId("");
    setFile(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Owner *</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.email} ({p.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Document Type *</Label>
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
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. 2024 K-1 - Bridge Fund I"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Loan (optional)</Label>
              <Select value={loanId} onValueChange={setLoanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan" />
                </SelectTrigger>
                <SelectContent>
                  {loans.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.property_address || l.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>File *</Label>
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
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
