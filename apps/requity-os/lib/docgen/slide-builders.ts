/**
 * Individual slide builder functions for the Investor Deck (PPTX).
 * Each function adds one slide to the presentation.
 *
 * Brand rules: Georgia headings, Calibri body, navy/gold/cream colors.
 * These are for the GENERATED PPTX only, not the portal UI.
 */
import type PptxGenJS from "pptxgenjs";
import { BRAND, placeLogo } from "./brand";
import type { LogoData, DealDocData, InvestorDeckData } from "./types";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";

type Slide = PptxGenJS.Slide;

// ─── Helpers ───

function val(v: unknown, fallback = "N/A"): string {
  if (v === null || v === undefined || v === "") return fallback;
  return String(v);
}

function fmtCurrency(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  const n = Number(v);
  return isNaN(n) ? "N/A" : formatCurrency(n);
}

function fmtPercent(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  const n = Number(v);
  if (isNaN(n)) return "N/A";
  // Values > 1 are already percentages, values <= 1 are decimals
  const pct = n > 1 ? n : n * 100;
  return formatPercent(pct / 100);
}

function fmtRatio(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  const n = Number(v);
  return isNaN(n) ? "N/A" : `${n.toFixed(2)}x`;
}

/** Standard gold accent line at top of content slides */
function addGoldBar(slide: Slide): void {
  slide.addShape("rect" as unknown as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.04,
    fill: { color: BRAND.gold },
  });
}

/** Standard section label in gold above the bar */
function addSectionLabel(slide: Slide, label: string): void {
  slide.addText(label.toUpperCase(), {
    x: 0.5,
    y: 0.15,
    w: 9,
    h: 0.25,
    fontSize: 9,
    fontFace: BRAND.bodyFont,
    color: BRAND.gold,
    bold: true,
    charSpacing: 3,
  });
}

/** Standard slide heading below the bar */
function addHeading(slide: Slide, text: string): void {
  slide.addText(text, {
    x: 0.5,
    y: 0.55,
    w: 9,
    h: 0.45,
    fontSize: 22,
    fontFace: BRAND.headingFont,
    color: BRAND.darkText,
    bold: true,
  });
}

/** Body text block */
function addBody(slide: Slide, text: string, y: number, h?: number): void {
  slide.addText(text, {
    x: 0.5,
    y,
    w: 9,
    h: h ?? 4,
    fontSize: 11,
    fontFace: BRAND.bodyFont,
    color: BRAND.darkText,
    lineSpacingMultiple: 1.4,
    valign: "top",
  });
}

// ─── Slide Builders ───

export function buildTitleSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  whiteLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.navy };

  // Logo
  placeLogo(slide, whiteLogo, 0.5, 0.4, 0.55);

  // Gold accent line
  slide.addShape("rect" as unknown as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 1.3,
    w: 2,
    h: 0.04,
    fill: { color: BRAND.gold },
  });

  // Deal name
  slide.addText(deal.name || "Investment Opportunity", {
    x: 0.5,
    y: 1.6,
    w: 9,
    h: 0.8,
    fontSize: 32,
    fontFace: BRAND.headingFont,
    color: BRAND.white,
    bold: true,
  });

  // Property address
  const pd = deal.property_data;
  const address = pd
    ? [pd.address, pd.city, pd.state, pd.zip].filter(Boolean).join(", ")
    : "";
  if (address) {
    slide.addText(address, {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 0.4,
      fontSize: 14,
      fontFace: BRAND.bodyFont,
      color: BRAND.gold,
    });
  }

  // Subtitle
  slide.addText("Investment Opportunity", {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.35,
    fontSize: 14,
    fontFace: BRAND.bodyFont,
    color: BRAND.gray,
  });

  // Date
  slide.addText(formatDate(new Date().toISOString()), {
    x: 0.5,
    y: 4.6,
    w: 9,
    h: 0.3,
    fontSize: 11,
    fontFace: BRAND.bodyFont,
    color: BRAND.gray,
  });
}

export function buildExecutiveSummarySlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  deck: InvestorDeckData | null,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Overview");
  addGoldBar(slide);
  addHeading(slide, "Executive Summary");

  const narrative =
    deck?.executive_summary ||
    deal.uw_data?.bridge_rationale ||
    `${deal.name} is a ${val(deal.asset_class, "commercial real estate")} opportunity seeking ${fmtCurrency(deal.amount)} in financing.`;

  addBody(slide, narrative, 1.15, 4.0);
}

