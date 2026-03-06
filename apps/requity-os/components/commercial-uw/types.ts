export interface RentRollUnit {
  id: string;
  unit: string;
  tenant: string;
  sf: number;
  rentPerMonth: number;
  marketPerMonth: number;
  camNNN: number;
  other: number;
  isVacant: boolean;
}

export interface AncillaryItem {
  id: string;
  source: string;
  currentAnnual: number;
  stabilizedAnnual: number;
}

export interface ExpenseLineItem {
  id: string;
  label: string;
  t12Actual: number;
  yr1Override: number | null;
  isPercentOfEGI: boolean;
  pctOfEGI: number | null;
  note: string;
}

export interface ClosingCostItem {
  id: string;
  label: string;
  amount: number;
  note: string;
}

export interface ReserveItem {
  id: string;
  label: string;
  amount: number;
}

export interface CapexCategory {
  id: string;
  name: string;
  items: CapexLineItem[];
}

export interface CapexLineItem {
  id: string;
  description: string;
  qty: number;
  unitCost: number;
  timeline: string;
}

export interface WaterfallTier {
  id: string;
  type: "pref" | "roc" | "promote" | "residual";
  label: string;
  prefRate?: number;
  accrual?: "Annual" | "Monthly" | "Quarterly";
  compounding?: "Simple" | "Compound";
  irrHurdle?: number;
  gpSplit?: number;
  lpSplit?: number;
}

export type UWTabId =
  | "overview"
  | "income"
  | "expenses"
  | "sourcesuses"
  | "proforma"
  | "waterfall";

export interface CommercialUWState {
  // Meta
  dealId: string;
  versionId: string;
  version: number;
  status: "draft" | "active";

  // Deal Overview
  propertyType: string;
  totalUnits: number;
  totalSF: number;
  yearBuilt: number;
  purchasePrice: number;
  exitCapRate: number;
  dispositionCost: number;
  equityInvested: number;

  // Going-In Loan
  goingInLoanAmount: number;
  goingInInterestRate: number;
  goingInTermMonths: number;
  goingInIOMonths: number;
  goingInOriginationPts: number;

  // Exit Loan
  exitLoanAmount: number;
  exitInterestRate: number;
  exitAmortizationYears: number;
  exitIOMonths: number;

  // Income Assumptions (5-year arrays)
  marketRentGrowth: number[];
  physicalVacancy: number[];
  economicVacancy: number[];
  lossToLease: number[];
  stabilizedVacancy: number;
  badDebtPct: number;

  // Rent Roll
  rentRoll: RentRollUnit[];

  // Ancillary Income
  ancillaryIncome: AncillaryItem[];

  // Expenses
  t12GPI: number;
  t12VacancyLoss: number;
  t12BadDebt: number;
  expenseLineItems: ExpenseLineItem[];
  expenseGrowth: number[];
  replacementReserve: number;

  // Sources & Uses
  closingCosts: ClosingCostItem[];
  acquisitionFee: number;
  reserves: ReserveItem[];
  capexOverride: number | null;
  capexCategories: CapexCategory[];

  // Waterfall
  gpCoInvestPct: number;
  waterfallTiers: WaterfallTier[];
}

export interface ComputedValues {
  // Sources & Uses
  totalClosingCosts: number;
  totalReserves: number;
  totalCapex: number;
  totalAcquisitionBudget: number;
  totalSources: number;

  // Income
  t12EGI: number;
  rentRollTotalMarket: number;
  totalAncillaryCurrent: number;
  totalAncillaryStabilized: number;

  // Expenses
  totalT12OpEx: number;
  totalYr1OpEx: number;

  // Pro Forma (5-year arrays)
  gpiByYear: number[];
  egiByYear: number[];
  vacancyByYear: number[];
  badDebtByYear: number[];
  opexByYear: number[];
  noiByYear: number[];
  replacementReserveByYear: number[];
  noiAfterReservesByYear: number[];
  debtServiceByYear: number[];
  ncfByYear: number[];

  // Returns (5-year arrays)
  dscrByYear: number[];
  capRateByYear: number[];
  cashOnCashByYear: number[];
  yieldOnCostByYear: number[];

  // Per-unit metrics
  pricePerUnit: number;
  pricePerSF: number;
  noiPerUnit: number;

  // Waterfall
  gpEquity: number;
  lpEquity: number;
  totalEquity: number;
  projectLevelCashFlows: number[];
  projectIRR: number;
  projectEquityMultiple: number;
  gpIRR: number;
  gpEquityMultiple: number;
  lpIRR: number;
  lpEquityMultiple: number;
}
