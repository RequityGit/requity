export interface LoanType {
  id: string;
  label: string;
  desc: string;
}

export const LOAN_TYPES: LoanType[] = [
  {
    id: "CRE Bridge",
    label: "CRE Bridge",
    desc: "Short-term bridge financing for commercial real estate acquisitions and refinances.",
  },
  {
    id: "Manufactured Housing",
    label: "Manufactured Housing",
    desc: "Financing for manufactured housing communities and park acquisitions.",
  },
  {
    id: "RV Park",
    label: "RV Park",
    desc: "Capital for RV parks, campgrounds, and outdoor hospitality properties.",
  },
  {
    id: "Multifamily",
    label: "Multifamily",
    desc: "Financing for apartment buildings and multifamily residential properties.",
  },
  {
    id: "Fix & Flip",
    label: "Fix & Flip",
    desc: "Short-term loans for residential property renovation and resale.",
  },
  {
    id: "DSCR Rental",
    label: "DSCR Rental",
    desc: "Long-term rental property loans based on property cash flow, not personal income.",
  },
  {
    id: "New Construction",
    label: "New Construction",
    desc: "Ground-up construction financing for residential and commercial projects.",
  },
];

export const RESIDENTIAL_IDS = ["DSCR Rental", "Fix & Flip", "New Construction"];
export const COMMERCIAL_IDS = [
  "CRE Bridge",
  "Manufactured Housing",
  "RV Park",
  "Multifamily",
];
export const RESIDENTIAL_TYPES = LOAN_TYPES.filter((lt) =>
  RESIDENTIAL_IDS.includes(lt.id),
);
export const COMMERCIAL_TYPES = LOAN_TYPES.filter((lt) =>
  COMMERCIAL_IDS.includes(lt.id),
);

export const COMMERCIAL_TERM_TYPES = ["CRE Bridge", "RV Park", "Multifamily"];
export const RESIDENTIAL_TERM_TYPES = [
  "Fix & Flip",
  "DSCR Rental",
  "Manufactured Housing",
  "New Construction",
];

export const TIMELINES = [
  "Immediate \u2014 Under Contract",
  "Within 30 Days",
  "30\u201360 Days",
  "60\u201390 Days",
  "90+ Days",
  "Just Exploring Options",
];

export const EXPERIENCE_LEVELS = [
  "First-Time Investor",
  "1\u20133 Deals Completed",
  "4\u201310 Deals Completed",
  "10\u201325 Deals Completed",
  "25+ Deals Completed",
  "Institutional / Fund",
];

export const CREDIT_SCORE_RANGES = [
  "760 or higher",
  "720\u2013759",
  "680\u2013719",
  "650\u2013679",
  "620\u2013649",
  "Below 620",
  "Not sure",
];

export const DEALS_24_MONTHS = [
  "0 \u2014 First deal",
  "1\u20132 deals",
  "3\u20135 deals",
  "6\u201310 deals",
  "10+ deals",
];

export const CITIZENSHIP_OPTIONS = [
  "US Citizen",
  "Permanent Resident (Green Card)",
  "Foreign National",
  "Other / Not Sure",
];

export const TERM_OPTIONS = [
  { months: 12, exitPoints: 0, label: "12 Months", exitLabel: "0 exit points" },
  { months: 18, exitPoints: 1, label: "18 Months", exitLabel: "1 exit point" },
  { months: 24, exitPoints: 2, label: "24 Months", exitLabel: "2 exit points" },
];

export const SLIDER_CONFIG = {
  "Single Family Residence (1-4 units)": { min: 50, max: 90, default: 75 },
  "Multifamily (5+ units)": { min: 50, max: 90, default: 75 },
  "Mixed Use": { min: 50, max: 90, default: 75 },
  Commercial: { min: 50, max: 90, default: 75 },
  "New Construction": { min: 50, max: 90, default: 75 },
  Land: { min: 50, max: 90, default: 75 },
};
export const DEFAULT_SLIDER = { min: 50, max: 90, default: 75 };

/**
 * Maps form-facing loan type names to internal RequityOS codes used in the
 * opportunities table.
 */
export const LOAN_TYPE_CODES: Record<string, string> = {
  "Fix & Flip": "rtl",
  "DSCR Rental": "dscr",
  "New Construction": "guc",
  "CRE Bridge": "cre_bridge",
  "Manufactured Housing": "mhc",
  "RV Park": "rv_park",
  Multifamily: "multifamily",
};