export function buildKeyMetricsSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Key Figures");
  addGoldBar(slide);
  addHeading(slide, "Key Metrics");

  const uw = deal.uw_data || {};
  const metrics = [
    { label: "Loan Amount", value: fmtCurrency(deal.amount) },
    { label: "Interest Rate", value: fmtPercent(uw.interest_rate) },
    { label: "LTV (BPO)", value: fmtPercent(uw.ltv_bpo) },
    { label: "Debt Yield", value: fmtPercent(uw.debt_yield) },
    { label: "DSCR", value: fmtRatio(uw.dscr) },
  ];

  const colW = 1.7;
  const startX = 0.5;
  const y = 1.6;

  metrics.forEach((m, i) => {
    const x = startX + i * colW;

    // Background box
    slide.addShape("rect" as unknown as PptxGenJS.ShapeType, {
      x,
      y,
      w: 1.5,
      h: 1.2,
      fill: { color: BRAND.white },
      rectRadius: 0.05,
      shadow: {
        type: "outer",
        blur: 3,
        offset: 1,
        color: "000000",
        opacity: 0.1,
      } as unknown as PptxGenJS.ShadowProps,
    });

    // Value
    slide.addText(m.value, {
      x,
      y: y + 0.15,
      w: 1.5,
      h: 0.5,
      fontSize: 18,
      fontFace: BRAND.headingFont,
      color: BRAND.navy,
      bold: true,
      align: "center",
    });

    // Label
    slide.addText(m.label, {
      x,
      y: y + 0.7,
      w: 1.5,
      h: 0.3,
      fontSize: 9,
      fontFace: BRAND.bodyFont,
      color: BRAND.gray,
      align: "center",
    });
  });
}

export function buildPropertyOverviewSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  deck: InvestorDeckData | null,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Property");
  addGoldBar(slide);
  addHeading(slide, "Property Overview");

  const pd = deal.property_data || {};
  const rows: Array<[string, string]> = [
    ["Address", [pd.address, pd.city, pd.state, pd.zip].filter(Boolean).join(", ") || "N/A"],
    ["Property Type", val(pd.property_type)],
    ["Total Units", val(pd.total_units)],
    ["Acreage", pd.acreage ? `${pd.acreage} acres` : "N/A"],
    ["Year Built", val(pd.year_built)],
    ["Utilities", val(pd.utilities)],
    ["County", val(pd.county)],
    ["Zoning", val(pd.zoning)],
  ];

  const tableRows: PptxGenJS.TableRow[] = rows.map(([label, value]) => [
    {
      text: label,
      options: {
        fontSize: 10,
        fontFace: BRAND.bodyFont,
        color: BRAND.gray,
        bold: true,
        fill: { color: BRAND.white },
        border: [
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
        ],
      },
    },
    {
      text: value,
      options: {
        fontSize: 10,
        fontFace: BRAND.bodyFont,
        color: BRAND.darkText,
        fill: { color: BRAND.white },
        border: [
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
          { type: "solid" as const, pt: 0.5, color: BRAND.lightGray },
        ],
      },
    },
  ]);

  slide.addTable(tableRows, {
    x: 0.5,
    y: 1.15,
    w: 5.5,
    colW: [2, 3.5],
    rowH: 0.35,
  });

  // Narrative if available
  if (deck?.property_overview_narrative) {
    addBody(slide, deck.property_overview_narrative, 4.2, 1.0);
  }
}

export function buildMarketAnalysisSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  deck: InvestorDeckData | null,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Market");
  addGoldBar(slide);
  addHeading(slide, "Market Analysis");

  const narrative =
    deck?.market_analysis_narrative ||
    deal.uw_data?.market_overview ||
    "Market analysis data not yet available for this deal.";

  addBody(slide, String(narrative), 1.15, 4.0);
}

