/**
 * Client-side Investor Summary (DOCX) generator.
 * Dynamically imports the docx package to avoid bundle bloat.
 * Produces an investor-facing document reframing the deal as an investment opportunity.
 */
import { BRAND } from "./brand";
import type { DealDocData, InvestorDeckData } from "./types";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";

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
  const pct = n > 1 ? n : n * 100;
  return formatPercent(pct / 100);
}

export interface GenerateInvestorSummaryOptions {
  deal: DealDocData;
  deck?: InvestorDeckData | null;
}

/**
 * Generate and download an investor summary DOCX file.
 */
export async function generateInvestorSummary({
  deal,
  deck = null,
}: GenerateInvestorSummaryOptions): Promise<void> {
  const [docxModule, fileSaverModule] = await Promise.all([
    import("docx"),
    import("file-saver"),
  ]);
  const saveAs =
    (fileSaverModule as any).saveAs ??
    (fileSaverModule as any).default?.saveAs ??
    (fileSaverModule as any).default;
  if (typeof saveAs !== "function") {
    throw new Error(
      `file-saver saveAs import resolved to ${typeof saveAs}, not a function`
    );
  }
  const docx = (docxModule as any).Document
    ? docxModule
    : ((docxModule as any).default ?? docxModule);

  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    Header,
    Footer,
    PageNumber,
    BorderStyle,
    ShadingType,
    TableLayoutType,
  } = docx;

  const navyHex = BRAND.navy;
  const goldHex = BRAND.gold;
  const creamHex = BRAND.cream;

  // ─── Helper functions ───

  function heading(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text,
          font: BRAND.headingFont,
          size: 28,
          color: navyHex,
          bold: true,
        }),
      ],
    });
  }

  function subheading(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text,
          font: BRAND.headingFont,
          size: 22,
          color: navyHex,
          bold: true,
        }),
      ],
    });
  }

  function bodyPara(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: text || "",
          font: BRAND.bodyFont,
          size: 20,
          color: BRAND.darkText,
        }),
      ],
    });
  }

  function goldRule(): InstanceType<typeof Paragraph> {
    return new Paragraph({
      spacing: { before: 40, after: 40 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 2, color: goldHex },
      },
      children: [],
    });
  }

  function emptyPara(): InstanceType<typeof Paragraph> {
    return new Paragraph({ children: [] });
  }

  function tableCell(
    text: string,
    opts?: { bold?: boolean; fill?: string; width?: number }
  ): InstanceType<typeof TableCell> {
    return new TableCell({
      width: opts?.width
        ? { size: opts.width, type: WidthType.PERCENTAGE }
        : undefined,
      shading: opts?.fill
        ? { type: ShadingType.CLEAR, fill: opts.fill }
        : undefined,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              font: BRAND.bodyFont,
              size: 18,
              bold: opts?.bold ?? false,
              color: opts?.fill === navyHex ? BRAND.white : BRAND.darkText,
            }),
          ],
        }),
      ],
    });
  }

  function headerCell(
    text: string,
    width?: number
  ): InstanceType<typeof TableCell> {
    return tableCell(text, { bold: true, fill: navyHex, width });
  }

  function altCell(
    text: string,
    rowIdx: number,
    bold = false
  ): InstanceType<typeof TableCell> {
    return tableCell(text, {
      bold,
      fill: rowIdx % 2 === 0 ? "FFFFFF" : creamHex,
    });
  }

  // ─── Build Document Sections ───

  const sections: InstanceType<typeof Paragraph>[] = [];
  const pd = deal.property_data || {};
  const uw = deal.uw_data || {};

  // Cover info
  sections.push(
    new Paragraph({
      spacing: { before: 600, after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "INVESTMENT SUMMARY",
          font: BRAND.headingFont,
          size: 40,
          color: navyHex,
          bold: true,
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: val(deal.name),
          font: BRAND.headingFont,
          size: 32,
          color: goldHex,
          bold: true,
        }),
      ],
    })
  );

  const addressParts = [pd.address, pd.city, pd.state, pd.zip].filter(
    Boolean
  );
  if (addressParts.length > 0) {
    sections.push(
      new Paragraph({
        spacing: { after: 60 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: addressParts.join(", "),
            font: BRAND.bodyFont,
            size: 22,
            color: BRAND.gray,
          }),
        ],
      })
    );
  }

  sections.push(
    new Paragraph({
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Prepared by Requity Group  |  ${formatDate(new Date().toISOString())}`,
          font: BRAND.bodyFont,
          size: 18,
          color: BRAND.gray,
        }),
      ],
    })
  );

  sections.push(goldRule());
  sections.push(emptyPara());

  // Section 1: Executive Summary
  if (deck?.executive_summary) {
    sections.push(heading("Executive Summary"));
    sections.push(goldRule());
    sections.push(bodyPara(deck.executive_summary));
    sections.push(emptyPara());
  }

  // Section 2: Property Overview
  sections.push(heading("Property Overview"));
  sections.push(goldRule());

  const propRows = ([
    ["Property Name", val(deal.name)],
    [
      "Address",
      addressParts.length > 0 ? addressParts.join(", ") : "N/A",
    ],
    ["Property Type", val(pd.property_type)],
    ["Year Built", val(pd.year_built)],
    ["Total Units", val(pd.total_units)],
    ["Lot Size", val(pd.lot_size)],
    ["Zoning", val(pd.zoning)],
  ] as Array<[string, string]>).filter(([, v]) => v !== "N/A");

  if (propRows.length > 0) {
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: propRows.map(
          ([label, value], i) =>
            new TableRow({
              children: [altCell(label, i, true), altCell(value, i)],
            })
        ),
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  if (deck?.property_overview_narrative) {
    sections.push(emptyPara());
    sections.push(bodyPara(deck.property_overview_narrative));
  }
  sections.push(emptyPara());

  // Section 3: Market Analysis
  if (deck?.market_analysis_narrative) {
    sections.push(heading("Market Analysis"));
    sections.push(goldRule());
    sections.push(bodyPara(deck.market_analysis_narrative));
    sections.push(emptyPara());
  }

  // Section 4: Financial Highlights
  sections.push(heading("Financial Highlights"));
  sections.push(goldRule());

  const finRows = ([
    ["Investment Size", fmtCurrency(deal.amount)],
    ["Asset Class", val(deal.asset_class)],
    ["LTV", fmtPercent(uw.ltv_bpo)],
    ["LTC", fmtPercent(uw.ltc)],
    ["DSCR", uw.dscr ? `${Number(uw.dscr).toFixed(2)}x` : "N/A"],
    ["Debt Yield", fmtPercent(uw.debt_yield)],
    [
      "Interest Rate",
      uw.interest_rate ? fmtPercent(uw.interest_rate) : "N/A",
    ],
    [
      "Term",
      uw.loan_term_months ? `${uw.loan_term_months} months` : "N/A",
    ],
    ["Purchase Price", fmtCurrency(uw.purchase_price)],
    ["BPO / Appraised Value", fmtCurrency(uw.bpo_value)],
  ] as Array<[string, string]>).filter(([, v]) => v !== "N/A");

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [headerCell("Metric", 50), headerCell("Value", 50)],
        }),
        ...finRows.map(
          ([label, value], i) =>
            new TableRow({
              children: [altCell(label, i, true), altCell(value, i)],
            })
        ),
      ],
    }) as unknown as InstanceType<typeof Paragraph>
  );
  sections.push(emptyPara());

  // Section 5: Value-Add Opportunity
  if (deck?.value_add_narrative) {
    sections.push(heading("Value-Add Opportunity"));
    sections.push(goldRule());
    sections.push(bodyPara(deck.value_add_narrative));
    sections.push(emptyPara());
  }

  // Section 6: Investment Terms
  sections.push(heading("Investment Terms"));
  sections.push(goldRule());

  if (deck?.investment_terms_narrative) {
    sections.push(bodyPara(deck.investment_terms_narrative));
  }

  const termsRows: Array<[string, string]> = [];
  if (deck?.minimum_investment) {
    termsRows.push(["Minimum Investment", fmtCurrency(deck.minimum_investment)]);
  }
  if (deck?.target_return) {
    termsRows.push(["Target Return", deck.target_return]);
  }
  if (deck?.fund_name) {
    termsRows.push(["Fund / Vehicle", deck.fund_name]);
  }
  if (deck?.investment_structure) {
    termsRows.push(["Structure", deck.investment_structure]);
  }

  if (termsRows.length > 0) {
    sections.push(
      new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: termsRows.map(
          ([label, value], i) =>
            new TableRow({
              children: [altCell(label, i, true), altCell(value, i)],
            })
        ),
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }
  sections.push(emptyPara());

  // Section 7: Disclaimer
  sections.push(goldRule());
  sections.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "Disclaimer",
          font: BRAND.headingFont,
          size: 18,
          color: BRAND.gray,
          bold: true,
          italics: true,
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "This document is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities. Past performance is not indicative of future results. All projections and forward-looking statements are estimates based on current expectations and are subject to change. Investors should conduct their own due diligence and consult with their financial, legal, and tax advisors before making any investment decision.",
          font: BRAND.bodyFont,
          size: 16,
          color: BRAND.gray,
          italics: true,
        }),
      ],
    })
  );

  // ─── Assemble Document ───

  const doc = new Document({
    creator: "Requity Group",
    title: `Investment Summary - ${deal.name}`,
    description: `Investor summary for ${deal.name}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "REQUITY GROUP",
                    font: BRAND.bodyFont,
                    size: 16,
                    color: goldHex,
                    bold: true,
                  }),
                  new TextRun({
                    text: "\t\t\tINVESTMENT SUMMARY",
                    font: BRAND.bodyFont,
                    size: 16,
                    color: BRAND.gray,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "Confidential",
                    font: BRAND.bodyFont,
                    size: 14,
                    color: BRAND.gray,
                    italics: true,
                  }),
                  new TextRun({
                    text: "\t\t\tPage ",
                    font: BRAND.bodyFont,
                    size: 14,
                    color: BRAND.gray,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: BRAND.bodyFont,
                    size: 14,
                    color: BRAND.gray,
                  }),
                ],
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (deal.name || "Deal")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "_");
  saveAs(blob, `${safeName}_Investor_Summary.docx`);
}
