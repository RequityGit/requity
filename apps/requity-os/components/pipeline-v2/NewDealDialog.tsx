"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { CardTypeSelector } from "./CardTypeSelector";
import {
  ExtractedFieldsReview,
  type ExtractedField,
} from "./ExtractedFieldsReview";
import {
  createUnifiedDealAction,
  createTempExtractionUploadUrl,
  cleanupTempExtraction,
  addDealNoteAction,
} from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  ASSET_CLASS_LABELS,
  type AssetClass,
} from "./pipeline-types";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardTypes: UnifiedCardType[];
  teamMembers: { id: string; full_name: string }[];
}

export function NewDealDialog({
  open,
  onOpenChange,
  cardTypes,
  teamMembers,
}: NewDealDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [cardTypeId, setCardTypeId] = useState<string | null>(null);
  const [assetClass, setAssetClass] = useState<string>("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [pending, startTransition] = useTransition();

  // Document extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractedDealFields, setExtractedDealFields] = useState<
    Record<string, ExtractedField>
  >({});
  const [extractedUwFields, setExtractedUwFields] = useState<
    Record<string, ExtractedField>
  >({});
  const [extractionSummary, setExtractionSummary] = useState("");

  const selectedCardType = cardTypes.find((ct) => ct.id === cardTypeId);
  const applicableAssets =
    selectedCardType?.applicable_asset_classes ??
    Object.keys(ASSET_CLASS_LABELS);

  function reset() {
    setStep(1);
    setCardTypeId(null);
    setAssetClass("");
    setName("");
    setAmount("");
    setExpectedClose("");
    setAssignedTo("");
    setExtracting(false);
    setExtractedDealFields({});
    setExtractedUwFields({});
    setExtractionSummary("");
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  function handleSubmit(uwData?: Record<string, unknown>) {
    if (!cardTypeId || !name.trim()) return;

    startTransition(async () => {
      const result = await createUnifiedDealAction({
        name: name.trim(),
        card_type_id: cardTypeId,
        asset_class: assetClass || undefined,
        amount: amount ? Number(amount) : undefined,
        expected_close_date: expectedClose || undefined,
        assigned_to: assignedTo || undefined,
        uw_data: uwData,
      });

      if (result.error) {
        toast.error(`Failed to create deal: ${result.error}`);
      } else {
        const deal = result.deal as
          | { id: string; deal_number: string }
          | undefined;
        toast.success(`Deal ${deal?.deal_number ?? ""} created`);
        handleClose(false);
      }
    });
  }

  async function handleFileSelect(file: File) {
    if (!cardTypeId) return;

    setExtracting(true);
    let uploadedPath: string | null = null;

    try {
      // 1. Get signed upload URL for temp storage
      const urlResult = await createTempExtractionUploadUrl(file.name);
      if (urlResult.error || !urlResult.signedUrl || !urlResult.storagePath) {
        throw new Error(urlResult.error ?? "Could not create upload URL");
      }
      uploadedPath = urlResult.storagePath;

      // 2. Upload file directly to Supabase storage (bypasses serverless body limit)
      const uploadRes = await fetch(urlResult.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => "Unknown error");
        throw new Error(`Upload failed: ${errorText}`);
      }

      // 3. Call extraction API with storage path (tiny JSON body)
      const response = await fetch("/api/deals/extract-from-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_path: urlResult.storagePath,
          card_type_id: cardTypeId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to extract document");
      }

      const data = await response.json();
      const dealFields = (data.deal_fields ?? {}) as Record<
        string,
        ExtractedField
      >;
      const uwFields = (data.extracted_fields ?? {}) as Record<
        string,
        ExtractedField
      >;

      setExtractedDealFields(dealFields);
      setExtractedUwFields(uwFields);
      setExtractionSummary(data.summary ?? "");

      // Pre-fill form fields from high-confidence deal extractions
      if (dealFields.name?.confidence >= 0.7 && !name) {
        setName(String(dealFields.name.value));
      }
      if (dealFields.amount?.confidence >= 0.7 && !amount) {
        setAmount(String(dealFields.amount.value));
      }
      if (dealFields.expected_close_date?.confidence >= 0.7 && !expectedClose) {
        setExpectedClose(String(dealFields.expected_close_date.value));
      }
      if (dealFields.asset_class?.confidence >= 0.7 && !assetClass) {
        setAssetClass(String(dealFields.asset_class.value));
      }

      // Temp file cleaned up server-side after extraction
      uploadedPath = null;

      // Move to verification step
      setStep(4);
    } catch (err) {
      console.error("Document extraction failed:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to extract data from document"
      );
      // Clean up temp file on failure
      if (uploadedPath) {
        cleanupTempExtraction(uploadedPath).catch(() => {});
      }
    } finally {
      setExtracting(false);
    }
  }

  function handleAcceptExtraction(accepted: {
    dealFields: Record<string, unknown>;
    uwFields: Record<string, unknown>;
    summaryNote?: string;
  }) {
    // Merge accepted deal fields into form state
    if (accepted.dealFields.name) setName(String(accepted.dealFields.name));
    if (accepted.dealFields.amount)
      setAmount(String(accepted.dealFields.amount));
    if (accepted.dealFields.expected_close_date)
      setExpectedClose(String(accepted.dealFields.expected_close_date));
    if (accepted.dealFields.asset_class)
      setAssetClass(String(accepted.dealFields.asset_class));

    // Submit with UW data
    const finalName = accepted.dealFields.name
      ? String(accepted.dealFields.name)
      : name;
    if (!cardTypeId || !finalName.trim()) {
      toast.error("Deal name is required");
      return;
    }

    startTransition(async () => {
      const result = await createUnifiedDealAction({
        name: finalName.trim(),
        card_type_id: cardTypeId,
        asset_class:
          (accepted.dealFields.asset_class as string) || assetClass || undefined,
        amount: accepted.dealFields.amount
          ? Number(accepted.dealFields.amount)
          : amount
            ? Number(amount)
            : undefined,
        expected_close_date:
          (accepted.dealFields.expected_close_date as string) ||
          expectedClose ||
          undefined,
        assigned_to: assignedTo || undefined,
        uw_data:
          Object.keys(accepted.uwFields).length > 0
            ? accepted.uwFields
            : undefined,
      });

      if (result.error) {
        toast.error(`Failed to create deal: ${result.error}`);
      } else {
        const deal = result.deal as
          | { id: string; deal_number: string }
          | undefined;
        // Save summary as deal note if requested
        if (accepted.summaryNote && deal?.id) {
          await addDealNoteAction(deal.id, accepted.summaryNote).catch(
            (err) => console.error("Failed to save deal note:", err)
          );
        }
        toast.success(`Deal ${deal?.deal_number ?? ""} created`);
        handleClose(false);
      }
    });
  }

  const stepTitle =
    step === 1
      ? "Select Deal Type"
      : step === 2
        ? "Select Asset Class"
        : step === 3
          ? "Deal Details"
          : "Review Extracted Fields";

  const stepDescription =
    step === 1
      ? "Choose the type of deal you want to create."
      : step === 2
        ? "Select the asset class for this deal."
        : step === 3
          ? "Enter deal details or upload a document to auto-fill."
          : "Review and confirm the fields extracted from your document.";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitle}</DialogTitle>
          <DialogDescription>{stepDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Deal Type */}
          {step === 1 && (
            <>
              <CardTypeSelector
                cardTypes={cardTypes}
                selected={cardTypeId}
                onSelect={(id) => setCardTypeId(id)}
                onDoubleClick={(id) => {
                  setCardTypeId(id);
                  setStep(2);
                }}
              />
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!cardTypeId}>
                  Next
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Select Asset Class */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {applicableAssets.map((ac) => (
                  <button
                    key={ac}
                    type="button"
                    onClick={() => setAssetClass(ac)}
                    onDoubleClick={() => {
                      setAssetClass(ac);
                      setStep(3);
                    }}
                    className={`rounded-lg border p-3 text-left text-sm transition-all hover:border-foreground/20 ${
                      assetClass === ac
                        ? "border-foreground ring-1 ring-foreground"
                        : ""
                    }`}
                  >
                    {ASSET_CLASS_LABELS[ac as AssetClass] ?? ac}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!assetClass}>
                  Next
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Deal Details + Upload */}
          {step === 3 && (
            <>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Deal Name *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 123 Main St SFR Rental"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7 num"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Expected Close Date</Label>
                  <DatePicker
                    value={expectedClose}
                    onChange={(value) => setExpectedClose(value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member..." />
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

              {/* Document Upload Section */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or auto-fill from a document
                    </span>
                  </div>
                </div>

                {extracting ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-6">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Extracting deal details from document...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Upload className="h-3 w-3" />
                      <span>
                        Upload an investor memo, term sheet, or email PDF to
                        auto-fill fields
                      </span>
                    </div>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!name.trim() || pending}
                >
                  {pending ? "Creating deal..." : "Create Deal"}
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Review Extracted Fields */}
          {step === 4 && selectedCardType && (
            <ExtractedFieldsReview
              dealFields={extractedDealFields}
              uwFields={extractedUwFields}
              uwFieldDefs={selectedCardType.uw_fields}
              summary={extractionSummary}
              onAccept={handleAcceptExtraction}
              onBack={() => setStep(3)}
              pending={pending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
