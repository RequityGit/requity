/**
 * Commercial Underwriting Calculator — client-side computation engine
 *
 * Pure function operating on CommercialInputs → CommercialOutputs.
 * Used in the sandbox for real-time pro forma computation.
 */

import type { CommercialInputs, CommercialOutputs, ProFormaYear } from "./commercial-types";

function safe(v: number | null | undefined): number {
  return v ?? 0;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function computeCommercialOutputs(inputs: CommercialInputs): CommercialOutputs {
  const units = safe(inputs.total_units);
  const totalSf = safe(inputs.total_sf);
  const purchasePrice = safe(inputs.purchase_price);
  const equityInvested = safe(inputs.equity_invested);

  // ── Rent Roll Totals ──
  let totalRentAnnual = 0;
  let totalMarketAnnual = 0;
  for (const u of inputs.rent_roll) {
    totalRentAnnual += (safe(u.current_monthly_rent) + safe(u.cam_nnn) + safe(u.other_income)) * 12;
    totalMarketAnnual += (safe(u.market_rent) + safe(u.cam_nnn) + safe(u.other_income)) * 12;
  }

  // ── Ancillary Income ──
  let totalAncillaryCurrent = 0;
  let totalAncillaryStabilized = 0;
  for (const a of inputs.ancillary_income) {
    totalAncillaryCurrent += safe(a.current_annual);
    totalAncillaryStabilized += safe(a.stabilized_annual);
  }

  // ── Gross Potential Income ──
  const currentGpi = totalRentAnnual + totalAncillaryCurrent;
  const stabilizedGpi = totalMarketAnnual + totalAncillaryStabilized;

  // ── Year 1 Vacancy & Bad Debt ──
  const yr1VacancyPct = safe(inputs.vacancy_pct_yr1);
  const yr1BadDebtPct = safe(inputs.bad_debt_pct);
  const currentVacancy = currentGpi * (yr1VacancyPct / 100);
  const currentBadDebt = currentGpi * (yr1BadDebtPct / 100);
  const currentEgi = currentGpi - currentVacancy - currentBadDebt;

  // ── Year 1 Operating Expenses ──
  // Management fee is % of EGI
  const yr1MgmtFeePct = safe(inputs.yr1_mgmt_fee_pct);
  const yr1MgmtFee = currentEgi * (yr1MgmtFeePct / 100);

  // Each expense: use yr1 override if provided, else T12 actual
  const yr1Taxes = inputs.yr1_taxes ?? safe(inputs.t12_taxes);
  const yr1Insurance = inputs.yr1_insurance ?? safe(inputs.t12_insurance);
  const yr1Utilities = inputs.yr1_utilities ?? safe(inputs.t12_utilities);
  const yr1Repairs = inputs.yr1_repairs ?? safe(inputs.t12_repairs);
  const yr1Contract = inputs.yr1_contract ?? safe(inputs.t12_contract_services);
  const yr1Payroll = inputs.yr1_payroll ?? safe(inputs.t12_payroll);
  const yr1Marketing = inputs.yr1_marketing ?? safe(inputs.t12_marketing);
  const yr1Ga = inputs.yr1_ga ?? safe(inputs.t12_ga);
  const yr1Reserve = inputs.yr1_reserve ?? safe(inputs.t12_replacement_reserve);

  const currentTotalOpex =
    yr1MgmtFee + yr1Taxes + yr1Insurance + yr1Utilities + yr1Repairs +
    yr1Contract + yr1Payroll + yr1Marketing + yr1Ga + yr1Reserve;

  const currentNoi = currentEgi - currentTotalOpex;

  // ── Bridge Loan Debt Service ──
  const bridgeAmount = safe(inputs.bridge_loan_amount);
  const bridgeRate = safe(inputs.bridge_rate);
  const monthlyDebtService = bridgeAmount * (bridgeRate / 100 / 12);
  const annualDebtService = monthlyDebtService * 12;
  const bridgeOriginationFee = bridgeAmount * (safe(inputs.bridge_origination_pts) / 100);

  // ── Key Ratios ──
  const goingInCapRate = purchasePrice > 0 ? (currentNoi / purchasePrice) * 100 : null;
  const dscr = annualDebtService > 0 ? currentNoi / annualDebtService : null;
  const ncf = currentNoi - annualDebtService;
  const cashOnCash = equityInvested > 0 ? (ncf / equityInvested) * 100 : null;
  const debtYield = bridgeAmount > 0 ? (currentNoi / bridgeAmount) * 100 : null;

  // ── Per-Unit / Per-SF Metrics ──
  const pricePerUnit = units > 0 ? purchasePrice / units : null;
  const pricePerSf = totalSf > 0 ? purchasePrice / totalSf : null;
  const noiPerUnit = units > 0 ? currentNoi / units : null;

  // ── 5-Year Pro Forma ──
  const proforma: ProFormaYear[] = [];
  let prevGpi = currentGpi;
  const expenseCategories = {
    mgmt_fee: yr1MgmtFee,
    taxes: yr1Taxes,
    insurance: yr1Insurance,
    utilities: yr1Utilities,
    repairs: yr1Repairs,
    contract_services: yr1Contract,
    payroll: yr1Payroll,
    marketing: yr1Marketing,
    ga: yr1Ga,
    replacement_reserve: yr1Reserve,
  };
  let prevExpenses = { ...expenseCategories };

  const rentGrowth = [
    safe(inputs.rent_growth_yr1),
    safe(inputs.rent_growth_yr2),
    safe(inputs.rent_growth_yr3),
    safe(inputs.rent_growth_yr4),
    safe(inputs.rent_growth_yr5),
  ];
  const expenseGrowth = [
    safe(inputs.expense_growth_yr1),
    safe(inputs.expense_growth_yr2),
    safe(inputs.expense_growth_yr3),
    safe(inputs.expense_growth_yr4),
    safe(inputs.expense_growth_yr5),
  ];
  const vacancyPcts = [
    safe(inputs.vacancy_pct_yr1),
    safe(inputs.vacancy_pct_yr2),
    safe(inputs.vacancy_pct_yr3),
    safe(inputs.vacancy_pct_yr4),
    safe(inputs.vacancy_pct_yr5),
  ];

  for (let yr = 0; yr < 5; yr++) {
    // Year 1 uses base values; Years 2-5 grow from previous
    const gpi = yr === 0 ? prevGpi : prevGpi * (1 + rentGrowth[yr] / 100);
    const vacPct = vacancyPcts[yr];
    const bdPct = safe(inputs.bad_debt_pct);
    const vacancy = gpi * (vacPct / 100);
    const badDebt = gpi * (bdPct / 100);
    const egi = gpi - vacancy - badDebt;

    // Grow expenses (Year 1 = base, subsequent years grow)
    const expenses = yr === 0
      ? { ...prevExpenses }
      : {
          mgmt_fee: egi * (yr1MgmtFeePct / 100), // Mgmt fee is always % of EGI
          taxes: prevExpenses.taxes * (1 + expenseGrowth[yr] / 100),
          insurance: prevExpenses.insurance * (1 + expenseGrowth[yr] / 100),
          utilities: prevExpenses.utilities * (1 + expenseGrowth[yr] / 100),
          repairs: prevExpenses.repairs * (1 + expenseGrowth[yr] / 100),
          contract_services: prevExpenses.contract_services * (1 + expenseGrowth[yr] / 100),
          payroll: prevExpenses.payroll * (1 + expenseGrowth[yr] / 100),
          marketing: prevExpenses.marketing * (1 + expenseGrowth[yr] / 100),
          ga: prevExpenses.ga * (1 + expenseGrowth[yr] / 100),
          replacement_reserve: prevExpenses.replacement_reserve * (1 + expenseGrowth[yr] / 100),
        };

    const totalOpex =
      expenses.mgmt_fee + expenses.taxes + expenses.insurance +
      expenses.utilities + expenses.repairs + expenses.contract_services +
      expenses.payroll + expenses.marketing + expenses.ga +
      expenses.replacement_reserve;

    const noi = egi - totalOpex;
    const yrDebtService = annualDebtService;
    const yrNcf = noi - yrDebtService;
    const yrDscr = yrDebtService > 0 ? noi / yrDebtService : null;
    const yrCapRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : null;

    proforma.push({
      year: yr + 1,
      gpi: round2(gpi),
      vacancy: round2(vacancy),
      bad_debt: round2(badDebt),
      egi: round2(egi),
      mgmt_fee: round2(expenses.mgmt_fee),
      taxes: round2(expenses.taxes),
      insurance: round2(expenses.insurance),
      utilities: round2(expenses.utilities),
      repairs: round2(expenses.repairs),
      contract_services: round2(expenses.contract_services),
      payroll: round2(expenses.payroll),
      marketing: round2(expenses.marketing),
      ga: round2(expenses.ga),
      replacement_reserve: round2(expenses.replacement_reserve),
      total_opex: round2(totalOpex),
      noi: round2(noi),
      debt_service: round2(yrDebtService),
      ncf: round2(yrNcf),
      dscr: yrDscr !== null ? round2(yrDscr) : null,
      cap_rate: yrCapRate !== null ? round2(yrCapRate) : null,
    });

    prevGpi = gpi;
    prevExpenses = expenses;
  }

  return {
    total_rent_roll_annual: round2(totalRentAnnual),
    total_market_annual: round2(totalMarketAnnual),
    total_ancillary_current: round2(totalAncillaryCurrent),
    total_ancillary_stabilized: round2(totalAncillaryStabilized),
    current_gpi: round2(currentGpi),
    stabilized_gpi: round2(stabilizedGpi),
    current_vacancy: round2(currentVacancy),
    current_bad_debt: round2(currentBadDebt),
    current_egi: round2(currentEgi),
    current_total_opex: round2(currentTotalOpex),
    current_noi: round2(currentNoi),
    going_in_cap_rate: goingInCapRate !== null ? round2(goingInCapRate) : null,
    dscr: dscr !== null ? round2(dscr) : null,
    cash_on_cash: cashOnCash !== null ? round2(cashOnCash) : null,
    debt_yield: debtYield !== null ? round2(debtYield) : null,
    price_per_unit: pricePerUnit !== null ? round2(pricePerUnit) : null,
    price_per_sf: pricePerSf !== null ? round2(pricePerSf) : null,
    noi_per_unit: noiPerUnit !== null ? round2(noiPerUnit) : null,
    annual_debt_service: round2(annualDebtService),
    monthly_debt_service: round2(monthlyDebtService),
    bridge_origination_fee: round2(bridgeOriginationFee),
    proforma,
  };
}
