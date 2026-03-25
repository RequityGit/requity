"use client";

import React, { useState, useCallback } from "react";
import {
  FileText,
  Presentation,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollapsibleSection } from "./CollapsibleSection";
import { useCreditMemo } from "./useCreditMemo";
import { useInvestorDeck } from "./useInvestorDeck";
import {
  showSuccess,
  showError,
  showLoading,
  resolveLoading,
  rejectLoading,
} from "@/lib/toast";
import type {
  DealDocData,
  RiskFactor,
  StressScenario,
  FeeIncome,
  GuarantorDetail,
} from "@/lib/docgen/types";

interface DealDocumentsSectionProps {
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
  renderRow: (
    item: T,
    idx: number,
    update: (field: string, val: unknown) => void
  ) => React.ReactNode;
  newItem: () => T;
  label: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <div className="flex-1">
            {renderRow(item, idx, (field, val) => {
              const updated = [...items];
              updated[idx] = { ...updated[idx], [field]: val };
              onUpdate(updated);
            })}
          </div>
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

export function DealDocumentsSection({
  dealId,
  dealDocData,
}: DealDocumentsSectionProps) {
  const {
    memo,
    loading: memoLoading,
    saving: memoSaving,
    updateField: updateMemoField,
    saveNow: saveMemoNow,
    createDraft: createMemoDraft,
  } = useCreditMemo(dealId);
  const {
    deck,
    loading: deckLoading,
    saving: deckSaving,
    updateField: updateDeckField,
    saveNow: saveDeckNow,
    createDraft: createDeckDraft,
  } = useInvestorDeck(dealId);

  const [generating, setGenerating] = useState<
    "credit_memo" | "investor_summary" | null
  >(null);
  const [drafting, setDrafting] = useState(false);

  const loading = memoLoading || deckLoading;
  const saving = memoSaving || deckSaving;
  const hasDrafts = !!memo || !!deck;

  // ─── Create both drafts ───
  const handleCreateDrafts = useCallback(async () => {
    const tasks: Promise<void>[] = [];
    if (!memo) tasks.push(createMemoDraft());
    if (!deck) tasks.push(createDeckDraft());
    await Promise.allSettled(tasks);
  }, [memo, deck, createMemoDraft, createDeckDraft]);

  // ─── Unified AI Draft ───
  const handleDraftWithAI = useCallback(async () => {
    setDrafting(true);
    try {
      // Ensure both drafts exist first
      if (!memo || !deck) {
        const tasks: Promise<void>[] = [];
        if (!memo) tasks.push(createMemoDraft());
        if (!deck) tasks.push(createDeckDraft());
        await Promise.allSettled(tasks);
        // Small delay to allow hooks to settle
        await new Promise((r) => setTimeout(r, 300));
      }

      const res = await fetch(`/api/deals/${dealId}/draft-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: "unified" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI draft failed");
      }
      const data = await res.json();

      // Populate credit memo fields
      const memoData = data.credit_memo || data;
      const memoNarrativeFields = [
        "recommendation",
        "recommendation_narrative",
        "risk_rating",
        "property_condition_narrative",
        "business_plan_narrative",
        "exit_strategy_narrative",
        "stress_narrative",
        "metrics_exceptions_narrative",
        "portfolio_impact_narrative",
        "sponsor_track_record_narrative",
      ];
      memoNarrativeFields.forEach((field) => {
        if (memoData[field]) updateMemoField(field, memoData[field]);
      });
      const memoStructuredFields = [
        "stress_scenarios",
        "risk_factors",
        "conditions_precedent",
        "ongoing_covenants",
      ];
      memoStructuredFields.forEach((field) => {
        if (memoData[field]) updateMemoField(field, memoData[field]);
      });

      // Populate investor summary fields
      const deckData = data.investor_summary || data;
      const deckFields = [
        "executive_summary",
        "property_overview_narrative",
        "market_analysis_narrative",
        "value_add_narrative",
        "investment_terms_narrative",
      ];
      deckFields.forEach((field) => {
        if (deckData[field]) updateDeckField(field, deckData[field]);
      });

      showSuccess("AI draft generated. Review and edit before saving.");
    } catch (err) {
      showError("Could not generate AI draft", err);
    } finally {
      setDrafting(false);
    }
  }, [
    dealId,
    memo,
    deck,
    createMemoDraft,
    createDeckDraft,
    updateMemoField,
    updateDeckField,
  ]);

  // ─── Generate Credit Memo DOCX ───
  const handleGenerateMemo = useCallback(async () => {
    if (!memo) return;
    setGenerating("credit_memo");
    const toastId = showLoading("Generating credit memo...");
    try {
      await saveMemoNow();
      const { generateCreditMemo } = await import(
        "@/lib/docgen/generate-credit-memo"
      );
      await generateCreditMemo({ deal: dealDocData, memo });
      resolveLoading(toastId, "Credit memo downloaded");
    } catch (err) {
      rejectLoading(toastId, "Could not generate credit memo", err);
    } finally {
      setGenerating(null);
    }
  }, [dealDocData, memo, saveMemoNow]);

  // ─── Generate Investor Deck PPTX ───
  const handleGenerateInvestorDeck = useCallback(async () => {
    setGenerating("investor_summary");
    const toastId = showLoading("Generating investor deck...");
    try {
      await saveDeckNow();
      const { generateInvestorDeck } = await import(
        "@/lib/docgen/generate-investor-deck"
      );
      await generateInvestorDeck({ deal: dealDocData, deck });
      resolveLoading(toastId, "Investor deck downloaded");
    } catch (err) {
      rejectLoading(toastId, "Could not generate investor deck", err);
    } finally {
      setGenerating(null);
    }
  }, [dealDocData, deck, saveDeckNow]);

  // ─── Section counts ───
  const memoNarrativeKeys = [
    "recommendation_narrative",
    "property_condition_narrative",
    "business_plan_narrative",
    "exit_strategy_narrative",
    "stress_narrative",
    "sponsor_track_record_narrative",
    "portfolio_impact_narrative",
    "metrics_exceptions_narrative",
  ];
  const memoCompletedCount = memo
    ? memoNarrativeKeys.filter(
        (k) => !!(memo as unknown as Record<string, unknown>)[k]
      ).length
    : 0;

  const deckNarrativeKeys = [
    "executive_summary",
    "property_overview_narrative",
    "market_analysis_narrative",
    "value_add_narrative",
    "investment_terms_narrative",
  ];
  const deckCompletedCount = deck
    ? deckNarrativeKeys.filter(
        (k) => !!(deck as unknown as Record<string, unknown>)[k]
      ).length
    : 0;

  // ─── Status badges ───
  const memoBadge = memo ? (
    <Badge
      variant={memo.status === "approved" ? "default" : "outline"}
      className="text-[10px]"
    >
      v{memo.version}{" "}
      {memo.status === "draft"
        ? "Draft"
        : memo.status === "in_review"
          ? "In Review"
          : memo.status === "approved"
            ? "Approved"
            : "Superseded"}
    </Badge>
  ) : null;

  const saveIndicator = saving ? (
    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
    </span>
  ) : hasDrafts ? (
    <span className="text-[11px] text-muted-foreground">Saved</span>
  ) : null;

  const actions = (
    <div className="flex items-center gap-2">
      {saveIndicator}
      {memoBadge}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleDraftWithAI}
              disabled={drafting}
            >
              {drafting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1" />
              )}
              Draft with AI
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Generate all narratives for both documents
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        variant="default"
        size="sm"
        className="h-7 text-xs"
        onClick={handleGenerateMemo}
        disabled={!memo || !!generating}
      >
        {generating === "credit_memo" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <FileText className="h-3.5 w-3.5 mr-1" />
        )}
        Generate DOCX
      </Button>
      <Button
        variant="default"
        size="sm"
        className="h-7 text-xs"
        onClick={handleGenerateInvestorDeck}
        disabled={!deck || !!generating}
      >
        {generating === "investor_summary" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <Presentation className="h-3.5 w-3.5 mr-1" />
        )}
        Generate PPTX
      </Button>
    </div>
  );

  if (loading) {
    return (
      <CollapsibleSection
        icon={FileText}
        title="Deal Documents"
        defaultOpen={false}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      icon={FileText}
      title="Deal Documents"
      defaultOpen={false}
      actions={actions}
    >
      {!hasDrafts ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">
            No document drafts yet for this deal.
          </p>
          <Button variant="outline" size="sm" onClick={handleCreateDrafts}>
            Create Document Drafts
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="credit_memo" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="credit_memo" className="text-xs">
              Credit Memo ({memoCompletedCount}/{memoNarrativeKeys.length})
            </TabsTrigger>
            <TabsTrigger value="investor_summary" className="text-xs">
              Investor Summary ({deckCompletedCount}/{deckNarrativeKeys.length})
            </TabsTrigger>
          </TabsList>

          {/* ─── Credit Memo Tab ─── */}
          <TabsContent value="credit_memo">
            {!memo ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-muted-foreground">
                  No credit memo draft yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createMemoDraft}
                >
                  Create Credit Memo Draft
                </Button>
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={["recommendation"]}
                className="space-y-2"
              >
                {/* 1. Recommendation */}
                <AccordionItem
                  value="recommendation"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Recommendation & Status
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <span className="inline-field-label">Status</span>
                          <Select
                            value={memo.status}
                            onValueChange={(v) =>
                              updateMemoField("status", v)
                            }
                          >
                            <SelectTrigger className="text-sm h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="in_review">
                                In Review
                              </SelectItem>
                              <SelectItem value="approved">
                                Approved
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <span className="inline-field-label">
                            Recommendation
                          </span>
                          <Select
                            value={memo.recommendation ?? "approve"}
                            onValueChange={(v) =>
                              updateMemoField("recommendation", v)
                            }
                          >
                            <SelectTrigger className="text-sm h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approve">Approve</SelectItem>
                              <SelectItem value="approve_with_conditions">
                                Approve with Conditions
                              </SelectItem>
                              <SelectItem value="decline">Decline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <span className="inline-field-label">
                            Risk Rating
                          </span>
                          <Select
                            value={memo.risk_rating ?? "green"}
                            onValueChange={(v) =>
                              updateMemoField("risk_rating", v)
                            }
                          >
                            <SelectTrigger className="text-sm h-8">
                              <SelectValue />
                            </SelectTrigger>
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
                        onChange={(e) =>
                          updateMemoField(
                            "recommendation_narrative",
                            e.target.value
                          )
                        }
                        placeholder="Recommendation narrative..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Property & Market */}
                <AccordionItem
                  value="property"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Property & Market
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Property Condition
                        </span>
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={memo.property_condition_narrative ?? ""}
                          onChange={(e) =>
                            updateMemoField(
                              "property_condition_narrative",
                              e.target.value
                            )
                          }
                          placeholder="Property condition assessment..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Metrics Exceptions
                        </span>
                        <Textarea
                          className="min-h-[60px] text-sm"
                          value={memo.metrics_exceptions_narrative ?? ""}
                          onChange={(e) =>
                            updateMemoField(
                              "metrics_exceptions_narrative",
                              e.target.value
                            )
                          }
                          placeholder="Any exceptions to standard metrics guidelines..."
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Sponsor & Guarantor */}
                <AccordionItem
                  value="sponsor"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Sponsor & Guarantor
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Track Record
                        </span>
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={memo.sponsor_track_record_narrative ?? ""}
                          onChange={(e) =>
                            updateMemoField(
                              "sponsor_track_record_narrative",
                              e.target.value
                            )
                          }
                          placeholder="Sponsor experience and track record..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Guarantor Details
                        </span>
                        <DynamicRows<GuarantorDetail>
                          items={
                            (memo.guarantor_details as GuarantorDetail[]) ?? []
                          }
                          onUpdate={(items) =>
                            updateMemoField("guarantor_details", items)
                          }
                          newItem={() => ({
                            name: "",
                            ownership_pct: undefined,
                            net_worth: undefined,
                            liquidity: undefined,
                            credit_score: undefined,
                          })}
                          label="Guarantor"
                          renderRow={(item, _idx, update) => (
                            <div className="grid grid-cols-5 gap-2">
                              <Input
                                className="text-xs h-8"
                                value={item.name ?? ""}
                                onChange={(e) =>
                                  update("name", e.target.value)
                                }
                                placeholder="Name"
                              />
                              <Input
                                className="text-xs h-8"
                                type="number"
                                value={item.ownership_pct ?? ""}
                                onChange={(e) =>
                                  update(
                                    "ownership_pct",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder="Own %"
                              />
                              <Input
                                className="text-xs h-8"
                                type="number"
                                value={item.net_worth ?? ""}
                                onChange={(e) =>
                                  update(
                                    "net_worth",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder="Net Worth"
                              />
                              <Input
                                className="text-xs h-8"
                                type="number"
                                value={item.liquidity ?? ""}
                                onChange={(e) =>
                                  update(
                                    "liquidity",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder="Liquidity"
                              />
                              <Input
                                className="text-xs h-8"
                                type="number"
                                value={item.credit_score ?? ""}
                                onChange={(e) =>
                                  update(
                                    "credit_score",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                                placeholder="FICO"
                              />
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Business Plan & Exit */}
                <AccordionItem
                  value="business_plan"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Business Plan & Exit Strategy
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Business Plan
                        </span>
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={memo.business_plan_narrative ?? ""}
                          onChange={(e) =>
                            updateMemoField(
                              "business_plan_narrative",
                              e.target.value
                            )
                          }
                          placeholder="Business plan description..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Exit Strategy
                        </span>
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={memo.exit_strategy_narrative ?? ""}
                          onChange={(e) =>
                            updateMemoField(
                              "exit_strategy_narrative",
                              e.target.value
                            )
                          }
                          placeholder="Exit strategy details..."
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Stress Testing */}
                <AccordionItem
                  value="stress"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Stress Testing
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <DynamicRows<StressScenario>
                        items={
                          (memo.stress_scenarios as StressScenario[]) ?? []
                        }
                        onUpdate={(items) =>
                          updateMemoField("stress_scenarios", items)
                        }
                        newItem={() => ({
                          scenario: "",
                          assumption: "",
                          dscr: 0,
                          result: "pass" as const,
                        })}
                        label="Scenario"
                        renderRow={(item, _idx, update) => (
                          <div className="grid grid-cols-4 gap-2">
                            <Input
                              className="text-xs h-8"
                              value={item.scenario ?? ""}
                              onChange={(e) =>
                                update("scenario", e.target.value)
                              }
                              placeholder="Scenario"
                            />
                            <Input
                              className="text-xs h-8"
                              value={item.assumption ?? ""}
                              onChange={(e) =>
                                update("assumption", e.target.value)
                              }
                              placeholder="Assumption"
                            />
                            <Input
                              className="text-xs h-8"
                              type="number"
                              step="0.01"
                              value={item.dscr ?? ""}
                              onChange={(e) =>
                                update("dscr", Number(e.target.value))
                              }
                              placeholder="DSCR"
                            />
                            <Select
                              value={item.result ?? "pass"}
                              onValueChange={(v) => update("result", v)}
                            >
                              <SelectTrigger className="text-xs h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pass">Pass</SelectItem>
                                <SelectItem value="marginal">
                                  Marginal
                                </SelectItem>
                                <SelectItem value="fail">Fail</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      />
                      <Textarea
                        className="min-h-[60px] text-sm"
                        value={memo.stress_narrative ?? ""}
                        onChange={(e) =>
                          updateMemoField("stress_narrative", e.target.value)
                        }
                        placeholder="Stress testing narrative..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 6. Risk Factors */}
                <AccordionItem
                  value="risk"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Risk Factors
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <DynamicRows<RiskFactor>
                        items={(memo.risk_factors as RiskFactor[]) ?? []}
                        onUpdate={(items) =>
                          updateMemoField("risk_factors", items)
                        }
                        newItem={() => ({ risk: "", mitigant: "" })}
                        label="Risk"
                        renderRow={(item, _idx, update) => (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              className="text-xs h-8"
                              value={item.risk ?? ""}
                              onChange={(e) => update("risk", e.target.value)}
                              placeholder="Risk"
                            />
                            <Input
                              className="text-xs h-8"
                              value={item.mitigant ?? ""}
                              onChange={(e) =>
                                update("mitigant", e.target.value)
                              }
                              placeholder="Mitigant"
                            />
                          </div>
                        )}
                      />
                      <Textarea
                        className="min-h-[60px] text-sm"
                        value={memo.portfolio_impact_narrative ?? ""}
                        onChange={(e) =>
                          updateMemoField(
                            "portfolio_impact_narrative",
                            e.target.value
                          )
                        }
                        placeholder="Portfolio impact narrative..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 7. Fee Income */}
                <AccordionItem
                  value="fees"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Fee Income
                  </AccordionTrigger>
                  <AccordionContent>
                    <DynamicRows<FeeIncome>
                      items={(memo.fee_income as FeeIncome[]) ?? []}
                      onUpdate={(items) =>
                        updateMemoField("fee_income", items)
                      }
                      newItem={() => ({ label: "", amount: 0 })}
                      label="Fee"
                      renderRow={(item, _idx, update) => (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            className="text-xs h-8"
                            value={item.label ?? ""}
                            onChange={(e) => update("label", e.target.value)}
                            placeholder="Fee type"
                          />
                          <Input
                            className="text-xs h-8 num"
                            type="number"
                            value={item.amount ?? ""}
                            onChange={(e) =>
                              update("amount", Number(e.target.value))
                            }
                            placeholder="$0"
                          />
                        </div>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* 8. Conditions & Covenants */}
                <AccordionItem
                  value="conditions"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Conditions & Covenants
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Conditions Precedent
                        </span>
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={(
                            (memo.conditions_precedent as string[]) ?? []
                          ).join("\n")}
                          onChange={(e) =>
                            updateMemoField(
                              "conditions_precedent",
                              e.target.value.split("\n").filter(Boolean)
                            )
                          }
                          placeholder="One condition per line..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Ongoing Covenants
                        </span>
                        <Textarea
                          className="min-h-[80px] text-sm"
                          value={(
                            (memo.ongoing_covenants as string[]) ?? []
                          ).join("\n")}
                          onChange={(e) =>
                            updateMemoField(
                              "ongoing_covenants",
                              e.target.value.split("\n").filter(Boolean)
                            )
                          }
                          placeholder="One covenant per line..."
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-field-label">
                          Committee Notes
                        </span>
                        <Textarea
                          className="min-h-[60px] text-sm"
                          value={memo.committee_notes ?? ""}
                          onChange={(e) =>
                            updateMemoField("committee_notes", e.target.value)
                          }
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </TabsContent>

          {/* ─── Investor Summary Tab ─── */}
          <TabsContent value="investor_summary">
            {!deck ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-muted-foreground">
                  No investor summary draft yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createDeckDraft}
                >
                  Create Investor Summary Draft
                </Button>
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={["executive_summary"]}
                className="space-y-2"
              >
                <AccordionItem
                  value="executive_summary"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Executive Summary
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      className="min-h-[120px] text-sm"
                      value={deck.executive_summary ?? ""}
                      onChange={(e) =>
                        updateDeckField("executive_summary", e.target.value)
                      }
                      placeholder="Overview of the investment opportunity..."
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="property_overview"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Property Overview
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      className="min-h-[100px] text-sm"
                      value={deck.property_overview_narrative ?? ""}
                      onChange={(e) =>
                        updateDeckField(
                          "property_overview_narrative",
                          e.target.value
                        )
                      }
                      placeholder="Property description, condition, and features..."
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="market_analysis"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Market Analysis
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      className="min-h-[100px] text-sm"
                      value={deck.market_analysis_narrative ?? ""}
                      onChange={(e) =>
                        updateDeckField(
                          "market_analysis_narrative",
                          e.target.value
                        )
                      }
                      placeholder="Location context, demand drivers, supply dynamics..."
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="value_add"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Value-Add Opportunity
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      className="min-h-[100px] text-sm"
                      value={deck.value_add_narrative ?? ""}
                      onChange={(e) =>
                        updateDeckField("value_add_narrative", e.target.value)
                      }
                      placeholder="Upside items not included in base underwriting..."
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="investment_terms"
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="text-sm font-semibold py-3">
                    Investment Terms
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <Textarea
                        className="min-h-[80px] text-sm"
                        value={deck.investment_terms_narrative ?? ""}
                        onChange={(e) =>
                          updateDeckField(
                            "investment_terms_narrative",
                            e.target.value
                          )
                        }
                        placeholder="How investors participate, return structure..."
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="inline-field-label">
                            Minimum Investment
                          </span>
                          <Input
                            type="number"
                            className="text-sm"
                            value={deck.minimum_investment ?? ""}
                            onChange={(e) =>
                              updateDeckField(
                                "minimum_investment",
                                e.target.value
                                  ? Number(e.target.value)
                                  : null
                              )
                            }
                            placeholder="$0"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-field-label">
                            Target Return
                          </span>
                          <Input
                            className="text-sm"
                            value={deck.target_return ?? ""}
                            onChange={(e) =>
                              updateDeckField("target_return", e.target.value)
                            }
                            placeholder="e.g., 12-15% IRR"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-field-label">
                            Fund Name
                          </span>
                          <Input
                            className="text-sm"
                            value={deck.fund_name ?? ""}
                            onChange={(e) =>
                              updateDeckField("fund_name", e.target.value)
                            }
                            placeholder="Fund / vehicle name"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-field-label">
                            Investment Structure
                          </span>
                          <Input
                            className="text-sm"
                            value={deck.investment_structure ?? ""}
                            onChange={(e) =>
                              updateDeckField(
                                "investment_structure",
                                e.target.value
                              )
                            }
                            placeholder="e.g., LP Interest, Note"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      )}
    </CollapsibleSection>
  );
}
