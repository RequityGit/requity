/**
 * AI prompt templates for document narrative drafting.
 */

export function buildCreditMemoPrompt(dealData: Record<string, unknown>): string {
  return `You are a senior underwriter at Requity Lending LLC, a commercial bridge lender specializing in value-add real estate.
Generate credit memorandum content for the following deal.

Write in a direct, professional tone appropriate for a credit committee presentation.
Do not use em dashes. Use commas, periods, or semicolons instead.
Do not use flowery or marketing language.
Be specific with numbers and data points from the deal.
Flag any data gaps as [TBD].

DEAL DATA:
${JSON.stringify(dealData, null, 2)}

Generate the following as a JSON object. Each narrative field should be 2-4 paragraphs.
Structured arrays should have realistic entries based on the deal data.

{
  "recommendation": "approve" or "approve_with_conditions" or "decline",
  "risk_rating": "green" or "yellow" or "red",
  "recommendation_narrative": "2-3 paragraph formal recommendation...",
  "property_condition_narrative": "2-3 paragraphs on property condition, improvements needed...",
  "business_plan_narrative": "2-3 paragraphs on the borrower's business plan...",
  "exit_strategy_narrative": "1-2 paragraphs on the exit strategy...",
  "stress_narrative": "1-2 paragraphs summarizing stress test results...",
  "metrics_exceptions_narrative": "1 paragraph on any metrics outside guidelines, or null if all pass...",
  "portfolio_impact_narrative": "1-2 paragraphs on portfolio concentration and impact...",
  "sponsor_track_record_narrative": "2-3 paragraphs on sponsor experience...",
  "stress_scenarios": [
    {"scenario": "Base Case", "assumption": "Current terms", "dscr": 1.25, "result": "pass"},
    {"scenario": "Rate Stress +200bps", "assumption": "+200bps rate increase", "dscr": 1.05, "result": "marginal"},
    {"scenario": "Occupancy -10%", "assumption": "10% occupancy decline", "dscr": 1.10, "result": "pass"},
    {"scenario": "Combined Adverse", "assumption": "Rate +200bps + Occ -10%", "dscr": 0.90, "result": "fail"}
  ],
  "risk_factors": [
    {"risk": "key risk 1", "mitigant": "how it is mitigated"},
    {"risk": "key risk 2", "mitigant": "how it is mitigated"}
  ],
  "conditions_precedent": ["condition 1", "condition 2", "condition 3"],
  "ongoing_covenants": ["covenant 1", "covenant 2"]
}

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;
}

export function buildInvestorDeckPrompt(dealData: Record<string, unknown>): string {
  return `You are a capital markets professional at Requity Group, preparing an investor pitch deck for a real estate investment opportunity.
Generate narrative content for investor deck slides based on the following deal data.

Write in a professional but compelling tone appropriate for institutional and accredited investors.
Do not use em dashes. Use commas, periods, or semicolons instead.
Be specific with numbers and data points.
Focus on the investment thesis, not the lending mechanics.
Flag any data gaps as [TBD].

DEAL DATA:
${JSON.stringify(dealData, null, 2)}

Generate the following as a JSON object. Each field should be 2-3 paragraphs of polished content.

{
  "executive_summary": "2-3 paragraph overview of the investment opportunity, key highlights, and investment thesis...",
  "property_overview_narrative": "2 paragraphs describing the property, its features, condition, and competitive advantages...",
  "market_analysis_narrative": "2-3 paragraphs on the local market, demand drivers, supply dynamics, and demographic trends...",
  "value_add_narrative": "2 paragraphs on value creation opportunities, operational improvements, and upside potential...",
  "investment_terms_narrative": "1-2 paragraphs on how investors can participate, return expectations, and fund structure..."
}

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;
}

