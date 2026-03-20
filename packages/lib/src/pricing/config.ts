export interface PricingProgramRequirements {
  minCreditScore: number;
  minDeals24Months: number;
  citizenship: string;
}

export interface PricingProgram {
  id: string;
  name: string;
  loanTermMonths: number;
  interestRate: number;
  rateType: string;
  originationPoints: number;
  minOriginationFee: number;
  maxLTV: number;
  maxLTC: number;
  maxLTP: number;
  maxTerm: number;
  termNote: string;
  exitPoints: number;
  legalDocFee: number;
  bpoAppraisalCost: number;
  bpoAppraisalNote: string;
  requirements: PricingProgramRequirements;
  [key: string]: unknown;
}

export interface LoanProgramConfig {
  programs: PricingProgram[];
  arvLabel?: string;
  [key: string]: unknown;
}

export type LoanProgramsMap = Record<string, LoanProgramConfig>;

/**
 * Pricing config is currently empty — populate loanPrograms with real
 * program data to enable auto-generated term sheets. Until then all
 * loan types fall back to "Custom Terms."
 */
const pricingConfig: { loanPrograms: LoanProgramsMap } = {
  loanPrograms: {},
};

export const LOAN_PROGRAMS: LoanProgramsMap = pricingConfig.loanPrograms;
