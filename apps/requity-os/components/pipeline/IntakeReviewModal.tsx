"use client";

import { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail, Check, X, Plus, Merge, Forward, Paperclip,
  FileText, FileSpreadsheet, Image, File, Sparkles, ChevronDown, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { EntityMergeSection } from "./EntityMergeSection";
import { processIntakeItemAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import type { UnifiedCardType } from "./pipeline-types";
import {
  type IntakeItem,
  type IntakeEntityKey,
  type EntityMode,
  type EntityMatchResult,
  type FieldChoice,
  type IntakeDecisions,
  type IntakeParsedData,
  ENTITY_META,
  ENTITY_FIELD_MAP,
  INCOMING_DATA_MAP,
  isEmpty,
  valsMatch,
  hasBorrowerData,
} from "@/lib/intake/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntakeReviewModalProps {
  item: IntakeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardTypes?: UnifiedCardType[];
}

/** All editable fields in the form, keyed by a flat string key */
interface IntakeFormData {
  // Broker
  brokerName: string;
  brokerEmail: string;
  brokerPhone: string;
  brokerCompany: string;
  brokerLicense: string;
  // Borrower
  borrowerName: string;
  borrowerEntityName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  creditScore: string;
  liquidity: string;
  // Property
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyType: string;
  units: string;
  sqft: string;
  yearBuilt: string;
  // Deal / Financials
  loanType: string;
  loanAmount: string;
  purchasePrice: string;
  ltv: string;
  rate: string;
  term: string;
  dscr: string;
  noi: string;
  capRate: string;
  arv: string;
  rehabBudget: string;
  closingDate: string;
  sellerFinancing: string;
  existingDebt: string;
  debtService: string;
  cashFlow: string;
  cocReturn: string;
  // Meta
  cardTypeId: string;
  notes: string;
}

type FormKey = keyof IntakeFormData;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStr(v: string | number | null | undefined): string {
  if (v == null || v === "") return "";
  return String(v);
}

function numStr(v: number | null | undefined): string {
  if (v == null) return "";
  return String(v);
}

const PROPERTY_TYPES = [
  "Single Family",
  "Duplex/Fourplex",
  "Multifamily",
  "Mixed Use",
  "Commercial",
  "Industrial",
  "Retail",
  "Office",
  "Warehouse",
  "Land",
  "Mobile Home/MHC",
  "RV Park",
  "Campground",
  "Self Storage",
];

const BASE_ENTITY_KEYS: IntakeEntityKey[] = ["contact", "company", "property", "opportunity"];

// ---------------------------------------------------------------------------
// Form field component
// ---------------------------------------------------------------------------

interface FieldInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  aiPrefilled?: boolean;
  type?: "text" | "number" | "date";
  className?: string;
}

function FieldInput({ label, value, onChange, placeholder, aiPrefilled, type = "text", className }: FieldInputProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{label}</label>
        {aiPrefilled && (
          <Sparkles className="h-2.5 w-2.5 text-amber-500/70" />
        )}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-[11px] px-2 bg-background"
      />
    </div>
  );
}

// Currency field with formatting
function CurrencyFieldInput({ label, value, onChange, placeholder, aiPrefilled, className }: Omit<FieldInputProps, "type">) {
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState("");

  const formatCurrencyDisplay = (val: string | number | null | undefined): string => {
    if (val == null || val === "") return "";
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  const parseCurrencyInput = (raw: string): string => {
    const stripped = raw.replace(/[^0-9]/g, "");
    if (stripped === "") return "";
    return stripped;
  };

  const handleFocus = () => {
    setEditing(true);
    setRawText(value || "");
  };

  const handleBlur = () => {
    setEditing(false);
    // Ensure value is stored as a clean number string
    const cleaned = parseCurrencyInput(value || "");
    if (cleaned !== value) {
      onChange(cleaned);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const parsed = parseCurrencyInput(text);
    setRawText(text);
    onChange(parsed);
  };

  const displayValue = editing ? rawText : (value ? formatCurrencyDisplay(value) : "");

  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{label}</label>
        {aiPrefilled && (
          <Sparkles className="h-2.5 w-2.5 text-amber-500/70" />
        )}
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">$</span>
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="h-7 text-[11px] pl-5 pr-2 bg-background text-right num"
        />
      </div>
    </div>
  );
}

// Percentage field with formatting
function PercentageFieldInput({ label, value, onChange, placeholder, aiPrefilled, className }: Omit<FieldInputProps, "type">) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.replace(/[^0-9.]/g, "");
    onChange(text);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{label}</label>
        {aiPrefilled && (
          <Sparkles className="h-2.5 w-2.5 text-amber-500/70" />
        )}
      </div>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          className="h-7 text-[11px] px-2 pr-6 bg-background text-right num"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">%</span>
      </div>
    </div>
  );
}

