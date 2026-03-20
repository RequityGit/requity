"use client";

import { useMemo } from "react";
import type { CommercialUWState, ComputedValues } from "./types";

function irr(cashflows: number[], guess = 0.1): number {
  const maxIter = 100;
  const tol = 1e-7;
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let j = 0; j < cashflows.length; j++) {
      npv += cashflows[j] / Math.pow(1 + rate, j);
      dnpv -= (j * cashflows[j]) / Math.pow(1 + rate, j + 1);
    }
    if (Math.abs(npv) < tol) return rate;
    if (Math.abs(dnpv) < tol) break;
    rate -= npv / dnpv;
  }
  return rate;
}

export function computeUW(s: CommercialUWState): ComputedValues {
  // --- Sources & Uses ---
  const totalClosingCosts = s.closingCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalReserves = s.reserves.reduce((sum, r) => sum + r.amount, 0);
  const totalCapex =
    s.capexOverride !== null
      ? s.capexOverride
      : s.capexCategories.reduce(
          (sum, cat) =>
            sum + cat.items.reduce((s2, item) => s2 + item.qty * item.unitCost, 0),
          0
        );
  const totalAcquisitionBudget =
    s.purchasePrice + totalClosingCosts + s.acquisitionFee + totalReserves + totalCapex;

  const gpEquity = s.equityInvested * (s.gpCoInvestPct / 100);
  const lpEquity = s.equityInvested - gpEquity;
  const totalEquity = s.equityInvested;
  const totalSources = s.goingInLoanAmount + totalEquity;

  // --- Income ---
  const t12EGI = s.t12GPI - s.t12VacancyLoss - s.t12BadDebt;
  const rentRollTotalMarket = s.rentRoll.reduce(
    (sum, u) => sum + u.marketPerMonth * 12,
    0
  );
  const totalAncillaryCurrent = s.ancillaryIncome.reduce(
    (sum, a) => sum + a.currentAnnual,
    0
  );
  const totalAncillaryStabilized = s.ancillaryIncome.reduce(
    (sum, a) => sum + a.stabilizedAnnual,
    0
  );

  // --- Expenses ---
  const totalT12OpEx = s.expenseLineItems.reduce((sum, e) => sum + e.t12Actual, 0);

  // --- Pro Forma 5-year ---
  const gpiByYear: number[] = [];
  const vacancyByYear: number[] = [];
  const badDebtByYear: number[] = [];
  const egiByYear: number[] = [];
  const opexByYear: number[] = [];
  const noiByYear: number[] = [];
  const replacementReserveByYear: number[] = [];
  const noiAfterReservesByYear: number[] = [];
  const debtServiceByYear: number[] = [];
  const ncfByYear: number[] = [];

  // Year 0 base GPI = T12 GPI
  let prevGPI = s.t12GPI;

  for (let yr = 0; yr < 5; yr++) {
    // GPI grows by market rent growth
    const gpi = prevGPI * (1 + (s.marketRentGrowth[yr] || 0) / 100);
    gpiByYear.push(gpi);
    prevGPI = gpi;

    // Add ancillary income to GPI
    const grossPotentialWithAncillary = gpi + totalAncillaryStabilized;

    // Vacancy & Loss
    const physVac = gpi * ((s.physicalVacancy[yr] || 0) / 100);
    const econVac = gpi * ((s.economicVacancy[yr] || 0) / 100);
    const ltl = gpi * ((s.lossToLease[yr] || 0) / 100);
    const totalVacancy = physVac + econVac + ltl;
    vacancyByYear.push(totalVacancy);

    // Bad Debt
    const bd = gpi * (s.badDebtPct / 100);
    badDebtByYear.push(bd);

    // EGI
    const egi = grossPotentialWithAncillary - totalVacancy - bd;
    egiByYear.push(egi);

    // Expenses for this year
    let yearOpex = 0;
    for (const expense of s.expenseLineItems) {
      let yr1Val: number;
      if (expense.isPercentOfEGI && expense.pctOfEGI !== null) {
        yr1Val = egiByYear[0] !== undefined && yr === 0
          ? egi * (expense.pctOfEGI / 100)
          : 0; // placeholder; we'll recalc below
      } else if (expense.yr1Override !== null && expense.yr1Override !== 0) {
        yr1Val = expense.yr1Override;
      } else {
        yr1Val = expense.t12Actual;
      }

      if (yr === 0) {
        if (expense.isPercentOfEGI && expense.pctOfEGI !== null) {
          yr1Val = egi * (expense.pctOfEGI / 100);
        }
        yearOpex += yr1Val;
      } else {
        // Grow from Yr1 by expense growth
        // We need to compute Yr1 value first
        let baseVal: number;
        if (expense.isPercentOfEGI && expense.pctOfEGI !== null) {
          baseVal = egiByYear[0] * (expense.pctOfEGI / 100);
        } else if (expense.yr1Override !== null && expense.yr1Override !== 0) {
          baseVal = expense.yr1Override;
        } else {
          baseVal = expense.t12Actual;
        }
        let grown = baseVal;
        for (let g = 1; g <= yr; g++) {
          grown *= 1 + (s.expenseGrowth[g] || 0) / 100;
        }
        yearOpex += grown;
      }
    }
    opexByYear.push(yearOpex);

    // NOI
    const noi = egi - yearOpex;
    noiByYear.push(noi);

    // Replacement Reserve
    let rr = s.replacementReserve;
    for (let g = 0; g <= yr; g++) {
      if (g > 0) rr *= 1 + (s.expenseGrowth[g] || 0) / 100;
    }
    replacementReserveByYear.push(rr);

    // NOI After Reserves
    noiAfterReservesByYear.push(noi - rr);

    // Debt Service
    let ds = 0;
    // Going-in loan: IO during term
    if (yr < Math.ceil(s.goingInTermMonths / 12)) {
      ds += s.goingInLoanAmount * (s.goingInInterestRate / 100);
    }
    // Permanent loan: after going-in term ends
    if (yr >= Math.ceil(s.goingInTermMonths / 12)) {
      if (s.exitIOMonths > 0 && yr < Math.ceil(s.goingInTermMonths / 12) + Math.ceil(s.exitIOMonths / 12)) {
        ds += s.exitLoanAmount * (s.exitInterestRate / 100);
      } else if (s.exitAmortizationYears > 0) {
        // Amortizing payment
        const monthlyRate = s.exitInterestRate / 100 / 12;
        const nPayments = s.exitAmortizationYears * 12;
        const monthlyPayment =
          monthlyRate > 0
            ? (s.exitLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)) /
              (Math.pow(1 + monthlyRate, nPayments) - 1)
            : s.exitLoanAmount / nPayments;
        ds += monthlyPayment * 12;
      } else {
        ds += s.exitLoanAmount * (s.exitInterestRate / 100);
      }
    }
    debtServiceByYear.push(ds);

    // NCF
    ncfByYear.push(noiAfterReservesByYear[yr] - ds);
  }

  // Total Yr1 OpEx
  const totalYr1OpEx = opexByYear[0] || 0;

  // --- Returns ---
  const dscrByYear = noiByYear.map((noi, i) =>
    debtServiceByYear[i] !== 0 ? Math.abs(noi / debtServiceByYear[i]) : 0
  );
  const capRateByYear = noiByYear.map((noi) =>
    s.purchasePrice > 0 ? (noi / s.purchasePrice) * 100 : 0
  );
  const cashOnCashByYear = ncfByYear.map((ncf) =>
    totalEquity > 0 ? (ncf / totalEquity) * 100 : 0
  );
  const yieldOnCostByYear = noiByYear.map((noi) =>
    totalAcquisitionBudget > 0 ? (noi / totalAcquisitionBudget) * 100 : 0
  );

  // Per-unit metrics
  const pricePerUnit = s.totalUnits > 0 ? s.purchasePrice / s.totalUnits : 0;
  const pricePerSF = s.totalSF > 0 ? s.purchasePrice / s.totalSF : 0;
  const noiPerUnit = s.totalUnits > 0 ? (noiByYear[0] || 0) / s.totalUnits : 0;

  // --- Waterfall ---
  // Year 0 = negative equity
  const exitYear = 4; // Year 5 is exit (index 4)
  const exitNOI = noiByYear[exitYear] || 0;
  const exitValue =
    s.exitCapRate > 0 ? exitNOI / (s.exitCapRate / 100) : 0;
  const dispositionCosts = exitValue * (s.dispositionCost / 100);
  const loanPayoff = s.exitLoanAmount; // simplified

  const projectCFs = [
    -totalEquity,
    ...ncfByYear.slice(0, exitYear),
    (ncfByYear[exitYear] || 0) + exitValue - dispositionCosts - loanPayoff,
  ];
  const projectLevelCashFlows = projectCFs;

  const projectIRR = projectCFs.length > 1 ? irr(projectCFs) * 100 : 0;
  const totalDistributions = projectCFs.slice(1).reduce((s, v) => s + Math.max(0, v), 0);
  const projectEquityMultiple = totalEquity > 0 ? totalDistributions / totalEquity : 0;

  // Simplified GP/LP (just using co-invest split for now)
  const gpPct = s.gpCoInvestPct / 100;
  const lpPct = 1 - gpPct;

  const gpCFs = projectCFs.map((cf) => cf * gpPct);
  const lpCFs = projectCFs.map((cf) => cf * lpPct);

  const gpIRR = gpCFs.length > 1 ? irr(gpCFs) * 100 : 0;
  const lpIRR = lpCFs.length > 1 ? irr(lpCFs) * 100 : 0;
  const gpDistributions = gpCFs.slice(1).reduce((s, v) => s + Math.max(0, v), 0);
  const lpDistributions = lpCFs.slice(1).reduce((s, v) => s + Math.max(0, v), 0);
  const gpEquityMultiple = gpEquity > 0 ? gpDistributions / gpEquity : 0;
  const lpEquityMultiple = lpEquity > 0 ? lpDistributions / lpEquity : 0;

  return {
    totalClosingCosts,
    totalReserves,
    totalCapex,
    totalAcquisitionBudget,
    totalSources,
    t12EGI,
    rentRollTotalMarket,
    totalAncillaryCurrent,
    totalAncillaryStabilized,
    totalT12OpEx,
    totalYr1OpEx,
    gpiByYear,
    egiByYear,
    vacancyByYear,
    badDebtByYear,
    opexByYear,
    noiByYear,
    replacementReserveByYear,
    noiAfterReservesByYear,
    debtServiceByYear,
    ncfByYear,
    dscrByYear,
    capRateByYear,
    cashOnCashByYear,
    yieldOnCostByYear,
    pricePerUnit,
    pricePerSF,
    noiPerUnit,
    gpEquity,
    lpEquity,
    totalEquity,
    projectLevelCashFlows,
    projectIRR,
    projectEquityMultiple,
    gpIRR,
    gpEquityMultiple,
    lpIRR,
    lpEquityMultiple,
  };
}

export function useCommercialUWCalcs(state: CommercialUWState): ComputedValues {
  return useMemo(() => computeUW(state), [state]);
}
