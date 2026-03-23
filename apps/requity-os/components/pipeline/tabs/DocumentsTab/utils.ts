// ─── Cumulative Stage Filtering ───

/** Condition stages in lifecycle order */
export const CONDITION_STAGE_ORDER = [
  "loan_intake",
  "processing",
  "closed_onboarding",
  "note_sell_process",
  "post_loan_payoff",
] as const;

/** Maps deal pipeline stage to the latest condition stage visible by default */
export const DEAL_TO_CONDITION_CEILING: Record<string, string> = {
  lead: "loan_intake",
  analysis: "loan_intake",
  negotiation: "processing",
  execution: "closed_onboarding",
  closed: "post_loan_payoff",
};

/** Get condition stage label */
export const CONDITION_STAGE_LABELS: Record<string, string> = {
  loan_intake: "Loan Intake",
  processing: "Processing",
  closed_onboarding: "Closed / Onboarding",
  note_sell_process: "Note Sell Process",
  post_loan_payoff: "Post Loan Payoff",
};

export function getCeilingStage(dealStage: string): string {
  return DEAL_TO_CONDITION_CEILING[dealStage] ?? "post_loan_payoff";
}

export function getVisibleStages(ceilingStage: string): string[] {
  const idx = CONDITION_STAGE_ORDER.indexOf(ceilingStage as typeof CONDITION_STAGE_ORDER[number]);
  if (idx === -1) return [...CONDITION_STAGE_ORDER];
  return CONDITION_STAGE_ORDER.slice(0, idx + 1) as unknown as string[];
}

export function getCeilingLabel(dealStage: string): string {
  const ceiling = getCeilingStage(dealStage);
  const visibleStages = getVisibleStages(ceiling);
  if (visibleStages.length === 1) {
    return `Due now (${CONDITION_STAGE_LABELS[ceiling] ?? ceiling})`;
  }
  return `Due now (through ${CONDITION_STAGE_LABELS[ceiling] ?? ceiling})`;
}

// ─── Shared Utilities ───

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

export function getFileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

// ─── Condition category config ───

export const CATEGORY_GROUPS: Record<string, string[]> = {
  ptf: [
    "borrower_documents",
    "non_us_citizen",
    "entity_documents",
    "deal_level_items",
    "appraisal_request",
    "insurance_request",
    "title_request",
    "title_fraud_protection",
    "fundraising",
    "prior_to_funding",
  ],
  ptc: ["closing_prep", "lender_package"],
  ptd: ["prior_to_approval"],
  post_closing: [
    "post_closing_items",
    "note_sell_process",
    "post_loan_payoff",
  ],
};

export function getCategoryGroup(category: string): string {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(category)) return group;
  }
  return "ptf";
}

export const CATEGORY_LABELS: Record<string, string> = {
  borrower_documents: "Borrower Documents",
  non_us_citizen: "Non-US Citizen",
  entity_documents: "Entity Documents",
  deal_level_items: "Deal Level Items",
  appraisal_request: "Appraisal",
  insurance_request: "Insurance",
  title_request: "Title",
  title_fraud_protection: "Title / Fraud Protection",
  fundraising: "Fundraising",
  prior_to_funding: "Prior to Funding",
  closing_prep: "Closing Prep",
  lender_package: "Lender Package",
  prior_to_approval: "Prior to Approval",
  post_closing_items: "Post Closing",
  note_sell_process: "Note Sell",
  post_loan_payoff: "Post Loan Payoff",
};

export const STAGE_FILTERS = [
  { key: "all", label: "All" },
  { key: "loan_intake", label: "Loan Intake" },
  { key: "processing", label: "Processing" },
  { key: "closed_onboarding", label: "Closed / Onboarding" },
  { key: "note_sell_process", label: "Note Sell Process" },
  { key: "post_loan_payoff", label: "Post Loan Payoff" },
] as const;

export const CONDITION_STATUS_CONFIG: Record<
  string,
  { label: string; pillClass: string }
> = {
  pending: { label: "Pending", pillClass: "bg-warning/10 text-warning" },
  submitted: { label: "Submitted", pillClass: "bg-info/10 text-info" },
  under_review: { label: "In Review", pillClass: "bg-info/10 text-info" },
  in_review: { label: "In Review", pillClass: "bg-info/10 text-info" },
  approved: { label: "Cleared", pillClass: "bg-success/10 text-success" },
  waived: { label: "Waived", pillClass: "bg-muted text-muted-foreground" },
  not_applicable: {
    label: "N/A",
    pillClass: "bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Revision Requested",
    pillClass: "bg-destructive/10 text-destructive",
  },
};

export const STATUS_OPTIONS = [
  "pending",
  "submitted",
  "under_review",
  "approved",
  "waived",
  "not_applicable",
  "rejected",
];

// ─── File type badge config ───

export const FILE_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  pdf: { color: "text-red-500 bg-red-500/10 border-red-500/20", label: "PDF" },
  doc: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "DOC" },
  docx: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "DOC" },
  xls: { color: "text-green-500 bg-green-500/10 border-green-500/20", label: "XLS" },
  xlsx: { color: "text-green-500 bg-green-500/10 border-green-500/20", label: "XLS" },
  csv: { color: "text-green-500 bg-green-500/10 border-green-500/20", label: "CSV" },
  zip: { color: "text-violet-500 bg-violet-500/10 border-violet-500/20", label: "ZIP" },
  png: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "IMG" },
  jpg: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "IMG" },
  jpeg: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "IMG" },
};

// ─── Helpers: render text with clickable URLs ───

export const URL_REGEX = /(https?:\/\/[^\s]+)/g;
