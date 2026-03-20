"use client";

import type { CommercialUWState, ComputedValues } from "./types";

declare global {
  interface Window {
    XLSX: any;
  }
}

function loadXLSX(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => resolve(window.XLSX);
    s.onerror = () => reject(new Error("Failed to load Excel library"));
    document.head.appendChild(s);
  });
}

export async function exportToExcel(
  state: CommercialUWState,
  calcs: ComputedValues,
  dealName: string
) {
  const X = await loadXLSX();
  const wb = X.utils.book_new();

  // Sheet 1: Deal Overview
  const ov = [
    ["DEAL OVERVIEW"],
    [],
    ["PROPERTY INFORMATION"],
    ["", "Property Type", "Total Units", "Total SF", "Year Built"],
    ["", state.propertyType, state.totalUnits, state.totalSF, state.yearBuilt],
    [],
    ["ACQUISITION DETAILS"],
    ["", "Purchase Price", "Exit Cap Rate", "Disposition Cost", "Equity Invested"],
    ["", state.purchasePrice, state.exitCapRate / 100, state.dispositionCost / 100, state.equityInvested],
    [],
    ["GOING-IN LOAN TERMS"],
    ["", "Loan Amount", "Interest Rate", "Term (mo)", "IO Period (mo)", "Orig Pts"],
    ["", state.goingInLoanAmount, state.goingInInterestRate / 100, state.goingInTermMonths, state.goingInIOMonths, state.goingInOriginationPts / 100],
    [],
    ["EXIT / PERMANENT LOAN"],
    ["", "Loan Amount", "Interest Rate", "Amort (yr)", "IO Period (mo)"],
    ["", state.exitLoanAmount, state.exitInterestRate / 100, state.exitAmortizationYears, state.exitIOMonths],
  ];
  const ws1 = X.utils.aoa_to_sheet(ov);
  ws1["!cols"] = [{ wch: 4 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
  X.utils.book_append_sheet(wb, ws1, "Deal Overview");

  // Sheet 2: Income
  const inc = [
    ["INCOME & OCCUPANCY ASSUMPTIONS"],
    ["", "", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"],
    ["Market Rent Growth %", "", ...state.marketRentGrowth.map((v) => v / 100)],
    ["Physical Vacancy %", "", ...state.physicalVacancy.map((v) => v / 100)],
    ["Economic Vacancy %", "", ...state.economicVacancy.map((v) => v / 100)],
    ["Loss to Lease %", "", ...state.lossToLease.map((v) => v / 100)],
    [],
    ["Stabilized Vacancy %", state.stabilizedVacancy / 100],
    ["Bad Debt %", state.badDebtPct / 100],
    [],
    ["RENT ROLL"],
    ["Unit", "Tenant", "SF", "Rent/Mo", "Market/Mo", "CAM/NNN", "Other"],
    ...state.rentRoll.map((r) => [r.unit, r.tenant, r.sf, r.rentPerMonth, r.marketPerMonth, r.camNNN, r.other]),
    ["TOTALS", "", { f: `SUM(C13:C${12 + state.rentRoll.length})` }, { f: `SUM(D13:D${12 + state.rentRoll.length})` }, { f: `SUM(E13:E${12 + state.rentRoll.length})` }, { f: `SUM(F13:F${12 + state.rentRoll.length})` }, { f: `SUM(G13:G${12 + state.rentRoll.length})` }],
    [],
    ["ANCILLARY INCOME"],
    ["Source", "Current Annual", "Stabilized Annual"],
    ...state.ancillaryIncome.map((a) => [a.source, a.currentAnnual, a.stabilizedAnnual]),
  ];
  const ws2 = X.utils.aoa_to_sheet(inc);
  ws2["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  X.utils.book_append_sheet(wb, ws2, "Income");

  // Sheet 3: Expenses
  const exp = [
    ["T12 HISTORICAL DATA"],
    [],
    ["Gross Potential Income", state.t12GPI],
    ["Vacancy Loss", state.t12VacancyLoss],
    ["Bad Debt", state.t12BadDebt],
    ["Effective Gross Income", { f: "B3-B4-B5" }],
    [],
    ["OPERATING EXPENSES"],
    ["Line Item", "T12 Actual", "Yr 1 Override", "Variance", "$/Unit", "% of EGI"],
    ...state.expenseLineItems.map((e, i) => {
      const row = 10 + i;
      return [
        e.label,
        e.t12Actual,
        e.isPercentOfEGI ? `${e.pctOfEGI}% of EGI` : (e.yr1Override ?? e.t12Actual),
        { f: `C${row}-B${row}` },
        { f: `C${row}/'Deal Overview'!C5` },
        { f: `IF(B6=0,0,C${row}/B6)` },
      ];
    }),
    ["Total OpEx", { f: `SUM(B10:B${9 + state.expenseLineItems.length})` }, { f: `SUM(C10:C${9 + state.expenseLineItems.length})` }],
    [],
    ["Replacement Reserve", state.replacementReserve],
    ["Expense Growth %", "", "Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"],
    ["", "", ...state.expenseGrowth.map((v) => v / 100)],
  ];
  const ws3 = X.utils.aoa_to_sheet(exp);
  ws3["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  X.utils.book_append_sheet(wb, ws3, "Expenses");

  // Sheet 4: Sources & Uses
  const su = [
    ["SOURCES & USES"],
    [],
    ["SOURCES", "", "Amount"],
    ["Going-In Loan", "", state.goingInLoanAmount],
    ["LP Equity", "", calcs.lpEquity],
    ["GP Co-Invest", "", calcs.gpEquity],
    ["Total Sources", "", { f: "SUM(C4:C6)" }],
    [],
    ["USES", "", "Total"],
    ["Purchase Price", "", state.purchasePrice],
    ["Closing Costs", "", calcs.totalClosingCosts],
    ["Acquisition Fee", "", state.acquisitionFee],
    ["Reserves", "", calcs.totalReserves],
    ["Improvement Budget", "", calcs.totalCapex],
    ["Total Uses", "", { f: "SUM(C10:C14)" }],
  ];
  const ws4 = X.utils.aoa_to_sheet(su);
  ws4["!cols"] = [{ wch: 28 }, { wch: 4 }, { wch: 16 }];
  X.utils.book_append_sheet(wb, ws4, "Sources & Uses");

  // Sheet 5: Pro Forma
  const pf = [
    ["5-YEAR PRO FORMA"],
    ["", "T12", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
    ["INCOME"],
    ["Gross Potential Rent", state.t12GPI, ...calcs.gpiByYear],
    ["Ancillary Income", calcs.totalAncillaryCurrent, ...calcs.gpiByYear.map(() => calcs.totalAncillaryStabilized)],
    ["Gross Potential Income", state.t12GPI + calcs.totalAncillaryCurrent, ...calcs.gpiByYear.map((g) => g + calcs.totalAncillaryStabilized)],
    ["  Vacancy", "", ...calcs.vacancyByYear.map((v) => -v)],
    ["  Bad Debt", -state.t12BadDebt, ...calcs.badDebtByYear.map((b) => -b)],
    ["Effective Gross Income", calcs.t12EGI, ...calcs.egiByYear],
    [],
    ["EXPENSES"],
    ["Total OpEx", calcs.totalT12OpEx, ...calcs.opexByYear],
    [],
    ["Net Operating Income", calcs.t12EGI - calcs.totalT12OpEx, ...calcs.noiByYear],
    ["  Replacement Reserve", "", ...calcs.replacementReserveByYear.map((r) => -r)],
    ["NOI After Reserves", "", ...calcs.noiAfterReservesByYear],
    [],
    ["DEBT SERVICE"],
    ["Total Debt Service", "", ...calcs.debtServiceByYear.map((d) => -d)],
    [],
    ["Net Cash Flow", "", ...calcs.ncfByYear],
    [],
    ["RETURNS"],
    ["DSCR", "", ...calcs.dscrByYear],
    ["Cap Rate", "", ...calcs.capRateByYear.map((c) => c / 100)],
    ["Cash-on-Cash", "", ...calcs.cashOnCashByYear.map((c) => c / 100)],
  ];
  const ws5 = X.utils.aoa_to_sheet(pf);
  ws5["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  X.utils.book_append_sheet(wb, ws5, "Pro Forma");

  // Sheet 6: Waterfall
  const wf = [
    ["WATERFALL"],
    [],
    ["EQUITY STRUCTURE"],
    ["Total Equity", state.equityInvested],
    ["GP Co-Invest %", state.gpCoInvestPct / 100],
    ["GP Co-Invest $", calcs.gpEquity],
    ["LP Equity", calcs.lpEquity],
    [],
    ["PROJECT CASH FLOWS", "TOTAL", "Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
    ["Levered Project NCF", calcs.projectLevelCashFlows.reduce((s, v) => s + v, 0), ...calcs.projectLevelCashFlows],
    [],
    ["Project IRR", calcs.projectIRR / 100],
    ["Project Equity Multiple", calcs.projectEquityMultiple],
    ["GP IRR", calcs.gpIRR / 100],
    ["LP IRR", calcs.lpIRR / 100],
  ];
  const ws6 = X.utils.aoa_to_sheet(wf);
  ws6["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  X.utils.book_append_sheet(wb, ws6, "Waterfall");

  // Download
  const buf = X.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Commercial_UW_${dealName.replace(/\s+/g, "_")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
