"use client";

import React, { useState, useCallback } from "react";
import { FileText, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollapsibleSection } from "./CollapsibleSection";
import { useCreditMemo } from "./useCreditMemo";
import { showSuccess, showError, showLoading, resolveLoading, rejectLoading } from "@/lib/toast";
import type { DealDocData, RiskFactor, StressScenario, FeeIncome, GuarantorDetail } from "@/lib/docgen/types";

interface CreditMemoSectionProps {
  dealId: string;
  dealDocData: DealDocData;
}

/** Small helper for dynamic array fields */
function DynamicRows<T extends object>({
  items,
  onUpdate,
  renderRow,
  newItem,
  label,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  renderRow: (item: T, idx: number, update: (field: string, val: unknown) => void) => React.ReactNode;
  newItem: () => T;
  label: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <div className="flex-1">{renderRow(item, idx, (field, val) => {
            const updated = [...items];
            updated[idx] = { ...updated[idx], [field]: val };
            onUpdate(updated);
          })}</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mt-1 text-muted-foreground hover:text-destructive"
            onClick={() => onUpdate(items.filter((_, i) => i !== idx))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onUpdate([...items, newItem()])}
      >
        <Plus className="h-3 w-3 mr-1" /> Add {label}
      </Button>
    </div>
  );
}

