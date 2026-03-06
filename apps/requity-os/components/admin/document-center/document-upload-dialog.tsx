"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
  DialogDescription,
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
import {
  PORTAL_DOCUMENT_TYPES,
  PORTAL_DOCUMENT_CATEGORIES,
  DOCUMENT_VISIBILITY_OPTIONS,
} from "@/lib/constants";
import { createPortalDocumentAction } from "@/app/(authenticated)/admin/document-center/actions";
import { Plus, Loader2 } from "lucide-react";

interface EntityOption {
  id: string;
  label: string;
}

interface DocumentUploadDialogProps {
  loans: EntityOption[];
  funds: EntityOption[];
  borrowers: EntityOption[];
  investors: EntityOption[];
  companies: EntityOption[];
  contacts: EntityOption[];
}

export function DocumentUploadDialog({
  loans,
  funds,
  borrowers,
  investors,
  companies,
  contacts,
}: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [category, setCategory] = useState("general");
  const [visibility, setVisibility] = useState("admin_only");
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [loanId, setLoanId] = useState("");
  const [fundId, setFundId] = useState("");
  const [borrowerId, setBorrowerId] = useState("");
  const [investorId, setInvestorId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setDocumentType("");
    setCategory("general");
    setVisibility("admin_only");
    setDisplayName("");
    setNotes("");
    setLoanId("");
    setFundId("");
    setBorrowerId("");
    setInvestorId("");
    setCompanyId("");
    setContactId("");
    setFile(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!documentType || !file) {
      toast({
        title: "Missing fields",
        description: "Please select a document type and file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Build storage path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${category}/${documentType}/${timestamp}_${safeName}`;

      // Upload file to portal-documents bucket
      const { error: uploadError } = await supabase.storage
        .from("portal-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record via server action
      const result = await createPortalDocumentAction({
        file_name: file.name,
        display_name: displayName || null,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || null,
        document_type: documentType,
        category,
        visibility,
        notes: notes || null,
        loan_id: loanId || null,
        fund_id: fundId || null,
        borrower_id: borrowerId || null,
        investor_id: investorId || null,
        company_id: companyId || null,
        crm_contact_id: contactId || null,
      });

      if ("error" in result && result.error) {
        throw new Error(result.error);
      }

      toast({ title: "Document uploaded successfully" });
      setOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({
        title: "Error uploading document",
        description: message,
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
          <DialogDescription>
            Upload a file and categorize it for easy retrieval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Type + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PORTAL_DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PORTAL_DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. 2024 K-1 - Bridge Fund I"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_VISIBILITY_OPTIONS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Links - Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            {loans.length > 0 && (
              <div className="space-y-2">
                <Label>Loan</Label>
                <Select value={loanId} onValueChange={setLoanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {loans.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {funds.length > 0 && (
              <div className="space-y-2">
                <Label>Fund</Label>
                <Select value={fundId} onValueChange={setFundId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {funds.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Entity Links - Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            {borrowers.length > 0 && (
              <div className="space-y-2">
                <Label>Borrower</Label>
                <Select value={borrowerId} onValueChange={setBorrowerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {borrowers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {investors.length > 0 && (
              <div className="space-y-2">
                <Label>Investor</Label>
                <Select value={investorId} onValueChange={setInvestorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {investors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Entity Links - Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            {companies.length > 0 && (
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {contacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this document..."
              rows={2}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File *</Label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp"
              maxSize={25}
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
            <Button type="submit" disabled={loading || !file || !documentType}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
