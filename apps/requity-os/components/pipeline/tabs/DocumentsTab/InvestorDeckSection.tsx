"use client";

import React, { useState, useCallback } from "react";
import { Presentation, Sparkles, Loader2, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useInvestorDeck } from "./useInvestorDeck";
import { showSuccess, showError, showLoading, resolveLoading, rejectLoading } from "@/lib/toast";
import type { DealDocData } from "@/lib/docgen/types";

interface InvestorDeckSectionProps {
  dealId: string;
  dealDocData: DealDocData;
}

export function InvestorDeckSection({ dealId, dealDocData }: InvestorDeckSectionProps) {
  const { deck, loading, saving, updateField, saveNow, createDraft } = useInvestorDeck(dealId);
  const [generating, setGenerating] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    const toastId = showLoading("Generating investor deck...");
    try {
      await saveNow();
      const { generateInvestorDeck } = await import("@/lib/docgen/generate-investor-deck");
      await generateInvestorDeck({ deal: dealDocData, deck });
      resolveLoading(toastId, "Investor deck downloaded");
    } catch (err) {
      rejectLoading(toastId, "Could not generate investor deck", err);
    } finally {
      setGenerating(false);
    }
  }, [dealDocData, deck, saveNow]);

  const handleDraftWithAI = useCallback(async () => {
    setDrafting(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/draft-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: "investor_deck" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI draft failed");
      }
      const data = await res.json();
      // Populate fields from AI response
      if (data.executive_summary) updateField("executive_summary", data.executive_summary);
      if (data.property_overview_narrative) updateField("property_overview_narrative", data.property_overview_narrative);
      if (data.market_analysis_narrative) updateField("market_analysis_narrative", data.market_analysis_narrative);
      if (data.value_add_narrative) updateField("value_add_narrative", data.value_add_narrative);
      if (data.investment_terms_narrative) updateField("investment_terms_narrative", data.investment_terms_narrative);
      showSuccess("AI draft generated. Review and edit before saving.");
    } catch (err) {
      showError("Could not generate AI draft", err);
    } finally {
      setDrafting(false);
    }
  }, [dealId, updateField]);

  const statusBadge = deck ? (
    <Badge
      variant={deck.status === "approved" ? "default" : "outline"}
      className="text-[10px]"
    >
      {deck.status === "draft" ? "Draft" : deck.status === "in_review" ? "In Review" : deck.status === "approved" ? "Approved" : "Superseded"}
    </Badge>
  ) : null;

  const saveIndicator = saving ? (
    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
    </span>
  ) : deck ? (
    <span className="text-[11px] text-muted-foreground">Saved</span>
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
              disabled={drafting || !deck}
            >
              {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Draft with AI
            </Button>
          </TooltipTrigger>
          {!deck && (
            <TooltipContent>Create a draft first</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <Button
        variant="default"
        size="sm"
        className="h-7 text-xs"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Presentation className="h-3.5 w-3.5 mr-1" />}
        Generate PPTX
      </Button>
    </div>
  );

  if (loading) {
    return (
      <CollapsibleSection icon={Presentation} title="Investor Deck" defaultOpen={false}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection icon={Presentation} title="Investor Deck" defaultOpen={false} actions={actions}>
      {!deck ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">No investor deck content yet for this deal.</p>
          <Button variant="outline" size="sm" onClick={createDraft}>
            Create Investor Deck Draft
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Accordion type="multiple" defaultValue={["executive_summary"]} className="space-y-2">
            <AccordionItem value="executive_summary" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">
                Executive Summary
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  className="min-h-[120px] text-sm"
                  value={deck.executive_summary ?? ""}
                  onChange={(e) => updateField("executive_summary", e.target.value)}
                  placeholder="Overview of the investment opportunity..."
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="property_overview" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">
                Property Overview
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  className="min-h-[100px] text-sm"
                  value={deck.property_overview_narrative ?? ""}
                  onChange={(e) => updateField("property_overview_narrative", e.target.value)}
                  placeholder="Property description, condition, and features..."
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="market_analysis" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">
                Market Analysis
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  className="min-h-[100px] text-sm"
                  value={deck.market_analysis_narrative ?? ""}
                  onChange={(e) => updateField("market_analysis_narrative", e.target.value)}
                  placeholder="Location context, demand drivers, supply dynamics..."
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="value_add" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">
                Value-Add Opportunity
              </AccordionTrigger>
              <AccordionContent>
                <Textarea
                  className="min-h-[100px] text-sm"
                  value={deck.value_add_narrative ?? ""}
                  onChange={(e) => updateField("value_add_narrative", e.target.value)}
                  placeholder="Upside items not included in base underwriting..."
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="investment_terms" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">
                Investment Terms
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <Textarea
                    className="min-h-[80px] text-sm"
                    value={deck.investment_terms_narrative ?? ""}
                    onChange={(e) => updateField("investment_terms_narrative", e.target.value)}
                    placeholder="How investors participate, return structure..."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="inline-field-label">Minimum Investment</span>
                      <Input
                        type="number"
                        className="text-sm"
                        value={deck.minimum_investment ?? ""}
                        onChange={(e) => updateField("minimum_investment", e.target.value ? Number(e.target.value) : null)}
                        placeholder="$0"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-field-label">Target Return</span>
                      <Input
                        className="text-sm"
                        value={deck.target_return ?? ""}
                        onChange={(e) => updateField("target_return", e.target.value)}
                        placeholder="e.g., 12-15% IRR"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-field-label">Fund Name</span>
                      <Input
                        className="text-sm"
                        value={deck.fund_name ?? ""}
                        onChange={(e) => updateField("fund_name", e.target.value)}
                        placeholder="Fund / vehicle name"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-field-label">Investment Structure</span>
                      <Input
                        className="text-sm"
                        value={deck.investment_structure ?? ""}
                        onChange={(e) => updateField("investment_structure", e.target.value)}
                        placeholder="e.g., LP Interest, Note"
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </CollapsibleSection>
  );
}
