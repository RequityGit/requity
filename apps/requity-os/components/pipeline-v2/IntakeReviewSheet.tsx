"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Paperclip,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  Plus,
  Link2,
} from "lucide-react";
import type { IntakeQueueItem, CardType } from "@/app/(authenticated)/admin/pipeline/intake/page";
import { resolveIntakeItemAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import { formatDistanceToNow } from "date-fns";

interface IntakeReviewSheetProps {
  item: IntakeQueueItem | null;
  cardTypes: CardType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600">
        High
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
        Medium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-600">
      Low
    </Badge>
  );
}

function getFileIcon(filename: string) {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (["png", "jpg", "jpeg"].includes(ext || ""))
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

const DEAL_FIELD_LABELS: Record<string, string> = {
  name: "Deal Name",
  amount: "Amount",
  expected_close_date: "Expected Close",
  asset_class: "Asset Class",
  borrower_name: "Borrower Name",
  borrower_email: "Borrower Email",
  property_address: "Property Address",
  deal_type_indicators: "Deal Type",
};

const ASSET_CLASS_OPTIONS = [
  { value: "sfr", label: "SFR" },
  { value: "duplex_fourplex", label: "Duplex/Fourplex" },
  { value: "multifamily", label: "Multifamily" },
  { value: "mhc", label: "MHC" },
  { value: "rv_park", label: "RV Park" },
  { value: "campground", label: "Campground" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "land", label: "Land" },
];

export function IntakeReviewSheet({ item, cardTypes, open, onOpenChange }: IntakeReviewSheetProps) {
  const [pending, startTransition] = useTransition();
  const [dismissNote, setDismissNote] = useState("");
  const [showDismiss, setShowDismiss] = useState(false);

  // Editable deal fields
  const [editedDealFields, setEditedDealFields] = useState<Record<string, string>>({});
  const [selectedCardTypeId, setSelectedCardTypeId] = useState<string>("");

  // Initialize editable fields when item changes
  const dealFields = useMemo(() => {
    if (!item?.extracted_deal_fields) return {};
    const fields: Record<string, string> = {};
    for (const [key, field] of Object.entries(item.extracted_deal_fields)) {
      fields[key] = String(field.value);
    }
    return fields;
  }, [item?.extracted_deal_fields]);

  const uwFields = useMemo(() => {
    if (!item?.extracted_uw_fields) return {};
    const fields: Record<string, string> = {};
    for (const [key, field] of Object.entries(item.extracted_uw_fields)) {
      fields[key] = String(field.value);
    }
    return fields;
  }, [item?.extracted_uw_fields]);

  // Merge edited fields with extracted defaults
  const getCurrentDealFields = () => {
    return { ...dealFields, ...editedDealFields };
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedDealFields((prev) => ({ ...prev, [key]: value }));
  };

  const effectiveCardTypeId = selectedCardTypeId || item?.suggested_card_type_id || "";

  const handleCreateDeal = () => {
    if (!item || !effectiveCardTypeId) return;

    const fields = getCurrentDealFields();

    startTransition(async () => {
      const result = await resolveIntakeItemAction({
        intakeQueueId: item.id,
        action: "create_deal",
        cardTypeId: effectiveCardTypeId,
        dealFields: {
          name: fields.name || fields.property_address || item.subject || "Untitled Deal",
          amount: fields.amount ? parseFloat(fields.amount) : undefined,
          asset_class: fields.asset_class || undefined,
          expected_close_date: fields.expected_close_date || undefined,
        },
        uwFields: uwFields,
      });

      if (result?.error) {
        console.error("Failed to create deal:", result.error);
      } else {
        onOpenChange(false);
        window.location.reload();
      }
    });
  };

  const handleDismiss = () => {
    if (!item) return;

    startTransition(async () => {
      const result = await resolveIntakeItemAction({
        intakeQueueId: item.id,
        action: "dismiss",
        notes: dismissNote || undefined,
      });

      if (result?.error) {
        console.error("Failed to dismiss:", result.error);
      } else {
        setShowDismiss(false);
        setDismissNote("");
        onOpenChange(false);
        window.location.reload();
      }
    });
  };

  if (!item) return null;

  const isResolved = ["deal_created", "attached", "dismissed"].includes(item.status);
  const isReady = item.status === "ready";
  const allDealFields = getCurrentDealFields();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b space-y-2">
          <SheetHeader>
            <SheetTitle className="text-base truncate">
              {item.subject || "(no subject)"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>
              {item.from_name ? `${item.from_name} <${item.from_email}>` : item.from_email}
            </span>
            <span className="text-muted-foreground/40">-</span>
            <span>{formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Email body preview */}
            {item.body_preview && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Preview
                </Label>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap rounded-lg border p-3 max-h-32 overflow-y-auto">
                  {item.body_preview}
                </p>
              </div>
            )}

            {/* Attachments */}
            {item.attachments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Attachments ({item.attachments.length})
                </Label>
                <div className="space-y-1">
                  {item.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      {getFileIcon(att.filename)}
                      <span className="text-xs flex-1 truncate">{att.filename}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(att.size_bytes)}
                      </span>
                      {att.storage_path && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                          <a
                            href={`/api/storage/download?path=${encodeURIComponent(att.storage_path)}&bucket=loan-documents`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px]"
                      >
                        {att.extraction_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Extraction Summary */}
            {item.extraction_summary && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{item.extraction_summary}</p>
              </div>
            )}

            {/* Extracted Deal Fields */}
            {isReady && Object.keys(dealFields).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Deal Details
                </Label>
                <div className="space-y-3 rounded-lg border p-3">
                  {Object.entries(item.extracted_deal_fields || {}).map(([key, field]) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-28 flex-shrink-0">
                        <span className="text-xs font-medium">
                          {DEAL_FIELD_LABELS[key] || key}
                        </span>
                      </div>
                      <div className="flex-1">
                        {key === "asset_class" ? (
                          <Select
                            value={allDealFields[key] || ""}
                            onValueChange={(v) => handleFieldChange(key, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSET_CLASS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : key === "amount" ? (
                          <Input
                            className="h-8 text-xs num"
                            type="number"
                            value={allDealFields[key] || ""}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                          />
                        ) : (
                          <Input
                            className="h-8 text-xs"
                            value={allDealFields[key] || ""}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                          />
                        )}
                      </div>
                      <ConfidenceBadge confidence={field.confidence} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted UW Fields */}
            {isReady && Object.keys(uwFields).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Underwriting Fields
                </Label>
                <div className="space-y-3 rounded-lg border p-3">
                  {Object.entries(item.extracted_uw_fields || {}).map(([key, field]) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-28 flex-shrink-0">
                        <span className="text-xs font-medium capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <Input
                          className="h-8 text-xs"
                          value={String(field.value)}
                          readOnly
                        />
                      </div>
                      <ConfidenceBadge confidence={field.confidence} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card Type Selector */}
            {isReady && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Deal Type
                </Label>
                <Select
                  value={effectiveCardTypeId}
                  onValueChange={setSelectedCardTypeId}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select deal type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.label}
                        <span className="text-muted-foreground ml-1">({ct.capital_side})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dismiss form */}
            {showDismiss && (
              <div className="space-y-2 rounded-lg border p-3">
                <Label className="text-xs">Dismiss reason (optional)</Label>
                <Textarea
                  className="text-xs min-h-[60px]"
                  placeholder="Why is this being dismissed?"
                  value={dismissNote}
                  onChange={(e) => setDismissNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={handleDismiss}
                    disabled={pending}
                  >
                    Confirm Dismiss
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowDismiss(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Resolution info */}
            {isResolved && (
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-xs font-medium">
                  Resolved: {item.status.replace("_", " ")}
                </p>
                {item.resolved_at && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.resolved_at), { addSuffix: true })}
                  </p>
                )}
                {item.resolution_notes && (
                  <p className="text-xs text-muted-foreground">{item.resolution_notes}</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom action bar */}
        {!isResolved && isReady && (
          <div className="p-4 border-t flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowDismiss(true)}
              disabled={pending || showDismiss}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Dismiss
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={pending}
                title="Coming soon"
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
                Attach to Deal
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={handleCreateDeal}
                disabled={pending || !effectiveCardTypeId}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Deal
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