export function CreditMemoSection({ dealId, dealDocData }: CreditMemoSectionProps) {
  const { memo, loading, saving, updateField, saveNow, createDraft } = useCreditMemo(dealId);
  const [generating, setGenerating] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!memo) return;
    setGenerating(true);
    const toastId = showLoading("Generating credit memo...");
    try {
      await saveNow();
      const { generateCreditMemo } = await import("@/lib/docgen/generate-credit-memo");
      await generateCreditMemo({ deal: dealDocData, memo });
      resolveLoading(toastId, "Credit memo downloaded");
    } catch (err) {
      rejectLoading(toastId, "Could not generate credit memo", err);
    } finally {
      setGenerating(false);
    }
  }, [dealDocData, memo, saveNow]);

  const handleDraftWithAI = useCallback(async () => {
    setDrafting(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/draft-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: "credit_memo" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI draft failed");
      }
      const data = await res.json();
      // Populate narrative fields
      const narrativeFields = [
        "recommendation", "recommendation_narrative", "risk_rating",
        "property_condition_narrative", "business_plan_narrative",
        "exit_strategy_narrative", "stress_narrative",
        "metrics_exceptions_narrative", "portfolio_impact_narrative",
        "sponsor_track_record_narrative",
      ];
      narrativeFields.forEach((field) => {
        if (data[field]) updateField(field, data[field]);
      });
      // Populate structured fields
      const structuredFields = [
        "stress_scenarios", "risk_factors", "conditions_precedent", "ongoing_covenants",
      ];
      structuredFields.forEach((field) => {
        if (data[field]) updateField(field, data[field]);
      });
      showSuccess("AI draft generated. Review and edit before saving.");
    } catch (err) {
      showError("Could not generate AI draft", err);
    } finally {
      setDrafting(false);
    }
  }, [dealId, updateField]);

  // Count completed narrative sections
  const narrativeKeys = [
    "recommendation_narrative", "property_condition_narrative",
    "business_plan_narrative", "exit_strategy_narrative",
    "stress_narrative", "sponsor_track_record_narrative",
    "portfolio_impact_narrative", "metrics_exceptions_narrative",
  ];
  const completedCount = memo ? narrativeKeys.filter((k) => !!(memo as unknown as Record<string, unknown>)[k]).length : 0;

  const statusBadge = memo ? (
    <Badge
      variant={memo.status === "approved" ? "default" : "outline"}
      className="text-[10px]"
    >
      v{memo.version} {memo.status === "draft" ? "Draft" : memo.status === "in_review" ? "In Review" : memo.status === "approved" ? "Approved" : "Superseded"}
    </Badge>
  ) : null;

  const saveIndicator = saving ? (
    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
    </span>
  ) : memo ? (
    <span className="text-[11px] text-muted-foreground">{completedCount}/{narrativeKeys.length} sections</span>
  ) : null;

  const actions = (
    <div className="flex items-center gap-2">
      {saveIndicator}
      {statusBadge}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleDraftWithAI}
              disabled={drafting || !memo}
            >
              {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Draft with AI
            </Button>
          </TooltipTrigger>
          {!memo && <TooltipContent>Create a draft first</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs"
              onClick={handleGenerate}
              disabled={generating || !memo}
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
              Generate DOCX
            </Button>
          </TooltipTrigger>
          {!memo && <TooltipContent>Create a credit memo draft first</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  if (loading) {
    return (
      <CollapsibleSection icon={FileText} title="Credit Memo" defaultOpen={false}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection icon={FileText} title="Credit Memo" defaultOpen={false} actions={actions}>
      {!memo ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">No credit memo yet for this deal.</p>
          <Button variant="outline" size="sm" onClick={createDraft}>
            Create Credit Memo Draft
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={["recommendation"]} className="space-y-2">
          {/* 1. Recommendation */}
          <AccordionItem value="recommendation" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Recommendation & Status
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="inline-field-label">Status</span>
                    <Select value={memo.status} onValueChange={(v) => updateField("status", v)}>
                      <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="inline-field-label">Recommendation</span>
                    <Select value={memo.recommendation ?? "approve"} onValueChange={(v) => updateField("recommendation", v)}>
                      <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">Approve</SelectItem>
                        <SelectItem value="approve_with_conditions">Approve with Conditions</SelectItem>
                        <SelectItem value="decline">Decline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="inline-field-label">Risk Rating</span>
                    <Select value={memo.risk_rating ?? "green"} onValueChange={(v) => updateField("risk_rating", v)}>
                      <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  className="min-h-[100px] text-sm"
                  value={memo.recommendation_narrative ?? ""}
                  onChange={(e) => updateField("recommendation_narrative", e.target.value)}
                  placeholder="Recommendation narrative..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Property & Market */}
          <AccordionItem value="property" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Property & Market
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="inline-field-label">Property Condition</span>
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={memo.property_condition_narrative ?? ""}
                    onChange={(e) => updateField("property_condition_narrative", e.target.value)}
                    placeholder="Property condition assessment..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-field-label">Metrics Exceptions</span>
                  <Textarea
                    className="min-h-[60px] text-sm"
                    value={memo.metrics_exceptions_narrative ?? ""}
                    onChange={(e) => updateField("metrics_exceptions_narrative", e.target.value)}
                    placeholder="Any exceptions to standard metrics guidelines..."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Sponsor & Guarantor */}
          <AccordionItem value="sponsor" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Sponsor & Guarantor
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="inline-field-label">Track Record</span>
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={memo.sponsor_track_record_narrative ?? ""}
                    onChange={(e) => updateField("sponsor_track_record_narrative", e.target.value)}
                    placeholder="Sponsor experience and track record..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-field-label">Guarantor Details</span>
                  <DynamicRows<GuarantorDetail>
                    items={(memo.guarantor_details as GuarantorDetail[]) ?? []}
                    onUpdate={(items) => updateField("guarantor_details", items)}
                    newItem={() => ({ name: "", ownership_pct: undefined, net_worth: undefined, liquidity: undefined, credit_score: undefined })}
                    label="Guarantor"
                    renderRow={(item, _idx, update) => (
                      <div className="grid grid-cols-5 gap-2">
                        <Input className="text-xs h-8" value={item.name ?? ""} onChange={(e) => update("name", e.target.value)} placeholder="Name" />
                        <Input className="text-xs h-8" type="number" value={item.ownership_pct ?? ""} onChange={(e) => update("ownership_pct", e.target.value ? Number(e.target.value) : undefined)} placeholder="Own %" />
                        <Input className="text-xs h-8" type="number" value={item.net_worth ?? ""} onChange={(e) => update("net_worth", e.target.value ? Number(e.target.value) : undefined)} placeholder="Net Worth" />
                        <Input className="text-xs h-8" type="number" value={item.liquidity ?? ""} onChange={(e) => update("liquidity", e.target.value ? Number(e.target.value) : undefined)} placeholder="Liquidity" />
                        <Input className="text-xs h-8" type="number" value={item.credit_score ?? ""} onChange={(e) => update("credit_score", e.target.value ? Number(e.target.value) : undefined)} placeholder="FICO" />
                      </div>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Business Plan & Exit */}
          <AccordionItem value="business_plan" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Business Plan & Exit Strategy
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="inline-field-label">Business Plan</span>
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={memo.business_plan_narrative ?? ""}
                    onChange={(e) => updateField("business_plan_narrative", e.target.value)}
                    placeholder="Business plan description..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-field-label">Exit Strategy</span>
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={memo.exit_strategy_narrative ?? ""}
                    onChange={(e) => updateField("exit_strategy_narrative", e.target.value)}
                    placeholder="Exit strategy details..."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Stress Testing */}
          <AccordionItem value="stress" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Stress Testing
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <DynamicRows<StressScenario>
                  items={(memo.stress_scenarios as StressScenario[]) ?? []}
                  onUpdate={(items) => updateField("stress_scenarios", items)}
                  newItem={() => ({ scenario: "", assumption: "", dscr: 0, result: "pass" as const })}
                  label="Scenario"
                  renderRow={(item, _idx, update) => (
                    <div className="grid grid-cols-4 gap-2">
                      <Input className="text-xs h-8" value={item.scenario ?? ""} onChange={(e) => update("scenario", e.target.value)} placeholder="Scenario" />
                      <Input className="text-xs h-8" value={item.assumption ?? ""} onChange={(e) => update("assumption", e.target.value)} placeholder="Assumption" />
                      <Input className="text-xs h-8" type="number" step="0.01" value={item.dscr ?? ""} onChange={(e) => update("dscr", Number(e.target.value))} placeholder="DSCR" />
                      <Select value={item.result ?? "pass"} onValueChange={(v) => update("result", v)}>
                        <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="marginal">Marginal</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <Textarea
                  className="min-h-[60px] text-sm"
                  value={memo.stress_narrative ?? ""}
                  onChange={(e) => updateField("stress_narrative", e.target.value)}
                  placeholder="Stress testing narrative..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Risk Factors */}
          <AccordionItem value="risk" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Risk Factors
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <DynamicRows<RiskFactor>
                  items={(memo.risk_factors as RiskFactor[]) ?? []}
                  onUpdate={(items) => updateField("risk_factors", items)}
                  newItem={() => ({ risk: "", mitigant: "" })}
                  label="Risk"
                  renderRow={(item, _idx, update) => (
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="text-xs h-8" value={item.risk ?? ""} onChange={(e) => update("risk", e.target.value)} placeholder="Risk" />
                      <Input className="text-xs h-8" value={item.mitigant ?? ""} onChange={(e) => update("mitigant", e.target.value)} placeholder="Mitigant" />
                    </div>
                  )}
                />
                <Textarea
                  className="min-h-[60px] text-sm"
                  value={memo.portfolio_impact_narrative ?? ""}
                  onChange={(e) => updateField("portfolio_impact_narrative", e.target.value)}
                  placeholder="Portfolio impact narrative..."
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Fee Income */}
          <AccordionItem value="fees" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Fee Income
            </AccordionTrigger>
            <AccordionContent>
              <DynamicRows<FeeIncome>
                items={(memo.fee_income as FeeIncome[]) ?? []}
                onUpdate={(items) => updateField("fee_income", items)}
                newItem={() => ({ label: "", amount: 0 })}
                label="Fee"
                renderRow={(item, _idx, update) => (
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="text-xs h-8" value={item.label ?? ""} onChange={(e) => update("label", e.target.value)} placeholder="Fee type" />
                    <Input className="text-xs h-8 num" type="number" value={item.amount ?? ""} onChange={(e) => update("amount", Number(e.target.value))} placeholder="$0" />
                  </div>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 8. Conditions & Covenants */}
          <AccordionItem value="conditions" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold py-3">
              Conditions & Covenants
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="inline-field-label">Conditions Precedent</span>
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={((memo.conditions_precedent as string[]) ?? []).join("\n")}
                    onChange={(e) => updateField("conditions_precedent", e.target.value.split("\n").filter(Boolean))}
                    placeholder="One condition per line..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-field-label">Ongoing Covenants</span>
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={((memo.ongoing_covenants as string[]) ?? []).join("\n")}
                    onChange={(e) => updateField("ongoing_covenants", e.target.value.split("\n").filter(Boolean))}
                    placeholder="One covenant per line..."
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-field-label">Committee Notes</span>
                  <Textarea
                    className="min-h-[60px] text-sm"
                    value={memo.committee_notes ?? ""}
                    onChange={(e) => updateField("committee_notes", e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </CollapsibleSection>
  );
}
