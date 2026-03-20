"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
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
  User,
  Building2,
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Check,
  AlertTriangle,
  Loader2,
  Forward,
} from "lucide-react";
import type {
  IntakeQueueItem,
  CardType,
} from "@/app/(authenticated)/(admin)/pipeline/intake/page";
import {
  resolveIntakeItemAction,
  previewMergeToDeal,
  mergeToDealAction,
  type MergePreview,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import { formatDistanceToNow } from "date-fns";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface IntakeReviewSheetProps {
  item: IntakeQueueItem | null;
  cardTypes: CardType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "" || val === "null") return "";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return String(val);
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPercent(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "" || val === "null") return "";
  return `${val}%`;
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

/** Fields that show in the top summary card, not in the editable list */
const SUMMARY_FIELDS = new Set([
  "loan_amount",
  "purchase_price",
  "property_address",
  "property_city",
  "property_state",
  "property_type",
  "broker_name",
  "broker_email",
  "broker_phone",
  "broker_company",
  "borrower_name",
  "borrower_email",
  "borrower_phone",
  "borrower_entity_name",
]);

/** Fields hidden from display (internal metadata) */
const HIDDEN_FIELDS = new Set([
  "_is_forwarded",
  "_original_sender_name",
  "_original_sender_email",
]);

/** Human-readable labels for extracted fields */
const FIELD_LABELS: Record<string, string> = {
  name: "Deal Name",
  amount: "Amount",
  loan_amount: "Loan Amount",
  purchase_price: "Purchase Price",
  asset_class: "Asset Class",
  property_address: "Property Address",
  property_city: "City",
  property_state: "State",
  property_type: "Property Type",
  property_count: "Property Count",
  borrower_name: "Borrower Name",
  borrower_email: "Borrower Email",
  borrower_phone: "Borrower Phone",
  borrower_entity_name: "Borrower Entity",
  broker_name: "Broker Name",
  broker_email: "Broker Email",
  broker_phone: "Broker Phone",
  broker_company: "Broker Company",
  broker_license: "Broker License",
  deal_type_indicators: "Deal Type",
  loan_type: "Loan Type",
  ltv: "LTV",
  dscr: "DSCR",
  arv: "ARV",
  noi: "NOI",
  cap_rate: "Cap Rate",
  units: "Units",
  sqft: "Sq Ft",
  year_built: "Year Built",
  rehab_budget: "Rehab Budget",
  closing_date: "Closing Date",
  existing_debt: "Existing Debt",
  cash_flow: "Cash Flow",
  coc_return: "CoC Return",
  debt_service: "Debt Service",
  seller_financing: "Seller Financing",
  notes: "Notes",
};

const CURRENCY_FIELDS = new Set([
  "loan_amount",
  "purchase_price",
  "amount",
  "arv",
  "noi",
  "rehab_budget",
  "existing_debt",
  "cash_flow",
  "debt_service",
]);

const PERCENT_FIELDS = new Set(["ltv", "dscr", "cap_rate", "coc_return"]);

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

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export function IntakeReviewSheet({
  item,
  cardTypes,
  open,
  onOpenChange,
}: IntakeReviewSheetProps) {
  const [pending, startTransition] = useTransition();
  const [dismissNote, setDismissNote] = useState("");
  const [showDismiss, setShowDismiss] = useState(false);

  // Attach to deal state
  const [showAttach, setShowAttach] = useState(false);
  const [dealSearch, setDealSearch] = useState("");
  const [dealResults, setDealResults] = useState<
    Array<{
      id: string;
      name: string;
      deal_number: string | null;
      amount: number | null;
      stage: string | null;
    }>
  >([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set());
  const [mergeNote, setMergeNote] = useState("");
  const [searching, setSearching] = useState(false);

  // Editable deal fields and UW fields
  const [editedDealFields, setEditedDealFields] = useState<
    Record<string, string>
  >({});
  const [editedUwFields, setEditedUwFields] = useState<
    Record<string, string>
  >({});
  const [selectedCardTypeId, setSelectedCardTypeId] = useState<string>("");
  const [showRawEmail, setShowRawEmail] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setEditedDealFields({});
      setEditedUwFields({});
      setShowDismiss(false);
      setShowAttach(false);
      setShowRawEmail(false);
      setShowAllFields(false);
      setDealSearch("");
      setDealResults([]);
      setSelectedDealId(null);
      setMergePreview(null);
      setMergeNote("");
      setDismissNote("");
      // Auto-select suggested card type
      if (item.suggested_card_type_id) {
        setSelectedCardTypeId(item.suggested_card_type_id);
      }
    }
  }, [item?.id]);

  // Parse extracted fields
  const extractedFields = useMemo(() => {
    if (!item?.extracted_deal_fields) return {};
    const fields: Record<
      string,
      { value: string | number | boolean; confidence: number; source: string }
    > = {};
    for (const [key, field] of Object.entries(item.extracted_deal_fields)) {
      if (
        !HIDDEN_FIELDS.has(key) &&
        field.value !== null &&
        field.value !== "" &&
        field.confidence > 0
      ) {
        fields[key] = field;
      }
    }
    return fields;
  }, [item?.extracted_deal_fields]);

  // Forwarded sender info
  const forwardedInfo = useMemo(() => {
    if (!item?.extracted_deal_fields) return null;
    const isForwarded = item.extracted_deal_fields._is_forwarded?.value;
    if (!isForwarded) return null;
    return {
      originalName:
        (item.extracted_deal_fields._original_sender_name?.value as string) ||
        null,
      originalEmail:
        (item.extracted_deal_fields._original_sender_email?.value as string) ||
        null,
      forwarderName: item.from_name,
      forwarderEmail: item.from_email,
    };
  }, [item]);

  // Deal fields for creation
  const dealFields = useMemo(() => {
    if (!item?.extracted_deal_fields) return {};
    const fields: Record<string, string> = {};
    for (const [key, field] of Object.entries(item.extracted_deal_fields)) {
      if (!HIDDEN_FIELDS.has(key) && field.value !== null) {
        fields[key] = String(field.value);
      }
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

  const getCurrentDealFields = () => ({ ...dealFields, ...editedDealFields });
  const getCurrentUwFields = () => ({ ...uwFields, ...editedUwFields });

  const handleFieldChange = (key: string, value: string) => {
    setEditedDealFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleUwFieldChange = (key: string, value: string) => {
    setEditedUwFields((prev) => ({ ...prev, [key]: value }));
  };

  const effectiveCardTypeId =
    selectedCardTypeId || item?.suggested_card_type_id || "";

  /* ------ Actions ------ */

  const handleCreateDeal = () => {
    if (!item || !effectiveCardTypeId) return;

    const fields = getCurrentDealFields();

    startTransition(async () => {
      try {
        const result = await resolveIntakeItemAction({
          intakeQueueId: item.id,
          action: "create_deal",
          cardTypeId: effectiveCardTypeId,
          dealFields: {
            name:
              fields.name ||
              fields.property_address ||
              item.subject ||
              "Untitled Deal",
            amount: fields.loan_amount
              ? parseFloat(fields.loan_amount)
              : fields.amount
                ? parseFloat(fields.amount)
                : undefined,
            asset_class: fields.asset_class || undefined,
          },
          uwFields: getCurrentUwFields(),
        });

        if (result?.error) {
          toast.error("Failed to create deal", {
            description: result.error,
          });
        } else {
          toast.success("Deal created successfully", {
            description: fields.name || fields.property_address || item.subject,
          });
          onOpenChange(false);
          window.location.reload();
        }
      } catch (err) {
        toast.error("Failed to create deal", {
          description:
            err instanceof Error ? err.message : "An unexpected error occurred",
        });
      }
    });
  };

  const handleDismiss = () => {
    if (!item) return;

    startTransition(async () => {
      try {
        const result = await resolveIntakeItemAction({
          intakeQueueId: item.id,
          action: "dismiss",
          notes: dismissNote || undefined,
        });

        if (result?.error) {
          toast.error("Failed to dismiss", { description: result.error });
        } else {
          toast.success("Intake item dismissed");
          setShowDismiss(false);
          setDismissNote("");
          onOpenChange(false);
          window.location.reload();
        }
      } catch (err) {
        toast.error("Failed to dismiss", {
          description:
            err instanceof Error ? err.message : "An unexpected error occurred",
        });
      }
    });
  };

  const handleDealSearch = async (query: string) => {
    setDealSearch(query);
    if (query.length < 2) {
      setDealResults([]);
      return;
    }

    setSearching(true);
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from("unified_deals")
        .select("id, name, deal_number, amount, stage")
        .or(`name.ilike.%${query}%,deal_number.ilike.%${query}%`)
        .in("status", ["active", "on_hold"])
        .order("updated_at", { ascending: false })
        .limit(8);
      setDealResults(data || []);
    } catch {
      setDealResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectDeal = async (dealId: string) => {
    if (!item) return;
    setSelectedDealId(dealId);
    try {
      const result = await previewMergeToDeal(item.id, dealId);
      if (result.preview) {
        setMergePreview(result.preview);
        const autoAccept = new Set(
          result.preview.fields
            .filter((f) => f.state === "auto_fill")
            .map((f) => f.key)
        );
        setAcceptedFields(autoAccept);
      }
    } catch (err) {
      toast.error("Failed to preview merge", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleMerge = () => {
    if (!item || !selectedDealId) return;
    startTransition(async () => {
      try {
        const result = await mergeToDealAction({
          intakeQueueId: item.id,
          dealId: selectedDealId,
          acceptedFields: Array.from(acceptedFields),
          notes: mergeNote || undefined,
        });
        if (result?.error) {
          toast.error("Merge failed", { description: result.error });
        } else {
          toast.success("Successfully merged into deal");
          setShowAttach(false);
          setMergePreview(null);
          setSelectedDealId(null);
          onOpenChange(false);
          window.location.reload();
        }
      } catch (err) {
        toast.error("Merge failed", {
          description:
            err instanceof Error ? err.message : "An unexpected error occurred",
        });
      }
    });
  };

  const toggleField = (key: string) => {
    setAcceptedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!item) return null;

  const isResolved = [
    "deal_created",
    "attached",
    "dismissed",
    "merged",
  ].includes(item.status);
  const isReady = ["ready", "pending", "auto_matched"].includes(item.status);

  // Extract key summary values
  const loanAmount = extractedFields.loan_amount?.value;
  const purchasePrice = extractedFields.purchase_price?.value;
  const propertyAddr = extractedFields.property_address?.value;
  const propertyCity = extractedFields.property_city?.value;
  const propertyState = extractedFields.property_state?.value;
  const propertyType = extractedFields.property_type?.value;
  const brokerName = extractedFields.broker_name?.value;
  const brokerEmail = extractedFields.broker_email?.value;
  const brokerPhone = extractedFields.broker_phone?.value;
  const brokerCompany = extractedFields.broker_company?.value;
  const borrowerName = extractedFields.borrower_name?.value;

  // Non-summary, non-note fields for the "All Extracted Fields" section
  const additionalFields = Object.entries(extractedFields).filter(
    ([key]) => !SUMMARY_FIELDS.has(key) && key !== "notes"
  );

  const notesValue = extractedFields.notes?.value;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[720px] p-0 flex flex-col h-full max-h-screen">
        {/* Header */}
        <div className="p-5 pb-4 border-b space-y-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetHeader className="space-y-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/50 text-primary font-semibold"
                  >
                    INTAKE REVIEW
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.received_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <SheetTitle className="text-base font-semibold truncate pr-8">
                  {item.subject || "(no subject)"}
                </SheetTitle>
              </SheetHeader>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {item.from_name
                    ? `${item.from_name} <${item.from_email}>`
                    : item.from_email}
                </span>
              </div>
            </div>
          </div>

          {/* Forwarded sender info */}
          {forwardedInfo && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <Forward className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-xs">
                Forwarded by{" "}
                <span className="font-medium">
                  {forwardedInfo.forwarderName || forwardedInfo.forwarderEmail}
                </span>
                {forwardedInfo.originalName && (
                  <>
                    {" "}
                    &mdash; Original sender:{" "}
                    <span className="font-medium">
                      {forwardedInfo.originalName}
                    </span>
                    {forwardedInfo.originalEmail && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({forwardedInfo.originalEmail})
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 h-0 min-h-0">
          <div className="p-5 space-y-5">
            {/* Quick Summary Card */}
            {isReady && Object.keys(extractedFields).length > 0 && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                {/* Row 1: Key financials */}
                <div className="grid grid-cols-2 gap-3">
                  {loanAmount && typeof loanAmount !== "boolean" && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Loan Amount
                      </p>
                      <p className="text-lg font-semibold num">
                        {formatCurrency(loanAmount as string | number | null | undefined)}
                      </p>
                    </div>
                  )}
                  {purchasePrice && typeof purchasePrice !== "boolean" && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Purchase Price
                      </p>
                      <p className="text-lg font-semibold num">
                        {formatCurrency(purchasePrice as string | number | null | undefined)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Row 2: Property info */}
                {(propertyAddr || propertyCity) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span>
                      {[propertyAddr, propertyCity, propertyState]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    {propertyType && (
                      <Badge variant="secondary" className="text-[10px] ml-auto">
                        {String(propertyType)}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Row 3: Broker info */}
                {brokerName && (
                  <div className="flex items-center gap-2 text-xs border-t pt-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">{String(brokerName)}</span>
                      {brokerCompany && (
                        <span className="text-muted-foreground">
                          at {String(brokerCompany)}
                        </span>
                      )}
                      {brokerEmail && (
                        <span className="text-muted-foreground">
                          &middot; {String(brokerEmail)}
                        </span>
                      )}
                      {brokerPhone && (
                        <span className="text-muted-foreground">
                          &middot; {String(brokerPhone)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Row 4: Borrower info */}
                {borrowerName && (
                  <div className="flex items-center gap-2 text-xs border-t pt-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">
                      Borrower: {String(borrowerName)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* AI Extraction Summary */}
            {item.extraction_summary && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.extraction_summary}
                </p>
              </div>
            )}

            {/* Notes from extraction */}
            {notesValue && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Notes
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground rounded-lg border p-3 max-h-32 overflow-y-auto">
                  {String(notesValue)}
                </p>
              </div>
            )}

            {/* Attachments */}
            {item.attachments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" />
                  Attachments ({item.attachments.length})
                </Label>
                {item.attachments.some(
                  (a) =>
                    a.extraction_status?.startsWith("upload_failed") ||
                    a.extraction_status === "skipped_too_large"
                ) && (
                  <div className="flex items-center gap-1.5 text-amber-600 text-[11px] rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Some attachments failed to upload. Check the original
                      email for missing files.
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {item.attachments.map((att, i) => {
                    const isFailed =
                      att.extraction_status?.startsWith("upload_failed") ||
                      att.extraction_status === "skipped_too_large";
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-md border p-2 ${
                          isFailed ? "border-amber-500/50 bg-amber-500/5" : ""
                        }`}
                      >
                        {getFileIcon(att.filename)}
                        <span className="text-xs flex-1 truncate">
                          {att.filename}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatBytes(att.size_bytes)}
                        </span>
                        {att.storage_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            asChild
                          >
                            <a
                              href={`/api/storage/download?path=${encodeURIComponent(att.storage_path)}&bucket=loan-documents`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {isFailed && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-amber-500/50 text-amber-600"
                          >
                            Failed
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deal Creation Fields */}
            {isReady && (
              <div className="space-y-4">
                {/* Card Type Selector - FIRST, because it's required */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Deal Type <span className="text-destructive">*</span>
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
                          <span className="text-muted-foreground ml-1">
                            ({ct.capital_side})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deal Name */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Deal Name
                  </Label>
                  <Input
                    className="h-9 text-xs"
                    value={
                      editedDealFields.name ??
                      dealFields.name ??
                      dealFields.property_address ??
                      item.subject ??
                      ""
                    }
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="Enter deal name..."
                  />
                </div>

                {/* Loan Amount + Asset Class row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Loan Amount
                    </Label>
                    <Input
                      className="h-9 text-xs num"
                      type="number"
                      value={
                        editedDealFields.loan_amount ??
                        editedDealFields.amount ??
                        dealFields.loan_amount ??
                        dealFields.amount ??
                        ""
                      }
                      onChange={(e) => {
                        handleFieldChange("loan_amount", e.target.value);
                        handleFieldChange("amount", e.target.value);
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Asset Class
                    </Label>
                    <Select
                      value={
                        editedDealFields.asset_class ??
                        dealFields.asset_class ??
                        ""
                      }
                      onValueChange={(v) =>
                        handleFieldChange("asset_class", v)
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_CLASS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* All Extracted Fields (collapsible) */}
            {isReady && additionalFields.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowAllFields((prev) => !prev)}
                >
                  {showAllFields ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  All Extracted Fields ({additionalFields.length})
                </button>
                {showAllFields && (
                  <div className="space-y-2 rounded-lg border p-3">
                    {additionalFields.map(([key, field]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-28 flex-shrink-0">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {FIELD_LABELS[key] || key.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs num">
                            {CURRENCY_FIELDS.has(key)
                              ? formatCurrency(field.value as string | number)
                              : PERCENT_FIELDS.has(key)
                                ? formatPercent(field.value as string | number)
                                : String(field.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* UW Fields (collapsible) */}
            {isReady && Object.keys(uwFields).length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Underwriting Fields
                </Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {Object.entries(item.extracted_uw_fields || {}).map(
                    ([key, field]) => {
                      const currentUw = getCurrentUwFields();
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <div className="w-28 flex-shrink-0">
                            <span className="text-[11px] font-medium text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="flex-1">
                            <Input
                              className="h-8 text-xs"
                              value={currentUw[key] || ""}
                              onChange={(e) =>
                                handleUwFieldChange(key, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Original Email (collapsible) */}
            {item.body_preview && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowRawEmail((prev) => !prev)}
                >
                  {showRawEmail ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Original Email
                </button>
                {showRawEmail && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap rounded-lg border p-3 max-h-64 overflow-y-auto">
                    {item.body_preview}
                  </p>
                )}
              </div>
            )}

            {/* Attach to Deal flow */}
            {showAttach && (
              <div className="space-y-3 rounded-lg border border-primary/30 p-4">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Attach to Existing Deal
                </Label>

                {!mergePreview && (
                  <div className="space-y-2">
                    <Input
                      className="h-9 text-xs"
                      placeholder="Search by deal name or number..."
                      value={dealSearch}
                      onChange={(e) => handleDealSearch(e.target.value)}
                      autoFocus
                    />
                    {searching && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Searching...
                      </p>
                    )}
                    {dealResults.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {dealResults.map((d) => (
                          <button
                            key={d.id}
                            className="w-full flex items-center justify-between rounded-md border p-2.5 hover:bg-accent text-left transition-colors"
                            onClick={() => handleSelectDeal(d.id)}
                          >
                            <div>
                              <p className="text-xs font-medium">{d.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {d.deal_number && `${d.deal_number} · `}
                                {d.stage || "No stage"}
                              </p>
                            </div>
                            {d.amount && (
                              <span className="text-xs num text-muted-foreground">
                                ${d.amount.toLocaleString()}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {dealSearch.length >= 2 &&
                      dealResults.length === 0 &&
                      !searching && (
                        <p className="text-[11px] text-muted-foreground">
                          No deals found
                        </p>
                      )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setShowAttach(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {mergePreview && (
                  <div className="space-y-3">
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <p className="text-xs font-medium">
                        Merging into: {mergePreview.dealName}
                      </p>
                      {mergePreview.hasConflicts && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span className="text-[11px]">
                            Some fields conflict with existing values. Review
                            below.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {mergePreview.fields.map((f) => (
                        <div
                          key={f.key}
                          className={`flex items-center gap-2 rounded-md border p-2 ${
                            f.state === "conflict"
                              ? "border-amber-500/50 bg-amber-500/5"
                              : f.state === "auto_fill"
                                ? "border-emerald-500/50 bg-emerald-500/5"
                                : ""
                          }`}
                        >
                          {(f.state === "auto_fill" ||
                            f.state === "conflict") && (
                            <Checkbox
                              checked={acceptedFields.has(f.key)}
                              onCheckedChange={() => toggleField(f.key)}
                              className="h-3.5 w-3.5"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium">{f.label}</p>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-muted-foreground truncate">
                                {f.existing ?? "(empty)"}
                              </span>
                              {f.state !== "skip" && f.state !== "match" && (
                                <>
                                  <ArrowRight className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="font-medium truncate">
                                    {f.incoming}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {f.state === "match" && (
                            <Check className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {f.state === "auto_fill" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-emerald-500/50 text-emerald-600"
                            >
                              Fill
                            </Badge>
                          )}
                          {f.state === "conflict" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-amber-500/50 text-amber-600"
                            >
                              Conflict
                            </Badge>
                          )}
                          {f.state === "skip" && (
                            <Badge variant="outline" className="text-[9px]">
                              Skip
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    <Textarea
                      className="text-xs min-h-[40px]"
                      placeholder="Merge notes (optional)"
                      value={mergeNote}
                      onChange={(e) => setMergeNote(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={handleMerge}
                        disabled={pending}
                      >
                        {pending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        Confirm Merge
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setMergePreview(null);
                          setSelectedDealId(null);
                          setDealSearch("");
                          setDealResults([]);
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => setShowAttach(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dismiss form */}
            {showDismiss && (
              <div className="space-y-2 rounded-lg border border-destructive/30 p-4">
                <Label className="text-xs">Dismiss reason (optional)</Label>
                <Textarea
                  className="text-xs min-h-[60px]"
                  placeholder="Why is this being dismissed?"
                  value={dismissNote}
                  onChange={(e) => setDismissNote(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={handleDismiss}
                    disabled={pending}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1" />
                    )}
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
              <div className="rounded-lg border p-4 space-y-1.5 bg-muted/30">
                <p className="text-xs font-medium capitalize">
                  Resolved: {item.status.replace(/_/g, " ")}
                </p>
                {item.resolved_at && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.resolved_at), {
                      addSuffix: true,
                    })}
                  </p>
                )}
                {item.resolution_notes && (
                  <p className="text-xs text-muted-foreground">
                    {item.resolution_notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom action bar */}
        {!isResolved && isReady && (
          <div className="p-4 border-t flex items-center justify-between gap-2 flex-shrink-0 bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                setShowDismiss(true);
                setShowAttach(false);
              }}
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
                disabled={pending || showAttach}
                onClick={() => {
                  setShowAttach(true);
                  setShowDismiss(false);
                }}
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
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1" />
                )}
                Create Deal
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
