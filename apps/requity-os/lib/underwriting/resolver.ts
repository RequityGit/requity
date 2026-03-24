/**
 * Underwriting Model Resolver
 *
 * Determines which underwriting editor to render based on:
 * 1. For debt deals: opportunities.loan_type
 * 2. For loans: loans.type
 * 3. For equity deals: always 'equity' (uses commercial model for property UW)
 */

export type UnderwritingModelType = "rtl" | "commercial" | "dscr" | "guc" | "equity";

export interface UnderwritingConfig {
  modelType: UnderwritingModelType;
  editorLabel: string;
  editorDescription: string;
  primaryTable: string;
  childTables: string[];
  supportsEquityDeals: boolean;
  supportsDebtOpportunities: boolean;
}

const MODEL_CONFIGS: Record<UnderwritingModelType, UnderwritingConfig> = {
  rtl: {
    modelType: "rtl",
    editorLabel: "Fix & Flip / RTL",
    editorDescription: "Rehab-to-let underwriting with ARV, rehab budget, and hold period analysis",
    primaryTable: "loan_underwriting_versions",
    childTables: [],
    supportsEquityDeals: false,
    supportsDebtOpportunities: true,
  },
  commercial: {
    modelType: "commercial",
    editorLabel: "Commercial UW",
    editorDescription: "Full commercial underwriting with rent roll, T12, proforma, and debt analysis",
    primaryTable: "commercial_underwriting",
    childTables: [
      "commercial_rent_roll",
      "commercial_occupancy_income",
      "commercial_ancillary_income",
      "commercial_proforma_years",
      "commercial_upload_mappings",
    ],
    supportsEquityDeals: true,
    supportsDebtOpportunities: true,
  },
  dscr: {
    modelType: "dscr",
    editorLabel: "DSCR Calculator",
    editorDescription: "DSCR rental loan underwriting with PITIA analysis and pricing engine integration",
    primaryTable: "dscr_underwriting",
    childTables: [],
    supportsEquityDeals: false,
    supportsDebtOpportunities: true,
  },
  guc: {
    modelType: "guc",
    editorLabel: "Ground-Up Construction",
    editorDescription: "Construction loan underwriting with budget, draw schedule, and stabilized exit analysis",
    primaryTable: "guc_underwriting",
    childTables: [],
    supportsEquityDeals: false,
    supportsDebtOpportunities: true,
  },
  equity: {
    modelType: "equity",
    editorLabel: "Equity Investment",
    editorDescription: "Investment underwriting with IRR, equity multiple, and cash-on-cash analysis",
    primaryTable: "equity_underwriting",
    childTables: [],
    supportsEquityDeals: true,
    supportsDebtOpportunities: false,
  },
};

/**
 * Resolves the underwriting model type from deal context.
 */
export function resolveModelType(
  context:
    | { source: "opportunity"; loanType: string | null }
    | { source: "loan"; loanType: string | null }
    | { source: "equity_deal" }
): UnderwritingModelType {
  if (context.source === "equity_deal") return "equity";

  const loanType = context.loanType?.toLowerCase();
  switch (loanType) {
    case "rtl":
      return "rtl";
    case "commercial":
      return "commercial";
    case "dscr":
      return "dscr";
    case "guc":
      return "guc";
    case "transactional":
      return "rtl"; // transactional uses RTL model
    default:
      return "rtl"; // fallback
  }
}

export function getModelConfig(modelType: UnderwritingModelType): UnderwritingConfig {
  return MODEL_CONFIGS[modelType];
}

/**
 * For the equity pipeline, commercial deals may also need commercial UW.
 * Returns the secondary model type if applicable.
 */
export function getSecondaryModelType(
  _context: { source: "equity_deal" }
): UnderwritingModelType | null {
  return "commercial";
}
