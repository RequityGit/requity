import type { PricingProgram, LoanProgramsMap } from "./config";
import { LOAN_PROGRAMS } from "./config";

/* ── Formatters / Parsers ── */

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return "$" + parseInt(digits).toLocaleString("en-US");
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  return parseInt(value.replace(/[^0-9]/g, "")) || 0;
}

export function parseCreditScore(value: string): number {
  if (!value || value === "Not sure") return 0;
  const match = value.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export function parseDeals(value: string): number {
  if (!value) return 0;
  if (value.startsWith("0")) return 0;
  if (value.startsWith("1")) return 1;
  if (value.startsWith("3")) return 3;
  if (value.startsWith("6")) return 6;
  if (value.startsWith("10+")) return 10;
  return 0;
}

/* ── Qualification ── */

export function qualifyForProgram(
  form: Record<string, string>,
  programs?: LoanProgramsMap,
): PricingProgram | null {
  const map = programs ?? LOAN_PROGRAMS;
  const config = map[form.loanType];
  if (!config) return null;

  const creditScore = parseCreditScore(form.creditScore);
  const deals = parseDeals(form.dealsInLast24Months);
  const isUSResident = ["US Citizen", "Permanent Resident (Green Card)"].includes(
    form.citizenshipStatus,
  );

  for (const program of config.programs) {
    const req = program.requirements;
    const meetsCredit = req.minCreditScore === 0 || creditScore >= req.minCreditScore;
    const meetsExperience = deals >= req.minDeals24Months;
    const meetsCitizenship = req.citizenship === "any" || isUSResident;

    if (meetsCredit && meetsExperience && meetsCitizenship) {
      return program;
    }
  }
  return config.programs[config.programs.length - 1] ?? null;
}

/* ── Term Calculation ── */

export interface CalculatedTerms {
  programName: string;
  programId: string;
  interestRate: number;
  rateType: string;
  originationPoints: number;
  minOriginationFee: number;
  maxLTV: number;
  maxLTC: number;
  maxLTP: number;
  maxTerm: number;
  termNote: string;
  loanTermMonths: number;
  exitPoints: number;
  exitFee: number;
  legalDocFee: number;
  bpoAppraisalCost: number;
  bpoAppraisalNote: string;
  maxLoan: number | null;
  estimatedLoan: number;
  originationFee: number | null;
  originationFeeFloored: boolean;
  monthlyInterest: number | null;
  maxByLTV: number | null;
  maxByLTC: number | null;
  maxByLTP: number | null;
  purchasePrice: number;
  rehabBudget: number;
  arv: number;
  totalCost: number;
  capped: boolean;
}

export function calculateTerms(
  form: Record<string, string>,
  program: Record<string, unknown>,
): CalculatedTerms {
  const purchasePrice = parseCurrency(form.purchasePrice);
  const rehabBudget = parseCurrency(form.rehabBudget);
  const arv = parseCurrency(form.afterRepairValue);
  const requestedLoan = parseCurrency(form.loanAmount);
  const totalCost = purchasePrice + rehabBudget;

  const maxLTV = (program.maxLTV as number) || 0;
  const maxLTC = (program.maxLTC as number) || 0;
  const maxLTP = (program.maxLTP as number) || 0;

  const maxByLTV = arv > 0 ? Math.floor(arv * (maxLTV / 100)) : null;
  const maxByLTC = totalCost > 0 ? Math.floor(totalCost * (maxLTC / 100)) : null;
  const maxByLTP = purchasePrice > 0 ? Math.floor(purchasePrice * (maxLTP / 100)) : null;

  const constraints = [maxByLTV, maxByLTC, maxByLTP].filter((v): v is number => v !== null);
  const maxLoan = constraints.length > 0 ? Math.min(...constraints) : null;

  const estimatedLoan =
    maxLoan !== null
      ? requestedLoan > 0
        ? Math.min(requestedLoan, maxLoan)
        : maxLoan
      : requestedLoan;

  const minFee = (program.minOriginationFee as number) || 0;
  const origPts = (program.originationPoints as number) || 0;
  const calculatedFee =
    estimatedLoan > 0 ? Math.floor(estimatedLoan * (origPts / 100)) : 0;
  const originationFee =
    estimatedLoan > 0 ? Math.max(calculatedFee, minFee) : null;
  const originationFeeFloored = minFee > 0 && calculatedFee < minFee;

  const interestRate = (program.interestRate as number) || 0;
  const monthlyInterest =
    estimatedLoan > 0
      ? Math.round((estimatedLoan * (interestRate / 100)) / 12)
      : null;

  const loanTermMonths =
    (program.loanTermMonths as number) || (program.maxTerm as number) || 12;
  const exitPoints = (program.exitPoints as number) || 0;
  const exitFee =
    estimatedLoan > 0 ? Math.floor(estimatedLoan * (exitPoints / 100)) : 0;

  const legalDocFee = (program.legalDocFee as number) || 0;
  const bpoAppraisalCost = (program.bpoAppraisalCost as number) || 0;
  const bpoAppraisalNote = (program.bpoAppraisalNote as string) || "";

  return {
    programName: program.name as string,
    programId: program.id as string,
    interestRate,
    rateType: (program.rateType as string) || "",
    originationPoints: origPts,
    minOriginationFee: minFee,
    maxLTV,
    maxLTC,
    maxLTP,
    maxTerm: (program.maxTerm as number) || 0,
    termNote: (program.termNote as string) || "",
    loanTermMonths,
    exitPoints,
    exitFee,
    legalDocFee,
    bpoAppraisalCost,
    bpoAppraisalNote,
    maxLoan,
    estimatedLoan,
    originationFee,
    originationFeeFloored,
    monthlyInterest,
    maxByLTV,
    maxByLTC,
    maxByLTP,
    purchasePrice,
    rehabBudget,
    arv,
    totalCost,
    capped: maxLoan !== null && requestedLoan > maxLoan,
  };
}
