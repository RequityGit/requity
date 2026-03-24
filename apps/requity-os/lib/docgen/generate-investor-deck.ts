/**
 * Client-side Investor Deck (PPTX) generator.
 * Dynamically imports PptxGenJS to avoid bundle bloat.
 */
import { loadWhiteLogo, loadColorLogo } from "./brand";
import type { DealDocData, InvestorDeckData, LogoData } from "./types";
import {
  buildTitleSlide,
  buildExecutiveSummarySlide,
  buildKeyMetricsSlide,
  buildPropertyOverviewSlide,
  buildMarketAnalysisSlide,
  buildFinancialSummarySlide,
  buildLoanStructureSlide,
  buildCapitalStackSlide,
  buildValueAddSlide,
  buildRiskFactorsSlide,
  buildInvestmentTermsSlide,
  buildClosingSlide,
} from "./slide-builders";

export interface GenerateInvestorDeckOptions {
  deal: DealDocData;
  deck?: InvestorDeckData | null;
}

/**
 * Generate and download an investor deck PPTX file.
 * Call this from a button click handler -- it dynamically imports PptxGenJS.
 */
export async function generateInvestorDeck({
  deal,
  deck = null,
}: GenerateInvestorDeckOptions): Promise<void> {
  // Dynamic imports to avoid loading these in the main bundle
  const [PptxGenJS, { saveAs }] = await Promise.all([
    import("pptxgenjs").then((m) => m.default),
    import("file-saver"),
  ]);

  // Load logos in parallel
  let whiteLogo: LogoData | null = null;
  let colorLogo: LogoData | null = null;
  try {
    [whiteLogo, colorLogo] = await Promise.all([
      loadWhiteLogo().catch(() => null),
      loadColorLogo().catch(() => null),
    ]);
  } catch {
    // Logos are optional; slides will render without them
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
  pptx.author = "Requity Group";
  pptx.company = "Requity Group";
  pptx.subject = `Investor Deck - ${deal.name}`;
  pptx.title = `${deal.name} - Investor Deck`;

  // Build all 12 slides in order
  buildTitleSlide(pptx, deal, whiteLogo);
  buildExecutiveSummarySlide(pptx, deal, deck, colorLogo);
  buildKeyMetricsSlide(pptx, deal, colorLogo);
  buildPropertyOverviewSlide(pptx, deal, deck, colorLogo);
  buildMarketAnalysisSlide(pptx, deal, deck, colorLogo);
  buildFinancialSummarySlide(pptx, deal, colorLogo);
  buildLoanStructureSlide(pptx, deal, colorLogo);
  buildCapitalStackSlide(pptx, deal, colorLogo);
  buildValueAddSlide(pptx, deal, deck, colorLogo);
  buildRiskFactorsSlide(pptx, deal, colorLogo);
  buildInvestmentTermsSlide(pptx, deal, deck, colorLogo);
  buildClosingSlide(pptx, whiteLogo);

  // Generate and download
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  const safeName = (deal.name || "Deal").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
  saveAs(blob, `${safeName}_Investor_Deck.pptx`);
}
