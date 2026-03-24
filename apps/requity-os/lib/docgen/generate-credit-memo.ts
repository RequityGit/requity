/**
 * Client-side Credit Memo (DOCX) generator.
 * Dynamically imports the docx package to avoid bundle bloat.
 */
import { BRAND } from "./brand";
import type { DealDocData, CreditMemoData } from "./types";
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

export interface GenerateCreditMemoOptions {
  deal: DealDocData;
  memo: CreditMemoData;
}

/**
 * Generate and download a credit memo DOCX file.
 */
export async function generateCreditMemo({
  deal,
  memo,
}: GenerateCreditMemoOptions): Promise<void> {
  const [docx, { saveAs }] = await Promise.all([
    import("docx"),
    import("file-saver"),
  ]);

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
    HeadingLevel,
    Header,
    Footer,
    PageNumber,
    BorderStyle,
    ShadingType,
    TableLayoutType,
  } = docx;

  // ─── Helper functions ───

  const navyHex = BRAND.navy;
  const goldHex = BRAND.gold;
  const creamHex = BRAND.cream;

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
      width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
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

  function headerCell(text: string, width?: number): InstanceType<typeof TableCell> {
    return tableCell(text, { bold: true, fill: navyHex, width });
  }

  function altCell(text: string, rowIdx: number, bold = false): InstanceType<typeof TableCell> {
    return tableCell(text, {
      bold,
      fill: rowIdx % 2 === 0 ? "FFFFFF" : creamHex,
    });
  }

  // ─── Build Document Sections ───

  const sections: InstanceType<typeof Paragraph>[] = [];
  const pd = deal.property_data || {};
  const uw = deal.uw_data || {};
  const lt = memo.loan_terms || {};

  // Section 1: Deal Summary
  sections.push(heading("1. Deal Summary"));
  sections.push(goldRule());

  const summaryRows = [
    ["Loan Name", val(deal.name)],
    ["Borrower", val(memo.sponsor_profile?.name)],
    ["Property Address", [pd.address, pd.city, pd.state, pd.zip].filter(Boolean).join(", ") || "N/A"],
    ["Property Type", val(pd.property_type)],
    ["Loan Amount", fmtCurrency(deal.amount)],
    ["Loan Purpose", val(lt.loan_type)],
    ["Risk Rating", val(memo.risk_rating)?.toUpperCase()],
    ["Prepared By", val(memo.prepared_by)],
    ["Date", formatDate(new Date().toISOString())],
    ["Credit Committee Date", memo.credit_committee_date ? formatDate(memo.credit_committee_date) : "TBD"],
  ];

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: summaryRows.map(
        ([label, value], i) =>
          new TableRow({
            children: [altCell(label, i, true), altCell(value, i)],
          })
      ),
    }) as unknown as InstanceType<typeof Paragraph>
  );
  sections.push(emptyPara());

  // Section 2: Recommendation
  sections.push(heading("2. Recommendation"));
  sections.push(goldRule());
  sections.push(
    bodyPara(
      `Recommendation: ${val(memo.recommendation)?.toUpperCase().replace(/_/g, " ")}`
    )
  );
  if (memo.recommendation_conditions) {
    sections.push(bodyPara(`Conditions: ${memo.recommendation_conditions}`));
  }
  if (memo.recommendation_narrative) {
    sections.push(bodyPara(memo.recommendation_narrative));
  }
  sections.push(emptyPara());

  // Section 3: Proposed Loan Terms
  sections.push(heading("3. Proposed Loan Terms"));
  sections.push(goldRule());

  const termRows: Array<[string, string]> = [
    ["Loan Amount", fmtCurrency(lt.loan_amount ?? deal.amount)],
    ["Loan Type", val(lt.loan_type)],
    ["Term", lt.term_months ? `${lt.term_months} months` : "N/A"],
    ["Extension Options", val(lt.extension_options)],
    ["Interest Rate", fmtPercent(lt.interest_rate)],
    ["Rate Type", val(lt.rate_type)],
    ["Rate Floor", lt.rate_floor ? fmtPercent(lt.rate_floor) : "N/A"],
    ["Amortization", val(lt.amortization)],
    ["Lien Position", val(lt.lien_position)],
    ["Recourse", val(lt.recourse)],
    ["Origination Fee", lt.origination_fee_pct ? `${lt.origination_fee_pct}% (${fmtCurrency(lt.origination_fee_amt)})` : "N/A"],
    ["Exit Fee", lt.exit_fee_pct ? `${lt.exit_fee_pct}% (${fmtCurrency(lt.exit_fee_amt)})` : "N/A"],
    ["Prepayment", val(lt.prepayment)],
    ["Interest Reserve", val(lt.interest_reserve)],
    ["CapEx Reserve", val(lt.capex_reserve)],
    ["Tax/Insurance Escrow", val(lt.tax_insurance_escrow)],
    ["Guaranty", val(lt.guaranty)],
    ["Funding Source", val(lt.funding_source)],
  ];

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [headerCell("Term", 40), headerCell("Detail", 60)] }),
        ...termRows.map(
          ([label, value], i) =>
            new TableRow({ children: [altCell(label, i, true), altCell(value, i)] })
        ),
      ],
    }) as unknown as InstanceType<typeof Paragraph>
  );

  // Fee income sub-table
  if (memo.fee_income && memo.fee_income.length > 0) {
    sections.push(subheading("Fee Income Summary"));
    sections.push(
      new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [headerCell("Fee"), headerCell("Amount")] }),
          ...memo.fee_income.map(
            (f, i) =>
              new TableRow({
                children: [altCell(f.label, i), altCell(fmtCurrency(f.amount), i)],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }
  sections.push(emptyPara());

  // Section 4: Credit Metrics Summary
  sections.push(heading("4. Credit Metrics Summary"));
  sections.push(goldRule());

  const guidelines = memo.requity_guidelines || {};
  const metricsRows: Array<[string, string, string]> = [
    ["LTV (BPO)", fmtPercent(uw.ltv_bpo), guidelines.max_ltv ? `Max ${fmtPercent(guidelines.max_ltv)}` : "N/A"],
    ["LTC", fmtPercent(uw.ltc), guidelines.max_ltc ? `Max ${fmtPercent(guidelines.max_ltc)}` : "N/A"],
    ["DSCR", uw.dscr ? `${Number(uw.dscr).toFixed(2)}x` : "N/A", guidelines.min_dscr ? `Min ${guidelines.min_dscr}x` : "N/A"],
    ["Debt Yield", fmtPercent(uw.debt_yield), guidelines.min_debt_yield ? `Min ${fmtPercent(guidelines.min_debt_yield)}` : "N/A"],
    ["Net Worth", fmtCurrency(uw.guarantor_combined_net_worth), guidelines.min_net_worth_multiple ? `${guidelines.min_net_worth_multiple}x loan amount` : "N/A"],
  ];

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [headerCell("Metric"), headerCell("Deal"), headerCell("Guideline")],
        }),
        ...metricsRows.map(
          ([metric, dealVal, guideline], i) =>
            new TableRow({
              children: [altCell(metric, i, true), altCell(dealVal, i), altCell(guideline, i)],
            })
        ),
      ],
    }) as unknown as InstanceType<typeof Paragraph>
  );

  if (memo.metrics_exceptions_narrative) {
    sections.push(bodyPara(memo.metrics_exceptions_narrative));
  }
  sections.push(emptyPara());

  // Section 5: Property Overview
  sections.push(heading("5. Property Overview"));
  sections.push(goldRule());
  if (memo.property_condition_narrative) {
    sections.push(subheading("Property Condition"));
    sections.push(bodyPara(memo.property_condition_narrative));
  }
  sections.push(emptyPara());

  // Section 6: Financial Analysis
  sections.push(heading("6. Financial Analysis"));
  sections.push(goldRule());

  const os = memo.operating_statement || {};
  if (os.revenue_lines && os.revenue_lines.length > 0) {
    sections.push(subheading("Operating Statement"));
    const osRows = [
      ...os.revenue_lines.map((l) => [l.label, fmtCurrency(l.t12), fmtCurrency(l.current), fmtCurrency(l.pro_forma)]),
      ["Total Revenue", fmtCurrency(os.revenue_lines.reduce((s, l) => s + (l.t12 || 0), 0)), fmtCurrency(os.revenue_lines.reduce((s, l) => s + (l.current || 0), 0)), fmtCurrency(os.revenue_lines.reduce((s, l) => s + (l.pro_forma || 0), 0))],
    ];

    if (os.expense_lines && os.expense_lines.length > 0) {
      osRows.push(...os.expense_lines.map((l) => [l.label, fmtCurrency(l.t12), fmtCurrency(l.current), fmtCurrency(l.pro_forma)]));
      osRows.push(["Total Expenses", fmtCurrency(os.expense_lines.reduce((s, l) => s + (l.t12 || 0), 0)), fmtCurrency(os.expense_lines.reduce((s, l) => s + (l.current || 0), 0)), fmtCurrency(os.expense_lines.reduce((s, l) => s + (l.pro_forma || 0), 0))]);
    }

    osRows.push(["NOI", fmtCurrency(os.noi_t12), fmtCurrency(os.noi_current), fmtCurrency(os.noi_pro_forma)]);

    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [headerCell("Line Item"), headerCell("T12"), headerCell("Current"), headerCell("Pro Forma")],
          }),
          ...osRows.map(
            ([item, t12, current, proForma], i) =>
              new TableRow({
                children: [altCell(item, i, true), altCell(t12, i), altCell(current, i), altCell(proForma, i)],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  // Sources & Uses
  const su = memo.sources_and_uses || {};
  if ((su.sources && su.sources.length > 0) || (su.uses && su.uses.length > 0)) {
    sections.push(subheading("Sources & Uses"));
    const suRows: Array<[string, string, string, string]> = [];
    const maxLen = Math.max(su.sources?.length || 0, su.uses?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      const src = su.sources?.[i];
      const use = su.uses?.[i];
      suRows.push([
        src?.label || "",
        src ? fmtCurrency(src.amount) : "",
        use?.label || "",
        use ? fmtCurrency(use.amount) : "",
      ]);
    }
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [headerCell("Source"), headerCell("Amount"), headerCell("Use"), headerCell("Amount")],
          }),
          ...suRows.map(
            ([srcLabel, srcAmt, useLabel, useAmt], i) =>
              new TableRow({
                children: [altCell(srcLabel, i), altCell(srcAmt, i), altCell(useLabel, i), altCell(useAmt, i)],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }
  sections.push(emptyPara());

  // Section 7: Sponsor / Borrower Analysis
  sections.push(heading("7. Sponsor / Borrower Analysis"));
  sections.push(goldRule());

  const sp = memo.sponsor_profile || {};
  if (sp.name) {
    const spRows: Array<[string, string]> = [
      ["Sponsor Name", val(sp.name)],
      ["Entity Type", val(sp.entity_type)],
      ["Years Experience", val(sp.years_experience)],
      ["Total Deals", val(sp.total_deals)],
      ["Total Units", val(sp.total_units)],
      ["AUM", sp.aum ? fmtCurrency(sp.aum) : "N/A"],
    ];
    sections.push(
      new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: spRows.map(
          ([label, value], i) =>
            new TableRow({ children: [altCell(label, i, true), altCell(value, i)] })
        ),
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  // Guarantors
  if (memo.guarantor_details && memo.guarantor_details.length > 0) {
    sections.push(subheading("Guarantor Summary"));
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              headerCell("Name"),
              headerCell("Ownership"),
              headerCell("Net Worth"),
              headerCell("Liquidity"),
              headerCell("FICO"),
            ],
          }),
          ...memo.guarantor_details.map(
            (g, i) =>
              new TableRow({
                children: [
                  altCell(val(g.name), i),
                  altCell(g.ownership_pct ? `${g.ownership_pct}%` : "N/A", i),
                  altCell(fmtCurrency(g.net_worth), i),
                  altCell(fmtCurrency(g.liquidity), i),
                  altCell(val(g.credit_score), i),
                ],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  if (memo.sponsor_track_record_narrative) {
    sections.push(bodyPara(memo.sponsor_track_record_narrative));
  }
  sections.push(emptyPara());

  // Section 8: Business Plan & Exit
  sections.push(heading("8. Business Plan & Exit Strategy"));
  sections.push(goldRule());
  if (memo.business_plan_narrative) {
    sections.push(subheading("Business Plan"));
    sections.push(bodyPara(memo.business_plan_narrative));
  }
  if (memo.exit_strategy_narrative) {
    sections.push(subheading("Exit Strategy"));
    sections.push(bodyPara(memo.exit_strategy_narrative));
  }

  // Capital improvement budget
  if (memo.capital_improvement_budget && memo.capital_improvement_budget.length > 0) {
    sections.push(subheading("Capital Improvement Budget"));
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [headerCell("Item"), headerCell("Budget"), headerCell("Timeline"), headerCell("Status")],
          }),
          ...memo.capital_improvement_budget.map(
            (item, i) =>
              new TableRow({
                children: [
                  altCell(val(item.item), i),
                  altCell(item.budget ? fmtCurrency(item.budget) : "N/A", i),
                  altCell(val(item.timeline), i),
                  altCell(val(item.status), i),
                ],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }
  sections.push(emptyPara());

  // Section 9: Stress Testing
  sections.push(heading("9. Stress Testing & Sensitivity Analysis"));
  sections.push(goldRule());

  if (memo.stress_scenarios && memo.stress_scenarios.length > 0) {
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [headerCell("Scenario"), headerCell("Assumption"), headerCell("DSCR"), headerCell("Result")],
          }),
          ...memo.stress_scenarios.map(
            (s, i) =>
              new TableRow({
                children: [
                  altCell(val(s.scenario), i),
                  altCell(val(s.assumption), i),
                  altCell(s.dscr ? `${Number(s.dscr).toFixed(2)}x` : "N/A", i),
                  altCell(val(s.result)?.toUpperCase(), i),
                ],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  if (memo.stress_narrative) {
    sections.push(bodyPara(memo.stress_narrative));
  }
  sections.push(emptyPara());

  // Section 10: Third-Party Reports
  sections.push(heading("10. Third-Party Reports"));
  sections.push(goldRule());

  if (memo.third_party_reports && memo.third_party_reports.length > 0) {
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [headerCell("Report"), headerCell("Provider"), headerCell("Date"), headerCell("Key Finding")],
          }),
          ...memo.third_party_reports.map(
            (r, i) =>
              new TableRow({
                children: [
                  altCell(val(r.report), i),
                  altCell(val(r.provider), i),
                  altCell(r.date ? formatDate(r.date) : "N/A", i),
                  altCell(val(r.key_finding), i),
                ],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  // Risk factors
  if (memo.risk_factors && memo.risk_factors.length > 0) {
    sections.push(subheading("Risk Factors & Mitigants"));
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({ children: [headerCell("Risk"), headerCell("Mitigant")] }),
          ...memo.risk_factors.map(
            (r, i) =>
              new TableRow({
                children: [altCell(val(r.risk), i), altCell(val(r.mitigant), i)],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  if (memo.portfolio_impact_narrative) {
    sections.push(bodyPara(memo.portfolio_impact_narrative));
  }
  sections.push(emptyPara());

  // Section 11: Approval
  sections.push(heading("11. Approval"));
  sections.push(goldRule());

  if (memo.conditions_precedent && memo.conditions_precedent.length > 0) {
    sections.push(subheading("Conditions Precedent"));
    memo.conditions_precedent.forEach((c, i) => {
      sections.push(bodyPara(`${i + 1}. ${c}`));
    });
  }

  if (memo.ongoing_covenants && memo.ongoing_covenants.length > 0) {
    sections.push(subheading("Ongoing Covenants"));
    memo.ongoing_covenants.forEach((c) => {
      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: [
            new TextRun({ text: c, font: BRAND.bodyFont, size: 20, color: BRAND.darkText }),
          ],
        })
      );
    });
  }

  if (memo.approval_roles && memo.approval_roles.length > 0) {
    sections.push(subheading("Credit Committee Approval"));
    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [headerCell("Role"), headerCell("Name"), headerCell("Decision"), headerCell("Date")],
          }),
          ...memo.approval_roles.map(
            (r, i) =>
              new TableRow({
                children: [
                  altCell(val(r.role), i),
                  altCell(val(r.name), i),
                  altCell(val(r.decision)?.toUpperCase(), i),
                  altCell(r.date ? formatDate(r.date) : "", i),
                ],
              })
          ),
        ],
      }) as unknown as InstanceType<typeof Paragraph>
    );
  }

  if (memo.committee_notes) {
    sections.push(subheading("Notes / Comments"));
    sections.push(bodyPara(memo.committee_notes));
  }

  // ─── Assemble Document ───

  const doc = new Document({
    creator: "Requity Lending LLC",
    title: `Credit Memorandum - ${deal.name}`,
    description: `Credit memo v${memo.version} for ${deal.name}`,
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
                    text: "REQUITY LENDING LLC",
                    font: BRAND.bodyFont,
                    size: 16,
                    color: goldHex,
                    bold: true,
                  }),
                  new TextRun({
                    text: "\t\t\tCREDIT MEMORANDUM",
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
                    text: "Confidential - For Internal Use Only",
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
  const safeName = (deal.name || "Deal").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
  saveAs(blob, `${safeName}_Credit_Memo_v${memo.version}.docx`);
}