interface FieldSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  aiPrefilled?: boolean;
  className?: string;
}

function FieldSelect({ label, value, onChange, options, placeholder, aiPrefilled, className }: FieldSelectProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{label}</label>
        {aiPrefilled && (
          <Sparkles className="h-2.5 w-2.5 text-amber-500/70" />
        )}
      </div>
      <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger className="h-7 text-[11px] px-2 bg-background">
          <SelectValue placeholder={placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">{placeholder || "Select..."}</span>
          </SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{count} fields</Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function IntakeReviewModal({ item, open, onOpenChange, cardTypes = [] }: IntakeReviewModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [entityModes, setEntityModes] = useState<Partial<Record<IntakeEntityKey, EntityMode>>>({});
  const [fieldChoices, setFieldChoices] = useState<Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>>({});
  const [manualMatches, setManualMatches] = useState<Partial<Record<IntakeEntityKey, EntityMatchResult>>>({});
  const [pending, startTransition] = useTransition();
  const [mergeExpanded, setMergeExpanded] = useState(false);

  // Form state
  const [form, setForm] = useState<IntakeFormData>({
    brokerName: "", brokerEmail: "", brokerPhone: "", brokerCompany: "", brokerLicense: "",
    borrowerName: "", borrowerEntityName: "", borrowerEmail: "", borrowerPhone: "", creditScore: "", liquidity: "",
    propertyAddress: "", propertyCity: "", propertyState: "", propertyType: "",
    units: "", sqft: "", yearBuilt: "",
    loanType: "", loanAmount: "", purchasePrice: "", ltv: "", rate: "", term: "",
    dscr: "", noi: "", capRate: "", arv: "", rehabBudget: "", closingDate: "",
    sellerFinancing: "", existingDebt: "", debtService: "", cashFlow: "", cocReturn: "",
    cardTypeId: "", notes: "",
  });

  // Track which fields were AI-prefilled
  const [aiFields, setAiFields] = useState<Set<FormKey>>(new Set());

  const p = item?.parsed_data;

  // Initialize form from parsed_data when item changes
  useEffect(() => {
    if (!p) return;
    const prefilled = new Set<FormKey>();
    const init: IntakeFormData = {
      brokerName: toStr(p.brokerName),
      brokerEmail: toStr(p.brokerEmail),
      brokerPhone: toStr(p.brokerPhone),
      brokerCompany: toStr(p.brokerCompany),
      brokerLicense: toStr(p.brokerLicense),
      borrowerName: toStr(p.borrowerName),
      borrowerEntityName: toStr(p.borrowerEntityName),
      borrowerEmail: toStr(p.borrowerEmail),
      borrowerPhone: toStr(p.borrowerPhone),
      creditScore: numStr(p.creditScore),
      liquidity: numStr(p.liquidity),
      propertyAddress: toStr(p.propertyAddress),
      propertyCity: toStr(p.propertyCity),
      propertyState: toStr(p.propertyState),
      propertyType: toStr(p.propertyType),
      units: numStr(p.units),
      sqft: numStr(p.sqft),
      yearBuilt: "",
      loanType: toStr(p.loanType),
      loanAmount: numStr(p.loanAmount),
      purchasePrice: numStr(p.purchasePrice),
      ltv: numStr(p.ltv),
      rate: numStr(p.rate),
      term: toStr(p.term),
      dscr: numStr(p.dscr),
      noi: numStr(p.noi),
      capRate: numStr(p.capRate),
      arv: numStr(p.arv),
      rehabBudget: numStr(p.rehabBudget),
      closingDate: toStr(p.closingDate),
      sellerFinancing: toStr(p.sellerFinancing),
      existingDebt: toStr(p.existingDebt),
      debtService: numStr(p.debtService),
      cashFlow: numStr(p.cashFlow),
      cocReturn: numStr(p.cocReturn),
      cardTypeId: "",
      notes: toStr(p.notes),
    };

    // Track which fields have AI values
    for (const [key, val] of Object.entries(init)) {
      if (val && key !== "cardTypeId" && key !== "notes") {
        prefilled.add(key as FormKey);
      }
    }

    // Auto-detect card type from loan type
    if (p.loanType && cardTypes.length > 0) {
      const lt = p.loanType.toLowerCase();
      const slugMap: Record<string, string> = {
        dscr: "res_debt_dscr", rtl: "res_debt_rtl",
        "comm debt": "comm_debt", "comm eq": "comm_equity",
        commercial: "comm_debt", commdebt: "comm_debt",
      };
      const slug = slugMap[lt];
      if (slug) {
        const ct = cardTypes.find((c) => c.slug === slug && c.status === "active");
        if (ct) {
          init.cardTypeId = ct.id;
          prefilled.add("cardTypeId");
        }
      }
    }

    setForm(init);
    setAiFields(prefilled);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const updateField = useCallback((key: FormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Entity merge logic (preserved from v1)
  const activeEntityKeys = useMemo<IntakeEntityKey[]>(() => {
    if (!p) return BASE_ENTITY_KEYS;
    if (hasBorrowerData(p)) {
      return ["contact", "borrower_contact", "company", "property", "opportunity"];
    }
    return BASE_ENTITY_KEYS;
  }, [p]);

  const getEffectiveMatch = (k: IntakeEntityKey): EntityMatchResult | null | undefined => {
    return manualMatches[k] ?? item?.auto_matches[k];
  };

  const getMode = (k: IntakeEntityKey): EntityMode => {
    if (!item) return "new";
    return entityModes[k] ?? (getEffectiveMatch(k) ? "merge" : "new");
  };

  const setMode = (k: IntakeEntityKey, v: EntityMode) => {
    setEntityModes((prev) => ({ ...prev, [k]: v }));
  };

  const getFieldChoicesForEntity = (k: IntakeEntityKey): Record<string, FieldChoice> => {
    return fieldChoices[k] || {};
  };

  const setFieldChoice = (entity: IntakeEntityKey, field: string, val: FieldChoice) => {
    setFieldChoices((prev) => ({
      ...prev,
      [entity]: { ...(prev[entity] || {}), [field]: val },
    }));
  };

  const handleManualMatch = (entityKey: IntakeEntityKey, match: EntityMatchResult) => {
    setManualMatches((prev) => ({ ...prev, [entityKey]: match }));
    setEntityModes((prev) => ({ ...prev, [entityKey]: "merge" }));
  };

  const matchCount = useMemo(() => {
    return activeEntityKeys.filter((ek) => getEffectiveMatch(ek)).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityKeys, manualMatches, item]);

  // Action summary
  const summary = useMemo(() => {
    if (!item) return [];
    const actions: { label: string; isNew: boolean }[] = [];
    activeEntityKeys.forEach((ek) => {
      const mode = getMode(ek);
      const meta = ENTITY_META[ek];
      const displayLabel = ek === "opportunity" ? "Deal" : meta.label;
      const match = getEffectiveMatch(ek);
      if (mode === "new") {
        actions.push({ label: `Create new ${displayLabel}`, isNew: true });
      } else if (mode === "merge" && match) {
        const matchName = String(match.snapshot.name || match.snapshot.address_line1 || "");
        actions.push({ label: `Merge ${displayLabel} into ${matchName}`, isNew: false });
      }
    });
    return actions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityModes, fieldChoices, manualMatches, item, activeEntityKeys]);

  const handleConfirm = () => {
    if (!item) return;

    const effectiveFieldChoices: Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>> = {};
    for (const ek of activeEntityKeys) {
      const current = fieldChoices[ek] || {};
      effectiveFieldChoices[ek] = { ...current };
      const mode = getMode(ek);
      const match = getEffectiveMatch(ek);
      if (mode === "merge" && match) {
        const fields = ENTITY_FIELD_MAP[ek];
        const incoming = INCOMING_DATA_MAP[ek](item.parsed_data);
        const existing = match.snapshot;
        for (const f of fields) {
          const inc = incoming[f.key];
          const ext = existing[f.key];
          if (!isEmpty(inc) && !isEmpty(ext) && !valsMatch(inc, ext) && !effectiveFieldChoices[ek]![f.key]) {
            effectiveFieldChoices[ek]![f.key] = "incoming";
          }
        }
      }
    }

    const decisions: IntakeDecisions = {
      entityModes: Object.fromEntries(activeEntityKeys.map((k) => [k, getMode(k)])) as Partial<Record<IntakeEntityKey, EntityMode>>,
      fieldChoices: effectiveFieldChoices as Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>,
      manualMatches: Object.keys(manualMatches).length > 0 ? manualMatches : undefined,
    };

    // Pass form overrides so processIntakeItemAction uses edited values
    const formOverrides = { ...form };

    startTransition(async () => {
      const result = await processIntakeItemAction(item.id, decisions, formOverrides);
      if (result?.error) {
        toast({ title: "Processing failed", description: result.error, variant: "destructive" });
      } else {
        const deal = result.deal as { id?: string; deal_number?: string } | undefined;
        toast({
          title: "Intake processed",
          description: deal?.deal_number ? `Deal ${deal.deal_number} created.` : "Deal created.",
        });
        onOpenChange(false);
        setEntityModes({});
        setFieldChoices({});
        setManualMatches({});

        // Navigate to the new deal so the user can act on it immediately
        if (deal?.deal_number || deal?.id) {
          router.push(`/pipeline/${deal.deal_number || deal.id}`);
        }
      }
    });
  };

  const handleDismiss = () => {
    if (!item) return;
    startTransition(async () => {
      const result = await processIntakeItemAction(item.id, null);
      if (result?.error) {
        console.error("Failed to dismiss intake item:", result.error);
      } else {
        onOpenChange(false);
        setEntityModes({});
        setFieldChoices({});
        setManualMatches({});
      }
    });
  };

  if (!item || !p) return null;

  const activeCardTypes = cardTypes.filter((ct) => ct.status === "active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[1400px] max-h-[92vh] md:max-h-[92vh] p-0 md:p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-[9px] font-bold px-1.5 py-0 bg-gradient-to-r from-amber-500 to-amber-600 text-black border-0">
                INTAKE REVIEW
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}
              </span>
            </div>
            <DialogTitle className="text-base">{item.subject || "(no subject)"}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Mail className="h-3.5 w-3.5" />
            <span>{item.from_name ? `${item.from_name} <${item.from_email}>` : item.from_email}</span>
          </div>
          {p.isForwarded && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[11px] mt-2">
              <Forward className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="text-muted-foreground">
                Forwarded by <span className="font-medium text-foreground">{p.forwarderName || item.from_name || item.from_email}</span>
                {(p.brokerName || p.contactName) && (
                  <>{" - Original sender: "}<span className="font-medium text-foreground">{p.brokerName || p.contactName}</span>
                    {(p.brokerEmail || p.contactEmail) && (
                      <span className="text-muted-foreground/70"> ({p.brokerEmail || p.contactEmail})</span>
                    )}
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Two-column body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex min-h-0">
            {/* LEFT COLUMN: Editable fields */}
            <div className="flex-1 min-w-0 p-6 pr-4 space-y-5 border-r border-border/50">

              {/* Card Type Selector */}
              <div>
                <SectionHeader title="Deal Type" />
                <Select value={form.cardTypeId || "__none__"} onValueChange={(v) => updateField("cardTypeId", v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs bg-background w-full max-w-xs">
                    <SelectValue placeholder="Select card type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">Auto-detect from loan type</span>
                    </SelectItem>
                    {activeCardTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.label} ({ct.capital_side})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Broker / Correspondent */}
              <div>
                <SectionHeader title="Broker / Correspondent" />
                <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                  <FieldInput label="Name" value={form.brokerName} onChange={(v) => updateField("brokerName", v)} placeholder="Broker name" aiPrefilled={aiFields.has("brokerName")} />
                  <FieldInput label="Email" value={form.brokerEmail} onChange={(v) => updateField("brokerEmail", v)} placeholder="broker@email.com" aiPrefilled={aiFields.has("brokerEmail")} />
                  <FieldInput label="Phone" value={form.brokerPhone} onChange={(v) => updateField("brokerPhone", v)} placeholder="(555) 555-5555" aiPrefilled={aiFields.has("brokerPhone")} />
                  <FieldInput label="Company" value={form.brokerCompany} onChange={(v) => updateField("brokerCompany", v)} placeholder="Brokerage name" aiPrefilled={aiFields.has("brokerCompany")} />
                  <FieldInput label="License #" value={form.brokerLicense} onChange={(v) => updateField("brokerLicense", v)} placeholder="License number" aiPrefilled={aiFields.has("brokerLicense")} />
                </div>
              </div>

              {/* Borrower */}
              <div>
                <SectionHeader title="Borrower" />
                <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                  <FieldInput label="Name" value={form.borrowerName} onChange={(v) => updateField("borrowerName", v)} placeholder="Borrower name" aiPrefilled={aiFields.has("borrowerName")} />
                  <FieldInput label="Entity Name" value={form.borrowerEntityName} onChange={(v) => updateField("borrowerEntityName", v)} placeholder="LLC / Corp name" aiPrefilled={aiFields.has("borrowerEntityName")} />
                  <FieldInput label="Email" value={form.borrowerEmail} onChange={(v) => updateField("borrowerEmail", v)} placeholder="borrower@email.com" aiPrefilled={aiFields.has("borrowerEmail")} />
                  <FieldInput label="Phone" value={form.borrowerPhone} onChange={(v) => updateField("borrowerPhone", v)} placeholder="(555) 555-5555" aiPrefilled={aiFields.has("borrowerPhone")} />
                  <FieldInput label="Credit Score" value={form.creditScore} onChange={(v) => updateField("creditScore", v)} placeholder="750" type="number" aiPrefilled={aiFields.has("creditScore")} />
                  <CurrencyFieldInput label="Liquidity" value={form.liquidity} onChange={(v) => updateField("liquidity", v)} placeholder="200,000" aiPrefilled={aiFields.has("liquidity")} />
                </div>
              </div>

              {/* Property */}
              <div>
                <SectionHeader title="Property" />
                <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                  <FieldInput label="Address" value={form.propertyAddress} onChange={(v) => updateField("propertyAddress", v)} placeholder="123 Main St" aiPrefilled={aiFields.has("propertyAddress")} className="col-span-2" />
                  <FieldInput label="City" value={form.propertyCity} onChange={(v) => updateField("propertyCity", v)} placeholder="City" aiPrefilled={aiFields.has("propertyCity")} />
                  <FieldInput label="State" value={form.propertyState} onChange={(v) => updateField("propertyState", v)} placeholder="TX" aiPrefilled={aiFields.has("propertyState")} />
                  <FieldSelect
                    label="Property Type"
                    value={form.propertyType}
                    onChange={(v) => updateField("propertyType", v)}
                    options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
                    placeholder="Select type"
                    aiPrefilled={aiFields.has("propertyType")}
                  />
                  <FieldInput label="Units" value={form.units} onChange={(v) => updateField("units", v)} placeholder="1" type="number" aiPrefilled={aiFields.has("units")} />
                  <FieldInput label="Sq Ft" value={form.sqft} onChange={(v) => updateField("sqft", v)} placeholder="2,500" type="number" aiPrefilled={aiFields.has("sqft")} />
                  <FieldInput label="Year Built" value={form.yearBuilt} onChange={(v) => updateField("yearBuilt", v)} placeholder="1990" type="number" aiPrefilled={aiFields.has("yearBuilt")} />
                </div>
              </div>

              {/* Deal / Financials */}
              <div>
                <SectionHeader title="Deal / Financials" />
                <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                  <CurrencyFieldInput label="Loan Amount" value={form.loanAmount} onChange={(v) => updateField("loanAmount", v)} placeholder="1,100,000" aiPrefilled={aiFields.has("loanAmount")} />
                  <CurrencyFieldInput label="Purchase Price" value={form.purchasePrice} onChange={(v) => updateField("purchasePrice", v)} placeholder="1,800,000" aiPrefilled={aiFields.has("purchasePrice")} />
                  <FieldInput label="Loan Type" value={form.loanType} onChange={(v) => updateField("loanType", v)} placeholder="DSCR, Bridge, etc." aiPrefilled={aiFields.has("loanType")} />
                  <PercentageFieldInput label="LTV" value={form.ltv} onChange={(v) => updateField("ltv", v)} placeholder="65" aiPrefilled={aiFields.has("ltv")} />
                  <PercentageFieldInput label="Rate" value={form.rate} onChange={(v) => updateField("rate", v)} placeholder="8.5" aiPrefilled={aiFields.has("rate")} />
                  <FieldInput label="Term" value={form.term} onChange={(v) => updateField("term", v)} placeholder="12 months" aiPrefilled={aiFields.has("term")} />
                  <FieldInput label="DSCR" value={form.dscr} onChange={(v) => updateField("dscr", v)} placeholder="1.25" aiPrefilled={aiFields.has("dscr")} />
                  <CurrencyFieldInput label="NOI" value={form.noi} onChange={(v) => updateField("noi", v)} placeholder="132,000" aiPrefilled={aiFields.has("noi")} />
                  <PercentageFieldInput label="Cap Rate" value={form.capRate} onChange={(v) => updateField("capRate", v)} placeholder="7.5" aiPrefilled={aiFields.has("capRate")} />
                  <CurrencyFieldInput label="ARV" value={form.arv} onChange={(v) => updateField("arv", v)} placeholder="2,400,000" aiPrefilled={aiFields.has("arv")} />
                  <CurrencyFieldInput label="Rehab Budget" value={form.rehabBudget} onChange={(v) => updateField("rehabBudget", v)} placeholder="250,000" aiPrefilled={aiFields.has("rehabBudget")} />
                  <FieldInput label="Closing Date" value={form.closingDate} onChange={(v) => updateField("closingDate", v)} placeholder="2026-04-15" type="date" aiPrefilled={aiFields.has("closingDate")} />
                  <FieldInput label="Seller Financing" value={form.sellerFinancing} onChange={(v) => updateField("sellerFinancing", v)} placeholder="Details..." aiPrefilled={aiFields.has("sellerFinancing")} />
                  <FieldInput label="Existing Debt" value={form.existingDebt} onChange={(v) => updateField("existingDebt", v)} placeholder="Details..." aiPrefilled={aiFields.has("existingDebt")} />
                  <CurrencyFieldInput label="Debt Service" value={form.debtService} onChange={(v) => updateField("debtService", v)} placeholder="Annual debt service" aiPrefilled={aiFields.has("debtService")} />
                  <CurrencyFieldInput label="Cash Flow" value={form.cashFlow} onChange={(v) => updateField("cashFlow", v)} placeholder="Annual cash flow" aiPrefilled={aiFields.has("cashFlow")} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <SectionHeader title="Deal Notes" />
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Add any additional notes, context, or details about this deal..."
                  className="text-[11px] min-h-[100px] bg-background resize-y"
                />
                {aiFields.has("notes") && form.notes && (
                  <div className="flex items-center gap-1 mt-1">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500/70" />
                    <span className="text-[9px] text-muted-foreground/50">AI-extracted summary, editable</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Documents + Entity merge + Summary */}
            <div className="w-[380px] shrink-0 p-6 pl-4 space-y-5 overflow-y-auto">

              {/* Documents */}
              {item.email_intake_queue_id && (
                <AttachmentList queueId={item.email_intake_queue_id} />
              )}

              {/* Entity Merge Decisions */}
              <div>
                <button
                  type="button"
                  onClick={() => setMergeExpanded(!mergeExpanded)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {mergeExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Entity Matching
                  </span>
                  {matchCount > 0 && (
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
                      {matchCount} match{matchCount > 1 ? "es" : ""}
                    </Badge>
                  )}
                </button>
                <p className="text-[9px] text-muted-foreground/60 mt-1 ml-5">
                  Choose to create new records or merge with existing contacts, companies, and properties.
                </p>

                {mergeExpanded && (
                  <div className="space-y-2 mt-3">
                    {activeEntityKeys.map((ek) => (
                      <EntityMergeSection
                        key={ek}
                        entityKey={ek}
                        autoMatch={getEffectiveMatch(ek) ?? null}
                        parsed={p}
                        mode={getMode(ek)}
                        onModeChange={(v) => setMode(ek, v)}
                        fieldChoices={getFieldChoicesForEntity(ek)}
                        onFieldChoice={setFieldChoice}
                        onManualMatch={handleManualMatch}
                      />
                    ))}
                  </div>
                )}

                {!mergeExpanded && matchCount > 0 && (
                  <div className="mt-2 ml-5 space-y-1">
                    {activeEntityKeys.map((ek) => {
                      const match = getEffectiveMatch(ek);
                      if (!match) return null;
                      const meta = ENTITY_META[ek];
                      const displayLabel = ek === "opportunity" ? "Deal" : meta.label;
                      const matchName = String(match.snapshot.name || match.snapshot.address_line1 || "");
                      return (
                        <div key={ek} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Merge className="h-3 w-3 text-primary shrink-0" />
                          <span>{displayLabel}: merge with <span className="font-medium text-foreground">{matchName}</span></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Summary */}
              {summary.length > 0 && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    What will happen
                  </div>
                  {summary.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {s.isNew ? (
                        <Plus className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                      ) : (
                        <Merge className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                      )}
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={handleDismiss}
            disabled={pending}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Dismiss
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/50">
              {aiFields.size} fields auto-filled by AI
            </span>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-600 hover:to-amber-700"
              onClick={handleConfirm}
              disabled={pending}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Confirm &amp; Process
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Attachment list (right column)
// ---------------------------------------------------------------------------

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="h-4 w-4 shrink-0 text-red-400" />;
  if (["xlsx", "xls", "csv"].includes(ext || "")) return <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-400" />;
  if (["doc", "docx"].includes(ext || "")) return <FileText className="h-4 w-4 shrink-0 text-blue-400" />;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) return <Image className="h-4 w-4 shrink-0 text-purple-400" />;
  return <File className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

function AttachmentList({ queueId }: { queueId: string }) {
  const [attachments, setAttachments] = useState<Array<{ filename: string; mime_type?: string; size_bytes?: number }>>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("email_intake_queue")
      .select("attachments")
      .eq("id", queueId)
      .single()
      .then(({ data }) => {
        if (data?.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
          setAttachments(data.attachments as Array<{ filename: string; mime_type?: string; size_bytes?: number }>);
        }
      });
  }, [queueId]);

  if (attachments.length === 0) {
    return (
      <div>
        <SectionHeader title="Documents" />
        <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
          <Paperclip className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-[10px] text-muted-foreground/50">No attachments in this email</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <SectionHeader title={`Documents (${attachments.length})`} />
        <Badge variant="outline" className="text-[8px] px-1.5 py-0 text-green-500 border-green-500/30">
          Will upload to deal
        </Badge>
      </div>
      <div className="space-y-1.5">
        {attachments.map((att, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/10 px-3 py-2"
          >
            {getFileIcon(att.filename)}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-foreground font-medium break-words">{att.filename}</div>
              <div className="text-[9px] text-muted-foreground/60 mt-0.5">
                {att.mime_type?.split("/").pop()?.toUpperCase() || "FILE"}
                {att.size_bytes ? ` \u00B7 ${formatFileSize(att.size_bytes)}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
