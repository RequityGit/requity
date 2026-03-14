"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Mail, Check, X, Plus, Merge, Forward, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { EntityMergeSection } from "./EntityMergeSection";
import { processIntakeItemAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
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

interface IntakeReviewModalProps {
  item: IntakeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatMoney(n: number | undefined | null): string {
  if (!n) return "--";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatPercent(n: number | undefined | null): string {
  if (!n) return "--";
  if (n > 1) return `${n.toFixed(2)}%`;
  return `${(n * 100).toFixed(2)}%`;
}

const BASE_ENTITY_KEYS: IntakeEntityKey[] = ["contact", "company", "property", "opportunity"];

interface FieldDisplayDef {
  label: string;
  value: string | undefined;
}

function buildFieldSection(
  title: string,
  fields: FieldDisplayDef[]
): { title: string; fields: FieldDisplayDef[] } | null {
  const populated = fields.filter((f) => f.value && f.value !== "--");
  if (populated.length === 0) return null;
  return { title, fields: populated };
}

function buildSections(p: IntakeParsedData) {
  const sections: { title: string; fields: FieldDisplayDef[] }[] = [];

  const broker = buildFieldSection("Broker / Correspondent", [
    { label: "Name", value: p.brokerName },
    { label: "Email", value: p.brokerEmail },
    { label: "Phone", value: p.brokerPhone },
    { label: "Company", value: p.brokerCompany },
    { label: "License #", value: p.brokerLicense },
  ]);
  if (broker) sections.push(broker);

  const borrower = buildFieldSection("Borrower", [
    { label: "Name", value: p.borrowerName },
    { label: "Entity", value: p.borrowerEntityName },
    { label: "Email", value: p.borrowerEmail },
    { label: "Phone", value: p.borrowerPhone },
  ]);
  if (borrower) sections.push(borrower);

  const contact = buildFieldSection("Contact", [
    { label: "Name", value: p.contactName },
    { label: "Email", value: p.contactEmail },
    { label: "Phone", value: p.contactPhone },
    { label: "Company", value: p.companyName },
  ]);
  if (contact && !broker) sections.push(contact);

  const property = buildFieldSection("Property", [
    { label: "Address", value: p.propertyAddress },
    { label: "City", value: p.propertyCity },
    { label: "State", value: p.propertyState },
    { label: "Type", value: p.propertyType },
    { label: "Units", value: p.units?.toString() },
    { label: "Sq Ft", value: p.sqft?.toLocaleString() },
    { label: "Properties", value: p.propertyCount && p.propertyCount > 1 ? p.propertyCount.toString() : undefined },
  ]);
  if (property) sections.push(property);

  const deal = buildFieldSection("Deal / Financials", [
    { label: "Purchase Price", value: formatMoney(p.purchasePrice) },
    { label: "Loan Amount", value: formatMoney(p.loanAmount) },
    { label: "Loan Type", value: p.loanType },
    { label: "LTV", value: formatPercent(p.ltv) },
    { label: "Rate", value: formatPercent(p.rate) },
    { label: "Term", value: p.term },
    { label: "DSCR", value: p.dscr?.toFixed(2) },
    { label: "NOI", value: formatMoney(p.noi) },
    { label: "Cap Rate", value: formatPercent(p.capRate) },
    { label: "Debt Service", value: formatMoney(p.debtService) },
    { label: "Cash Flow", value: formatMoney(p.cashFlow) },
    { label: "COC Return", value: formatPercent(p.cocReturn) },
    { label: "ARV", value: formatMoney(p.arv) },
    { label: "Rehab Budget", value: formatMoney(p.rehabBudget) },
    { label: "Closing Date", value: p.closingDate },
    { label: "Seller Financing", value: p.sellerFinancing },
    { label: "Existing Debt", value: p.existingDebt },
  ]);
  if (deal) sections.push(deal);

  return sections;
}

export function IntakeReviewModal({ item, open, onOpenChange }: IntakeReviewModalProps) {
  const { toast } = useToast();
  const [entityModes, setEntityModes] = useState<Partial<Record<IntakeEntityKey, EntityMode>>>({});
  const [fieldChoices, setFieldChoices] = useState<Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>>({});
  const [manualMatches, setManualMatches] = useState<Partial<Record<IntakeEntityKey, EntityMatchResult>>>({});
  const [pending, startTransition] = useTransition();

  const p = item?.parsed_data;

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

  const allResolved = useMemo(() => {
    if (!item) return false;
    for (const ek of activeEntityKeys) {
      const mode = getMode(ek);
      const match = getEffectiveMatch(ek);
      if (mode === "merge" && match) {
        const fields = ENTITY_FIELD_MAP[ek];
        const incoming = INCOMING_DATA_MAP[ek](item.parsed_data);
        const existing = match.snapshot;
        const ec = getFieldChoicesForEntity(ek);
        for (const f of fields) {
          const inc = incoming[f.key];
          const ext = existing[f.key];
          if (!isEmpty(inc) && !isEmpty(ext) && !valsMatch(inc, ext) && !ec[f.key]) {
            return false;
          }
        }
      }
    }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityModes, fieldChoices, manualMatches, item, activeEntityKeys]);

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
        const fields = ENTITY_FIELD_MAP[ek];
        const incoming = INCOMING_DATA_MAP[ek](item.parsed_data);
        const existing = match.snapshot;
        const fc = getFieldChoicesForEntity(ek);
        const overwrites: string[] = [];
        const fills: string[] = [];
        const boths: string[] = [];
        fields.forEach((f) => {
          const inc = incoming[f.key];
          const ext = existing[f.key];
          if (isEmpty(inc) && isEmpty(ext)) return;
          if (valsMatch(inc, ext)) return;
          if (isEmpty(ext) && !isEmpty(inc)) { fills.push(f.label); return; }
          if (isEmpty(inc) && !isEmpty(ext)) return;
          if (fc[f.key] === "incoming") overwrites.push(f.label);
          if (fc[f.key] === "both") boths.push(f.label);
        });
        const parts: string[] = [];
        if (fills.length) parts.push(`fill ${fills.length} empty field${fills.length > 1 ? "s" : ""}`);
        if (overwrites.length) parts.push(`overwrite ${overwrites.join(", ")}`);
        if (boths.length) parts.push(`keep both for ${boths.join(", ")}`);
        const matchName = String(existing.name || existing.address_line1 || "");
        actions.push({
          label: `Merge ${displayLabel} \u2192 ${matchName}${parts.length ? ": " + parts.join("; ") : ""}`,
          isNew: false,
        });
      }
    });
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityModes, fieldChoices, manualMatches, item, activeEntityKeys]);

  const handleConfirm = () => {
    if (!item) return;

    // Build effective field choices: default any unresolved merge conflict to "incoming" so the user can submit without expanding every section
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
    startTransition(async () => {
      const result = await processIntakeItemAction(item.id, decisions);
      if (result?.error) {
        toast({
          title: "Processing failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        const deal = result.deal as { deal_number?: string } | undefined;
        toast({
          title: "Intake processed",
          description: deal?.deal_number ? `Deal ${deal.deal_number} created.` : "Deal created.",
        });
        onOpenChange(false);
        setEntityModes({});
        setFieldChoices({});
        setManualMatches({});
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

  const sections = buildSections(p);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] max-h-[92vh] p-0 flex flex-col gap-0">
        {/* Header */}
        <div className="p-5 pb-3 border-b">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="text-[9px] font-bold px-1.5 py-0 bg-gradient-to-r from-amber-500 to-amber-600 text-black border-0">
                INTAKE REVIEW
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(item.received_at), { addSuffix: true })}
              </span>
            </div>
            <DialogTitle className="text-base truncate">
              {item.subject || "(no subject)"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Mail className="h-3.5 w-3.5" />
            <span>{item.from_name ? `${item.from_name} <${item.from_email}>` : item.from_email}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 space-y-5">
            {/* Forwarded email banner */}
            {p.isForwarded && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[11px]">
                <Forward className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-muted-foreground">
                  Forwarded by <span className="font-medium text-foreground">{p.forwarderName || item.from_name || item.from_email}</span>
                  {(p.brokerName || p.contactName) && (
                    <>
                      {" \u2014 Original sender: "}
                      <span className="font-medium text-foreground">{p.brokerName || p.contactName}</span>
                      {(p.brokerEmail || p.contactEmail) && (
                        <span className="text-muted-foreground/70"> ({p.brokerEmail || p.contactEmail})</span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Entity Merge Decisions first so they're visible without scrolling */}
            <div>
              <Label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Entity Merge Decisions
              </Label>
              <p className="text-[10px] text-muted-foreground mt-1 mb-3">
                <strong className="text-foreground">Click each row below</strong> to expand. Choose + New or Find/Merge, and for matches pick existing vs incoming.
              </p>
              <div className="space-y-2">
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
            </div>

            {/* Extracted Fields (read-only summary) */}
            <div className="border-t border-border pt-4">
              <Label className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted Fields
              </Label>
              <p className="text-[10px] text-muted-foreground/80 mt-1">
                Read-only summary from the email.
              </p>
              {sections.length === 0 ? (
                <p className="text-[11px] text-muted-foreground mt-2">No fields extracted from this email.</p>
              ) : (
                <div className="space-y-4 mt-2">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5">
                        {section.title}
                      </div>
                      <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
                        {section.fields.map((f) => (
                          <div key={f.label}>
                            <div className="text-[9px] text-muted-foreground/50">{f.label}</div>
                            <div className="text-[11px] text-foreground font-medium mt-0.5 truncate">
                              {f.value || "--"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {item.email_intake_queue_id && (
                <AttachmentList queueId={item.email_intake_queue_id} />
              )}

              {p.notes && (
                <div className="mt-3 rounded-md border p-2.5">
                  <div className="text-[9px] text-muted-foreground/50 mb-0.5">Notes</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">{p.notes}</div>
                </div>
              )}
            </div>

            {/* Action Summary */}
            {summary.length > 0 && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Action Summary
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
        </ScrollArea>

        {/* Bottom action bar */}
        <div className="p-4 border-t flex items-center justify-between">
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
      </DialogContent>
    </Dialog>
  );
}

function AttachmentList({ queueId }: { queueId: string }) {
  const [attachments, setAttachments] = useState<Array<{ filename: string; size_bytes?: number }>>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("email_intake_queue")
      .select("attachments")
      .eq("id", queueId)
      .single()
      .then(({ data }) => {
        if (data?.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
          setAttachments(data.attachments as Array<{ filename: string; size_bytes?: number }>);
        }
      });
  }, [queueId]);

  if (attachments.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5">
        Attachments
      </div>
      <div className="space-y-1">
        {attachments.map((att, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Paperclip className="h-3 w-3 shrink-0" />
            <span className="truncate">{att.filename}</span>
            {att.size_bytes && (
              <span className="text-[9px] text-muted-foreground/50 shrink-0">
                {att.size_bytes >= 1_000_000
                  ? `${(att.size_bytes / 1_000_000).toFixed(1)} MB`
                  : `${Math.round(att.size_bytes / 1_000)} KB`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
