// Document type detection via filename heuristics

export type DocumentType =
  | "appraisal"
  | "bank_statement"
  | "pnl_tax_return"
  | "rent_roll"
  | "title_report"
  | "insurance_policy"
  | "entity_document"
  | "other";

const FILENAME_PATTERNS: Record<string, DocumentType> = {
  appraisal: "appraisal",
  "as-is": "appraisal",
  "bank.?statement": "bank_statement",
  "account.?statement": "bank_statement",
  "p&l": "pnl_tax_return",
  "profit.?(?:and|&).?loss": "pnl_tax_return",
  "tax.?return": "pnl_tax_return",
  "1040": "pnl_tax_return",
  "1065": "pnl_tax_return",
  "1120": "pnl_tax_return",
  "k-?1": "pnl_tax_return",
  "schedule.?[cek]": "pnl_tax_return",
  "rent.?roll": "rent_roll",
  "unit.?mix": "rent_roll",
  title: "title_report",
  commitment: "title_report",
  prelim: "title_report",
  insurance: "insurance_policy",
  policy: "insurance_policy",
  binder: "insurance_policy",
  "certificate.?of.?insurance": "insurance_policy",
  coi: "insurance_policy",
  articles: "entity_document",
  "operating.?agreement": "entity_document",
  "certificate.?of.?(?:formation|organization|good.?standing)":
    "entity_document",
  ein: "entity_document",
  "ss-?4": "entity_document",
  bylaws: "entity_document",
  resolution: "entity_document",
};

export function detectTypeFromFilename(filename: string): DocumentType | null {
  const lower = filename.toLowerCase();
  for (const [pattern, type] of Object.entries(FILENAME_PATTERNS)) {
    if (new RegExp(pattern, "i").test(lower)) {
      return type;
    }
  }
  return null;
}