export function buildFinancialSummarySlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Financials");
  addGoldBar(slide);
  addHeading(slide, "Financial Summary");

  const uw = deal.uw_data || {};

  const rows: Array<[string, string]> = [
    ["Loan Amount", fmtCurrency(deal.amount)],
    ["Purchase Price", fmtCurrency(uw.purchase_price)],
    ["BPO / Appraised Value", fmtCurrency(uw.bpo_value)],
    ["NOI (T12)", fmtCurrency(uw.noi_t12)],
    ["LTV (BPO)", fmtPercent(uw.ltv_bpo)],
    ["LTC", fmtPercent(uw.ltc)],
    ["DSCR", fmtRatio(uw.dscr)],
    ["Debt Yield", fmtPercent(uw.debt_yield)],
    ["Interest Rate", fmtPercent(uw.interest_rate)],
    ["Loan Term", uw.loan_term_months ? `${uw.loan_term_months} months` : "N/A"],
  ];

  const headerRow: PptxGenJS.TableRow = [
    {
      text: "Metric",
      options: {
        fontSize: 9,
        fontFace: BRAND.bodyFont,
        color: BRAND.white,
        bold: true,
        fill: { color: BRAND.navy },
      },
    },
    {
      text: "Value",
      options: {
        fontSize: 9,
        fontFace: BRAND.bodyFont,
        color: BRAND.white,
        bold: true,
        fill: { color: BRAND.navy },
      },
    },
  ];

  const dataRows: PptxGenJS.TableRow[] = rows.map(([label, value], i) => [
    {
      text: label,
      options: {
        fontSize: 10,
        fontFace: BRAND.bodyFont,
        color: BRAND.darkText,
        fill: { color: i % 2 === 0 ? BRAND.white : BRAND.cream },
      },
    },
    {
      text: value,
      options: {
        fontSize: 10,
        fontFace: BRAND.bodyFont,
        color: BRAND.darkText,
        bold: true,
        fill: { color: i % 2 === 0 ? BRAND.white : BRAND.cream },
      },
    },
  ]);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5,
    y: 1.15,
    w: 6,
    colW: [3, 3],
    rowH: 0.35,
  });
}

export function buildLoanStructureSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Structure");
  addGoldBar(slide);
  addHeading(slide, "Loan Structure");

  const uw = deal.uw_data || {};
  const rows: Array<[string, string]> = [
    ["Loan Amount", fmtCurrency(deal.amount)],
    ["Interest Rate", fmtPercent(uw.interest_rate)],
    ["Term", uw.loan_term_months ? `${uw.loan_term_months} months` : "N/A"],
    ["Lien Position", val((uw as Record<string, unknown>).lien_position)],
    ["Recourse", val((uw as Record<string, unknown>).recourse)],
    ["Amortization", val((uw as Record<string, unknown>).amortization)],
    ["Prepayment", val((uw as Record<string, unknown>).prepayment)],
  ];

  const headerRow: PptxGenJS.TableRow = [
    {
      text: "Term",
      options: { fontSize: 9, fontFace: BRAND.bodyFont, color: BRAND.white, bold: true, fill: { color: BRAND.navy } },
    },
    {
      text: "Detail",
      options: { fontSize: 9, fontFace: BRAND.bodyFont, color: BRAND.white, bold: true, fill: { color: BRAND.navy } },
    },
  ];

  const dataRows: PptxGenJS.TableRow[] = rows.map(([label, value], i) => [
    {
      text: label,
      options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.darkText, fill: { color: i % 2 === 0 ? BRAND.white : BRAND.cream } },
    },
    {
      text: value,
      options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.darkText, bold: true, fill: { color: i % 2 === 0 ? BRAND.white : BRAND.cream } },
    },
  ]);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5,
    y: 1.15,
    w: 6,
    colW: [3, 3],
    rowH: 0.35,
  });
}

export function buildCapitalStackSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Capital");
  addGoldBar(slide);
  addHeading(slide, "Capital Stack");

  const uw = deal.uw_data || {};
  const loanAmount = Number(deal.amount) || 0;
  const purchasePrice = Number(uw.purchase_price) || 0;
  const equity = purchasePrice > 0 ? purchasePrice - loanAmount : 0;
  const ltv = Number(uw.ltv_bpo) || 0;

  const rows: Array<[string, string, string]> = [
    ["Senior Debt (Requity)", fmtCurrency(loanAmount), fmtPercent(ltv)],
    ["Borrower Equity", fmtCurrency(equity), equity > 0 && purchasePrice > 0 ? fmtPercent(equity / purchasePrice) : "N/A"],
    ["Total", fmtCurrency(purchasePrice), "100.00%"],
  ];

  const headerRow: PptxGenJS.TableRow = [
    { text: "Source", options: { fontSize: 9, fontFace: BRAND.bodyFont, color: BRAND.white, bold: true, fill: { color: BRAND.navy } } },
    { text: "Amount", options: { fontSize: 9, fontFace: BRAND.bodyFont, color: BRAND.white, bold: true, fill: { color: BRAND.navy } } },
    { text: "% of Total", options: { fontSize: 9, fontFace: BRAND.bodyFont, color: BRAND.white, bold: true, fill: { color: BRAND.navy } } },
  ];

  const dataRows: PptxGenJS.TableRow[] = rows.map(([source, amount, pct], i) => {
    const isTotal = i === rows.length - 1;
    return [
      { text: source, options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.darkText, bold: isTotal, fill: { color: isTotal ? BRAND.lightGray : BRAND.white } } },
      { text: amount, options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.darkText, bold: isTotal, fill: { color: isTotal ? BRAND.lightGray : BRAND.white } } },
      { text: pct, options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.darkText, bold: isTotal, fill: { color: isTotal ? BRAND.lightGray : BRAND.white } } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: 0.5,
    y: 1.15,
    w: 7,
    colW: [3, 2, 2],
    rowH: 0.4,
  });
}