export function buildUnifiedDraftPrompt(dealData: Record<string, unknown>): string {
  return `You are preparing deal documents for Requity Group, a commercial bridge lender and real estate investment firm.
Generate content for TWO documents based on the same deal: (1) an internal credit memorandum for the credit committee, and (2) an investor-facing investment summary.

CREDIT MEMO sections: Write in a direct, professional tone appropriate for a credit committee. Be analytical, flag risks clearly, and support assertions with data.
INVESTOR SUMMARY sections: Write in a professional but compelling tone appropriate for institutional and accredited investors. Focus on the investment thesis and opportunity, not lending mechanics.

Shared rules for ALL sections:
- Do not use em dashes. Use commas, periods, or semicolons instead.
- Be specific with numbers and data points from the deal.
- Flag any data gaps as [TBD].
- Each narrative should be 2-4 paragraphs.

DEAL DATA:
${JSON.stringify(dealData, null, 2)}

Generate the following as a JSON object with two top-level keys: "credit_memo" and "investor_summary".

{
  "credit_memo": {
    "recommendation": "approve" or "approve_with_conditions" or "decline",
    "risk_rating": "green" or "yellow" or "red",
    "recommendation_narrative": "2-3 paragraph formal recommendation...",
    "property_condition_narrative": "2-3 paragraphs on property condition, improvements needed...",
    "business_plan_narrative": "2-3 paragraphs on the borrower's business plan...",
    "exit_strategy_narrative": "1-2 paragraphs on the exit strategy...",
    "stress_narrative": "1-2 paragraphs summarizing stress test results...",
    "metrics_exceptions_narrative": "1 paragraph on any metrics outside guidelines, or null if all pass...",
    "portfolio_impact_narrative": "1-2 paragraphs on portfolio concentration and impact...",
    "sponsor_track_record_narrative": "2-3 paragraphs on sponsor experience...",
    "stress_scenarios": [
      {"scenario": "Base Case", "assumption": "Current terms", "dscr": 1.25, "result": "pass"},
      {"scenario": "Rate Stress +200bps", "assumption": "+200bps rate increase", "dscr": 1.05, "result": "marginal"},
      {"scenario": "Occupancy -10%", "assumption": "10% occupancy decline", "dscr": 1.10, "result": "pass"},
      {"scenario": "Combined Adverse", "assumption": "Rate +200bps + Occ -10%", "dscr": 0.90, "result": "fail"}
    ],
    "risk_factors": [
      {"risk": "key risk 1", "mitigant": "how it is mitigated"},
      {"risk": "key risk 2", "mitigant": "how it is mitigated"}
    ],
    "conditions_precedent": ["condition 1", "condition 2", "condition 3"],
    "ongoing_covenants": ["covenant 1", "covenant 2"]
  },
  "investor_summary": {
    "executive_summary": "2-3 paragraph overview of the investment opportunity, key highlights, and investment thesis...",
    "property_overview_narrative": "2 paragraphs describing the property, its features, condition, and competitive advantages...",
    "market_analysis_narrative": "2-3 paragraphs on the local market, demand drivers, supply dynamics, and demographic trends...",
    "value_add_narrative": "2 paragraphs on value creation opportunities, operational improvements, and upside potential...",
    "investment_terms_narrative": "1-2 paragraphs on how investors can participate, return expectations, and fund structure..."
  }
}

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;
}

export function buildSectionPrompt(
  section: string,
  documentType: "credit_memo" | "investor_deck",
  dealData: Record<string, unknown>
): string {
  const role = documentType === "credit_memo"
    ? "a senior underwriter at Requity Lending LLC"
    : "a capital markets professional at Requity Group";

  return `You are ${role}.
Regenerate ONLY the "${section}" section based on this deal data.
Write 2-3 paragraphs in a direct, professional tone.
Do not use em dashes. Use commas, periods, or semicolons instead.
Be specific with numbers from the deal.
Flag any data gaps as [TBD].

DEAL DATA:
${JSON.stringify(dealData, null, 2)}

Return ONLY the text content for the "${section}" field. No JSON wrapper, no field name, just the narrative text.`;
}