export function buildValueAddSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  deck: InvestorDeckData | null,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Upside");
  addGoldBar(slide);
  addHeading(slide, "Value-Add Opportunity");

  const narrative =
    deck?.value_add_narrative ||
    "Value-add details not yet available. This section will cover upside items not included in base underwriting.";

  addBody(slide, narrative, 1.15, 4.0);
}

export function buildRiskFactorsSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Risk");
  addGoldBar(slide);
  addHeading(slide, "Risk Factors & Mitigants");

  // For now, show a placeholder. Credit memo risk_factors will be wired up when the editor is built.
  slide.addText("Risk factor analysis will be populated from the credit memo data.", {
    x: 0.5,
    y: 1.15,
    w: 9,
    h: 0.4,
    fontSize: 11,
    fontFace: BRAND.bodyFont,
    color: BRAND.gray,
    italic: true,
  });
}

export function buildInvestmentTermsSlide(
  pptx: PptxGenJS,
  deal: DealDocData,
  deck: InvestorDeckData | null,
  colorLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.cream };
  placeLogo(slide, colorLogo, 8.5, 0.15, 0.35);

  addSectionLabel(slide, "Terms");
  addGoldBar(slide);
  addHeading(slide, "Investment Terms");

  const narrative =
    deck?.investment_terms_narrative ||
    "Investment terms and participation details will be outlined here.";

  addBody(slide, narrative, 1.15, 1.5);

  // Structured fields if available
  if (deck) {
    const fields: Array<[string, string]> = [];
    if (deck.minimum_investment) fields.push(["Minimum Investment", fmtCurrency(deck.minimum_investment)]);
    if (deck.target_return) fields.push(["Target Return", deck.target_return]);
    if (deck.fund_name) fields.push(["Fund / Vehicle", deck.fund_name]);
    if (deck.investment_structure) fields.push(["Structure", deck.investment_structure]);

    if (fields.length > 0) {
      const tableRows: PptxGenJS.TableRow[] = fields.map(([label, value]) => [
        { text: label, options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.gray, bold: true, fill: { color: BRAND.white } } },
        { text: value, options: { fontSize: 10, fontFace: BRAND.bodyFont, color: BRAND.darkText, fill: { color: BRAND.white } } },
      ]);

      slide.addTable(tableRows, {
        x: 0.5,
        y: 2.8,
        w: 5.5,
        colW: [2.5, 3],
        rowH: 0.35,
      });
    }
  }
}

export function buildClosingSlide(
  pptx: PptxGenJS,
  whiteLogo: LogoData | null
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: BRAND.navy };

  placeLogo(slide, whiteLogo, 3.5, 1.0, 0.7);

  // Gold line
  slide.addShape("rect" as unknown as PptxGenJS.ShapeType, {
    x: 3.5,
    y: 2.0,
    w: 3,
    h: 0.04,
    fill: { color: BRAND.gold },
  });

  slide.addText("Thank You", {
    x: 0,
    y: 2.3,
    w: 10,
    h: 0.6,
    fontSize: 28,
    fontFace: BRAND.headingFont,
    color: BRAND.white,
    bold: true,
    align: "center",
  });

  slide.addText("Requity Group  |  requitygroup.com  |  info@requitygroup.com", {
    x: 0,
    y: 3.2,
    w: 10,
    h: 0.3,
    fontSize: 11,
    fontFace: BRAND.bodyFont,
    color: BRAND.gold,
    align: "center",
  });

  slide.addText("This presentation is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities.", {
    x: 1,
    y: 4.5,
    w: 8,
    h: 0.5,
    fontSize: 7,
    fontFace: BRAND.bodyFont,
    color: BRAND.gray,
    align: "center",
  });
}
