import { LTV_BANDS, REQUITY_EXCLUDED_STATES } from "./constants";
import type { LtvBandKey } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DealInput {
  loan_amount: number;
  property_value: number;
  ltv: number;
  loan_purpose: "purchase" | "rate_term" | "cashout";
  borrower_fico: number;
  property_type: string;
  property_state: string;
  monthly_rent: number;
  monthly_taxes: number;
  monthly_insurance: number;
  monthly_hoa: number;
  monthly_flood: number;
  interest_only: boolean;
  escrow_waiver: boolean;
  is_short_term_rental: boolean;
  borrower_type: string;
  income_doc_type: string;
  lock_period_days: number;
  prepay_preference: string;
  broker_points: number;
  num_units: number;
}

export interface LenderProduct {
  id: string;
  lender_id: string;
  lender_name: string;
  lender_short_name: string;
  product_name: string;
  product_type: string;
  lock_period_days: number;
  floor_rate: number | null;
  max_price: number | null;
  min_price: number | null;
  max_ltv_purchase: number | null;
  max_ltv_rate_term: number | null;
  max_ltv_cashout: number | null;
  max_loan_amount: number | null;
  min_loan_amount: number | null;
  state_restrictions: string[];
  eligible_property_types: string[];
  eligible_borrower_types: string[];
  funding_fee: number | null;
  underwriting_fee: number | null;
  processing_fee: number | null;
  desk_review_fee: number | null;
  entity_review_fee: number | null;
  other_fees: Record<string, number>;
  rate_sheet_date: string | null;
}

export interface BaseRate {
  note_rate: number;
  base_price: number;
}

export interface FicoLtvAdjustment {
  loan_purpose: string;
  fico_min: number;
  fico_max: number | null;
  ltv_min: number;
  ltv_max: number;
  adjustment: number | null;
}

export interface PriceAdjustment {
  category: string;
  condition_label: string;
  condition_key: string;
  adj_ltv_0_50: number | null;
  adj_ltv_50_55: number | null;
  adj_ltv_55_60: number | null;
  adj_ltv_60_65: number | null;
  adj_ltv_65_70: number | null;
  adj_ltv_70_75: number | null;
  adj_ltv_75_80: number | null;
  adj_ltv_80_85: number | null;
  adj_ltv_85_90: number | null;
}

export interface RateQuote {
  note_rate: number;
  base_price: number;
  fico_ltv_adjustment: number;
  llpa_adjustments: { name: string; value: number }[];
  total_llpa: number;
  gross_price: number;
  capped_price: number;
  net_price: number;
  ysp: number;
  borrower_points_from_pricing: number;
  broker_points: number;
  total_borrower_cost: number;
  requity_total_comp: number;
  requity_comp_dollars: number;
  monthly_pi: number;
  monthly_pitia: number;
  calculated_dscr: number;
  total_lender_fees: number;
}

export interface ProductResult {
  product_id: string;
  lender_name: string;
  lender_short_name: string;
  product_name: string;
  is_eligible: boolean;
  ineligibility_reasons: string[];
  quotes: RateQuote[];
  best_par_rate: RateQuote | null;
  best_comp_rate: RateQuote | null;
  max_ysp_rate: RateQuote | null;
  total_lender_fees: number;
  rate_sheet_date: string | null;
}

export interface PricingResult {
  deal: DealInput;
  products: ProductResult[];
  best_execution: ProductResult | null;
  calculated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate monthly P&I on a 30yr fixed amortization */
export function calculateMonthlyPI(
  loanAmount: number,
  annualRate: number,
  termYears: number = 30,
  interestOnly: boolean = false
): number {
  if (interestOnly) {
    return (loanAmount * (annualRate / 100)) / 12;
  }
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  if (monthlyRate === 0) return loanAmount / numPayments;
  return (
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

/** Find which LTV band column key applies for a given LTV */
export function getLtvBandKey(ltv: number): LtvBandKey | null {
  for (const band of LTV_BANDS) {
    if (ltv >= band.min && ltv <= band.max) {
      return band.key;
    }
  }
  return null;
}

/** Get the price adjustment value for a given LTV from a price adjustment row */
function getAdjustmentForLtv(
  adj: PriceAdjustment,
  ltv: number
): number | null {
  const bandKey = getLtvBandKey(ltv);
  if (!bandKey) return null;
  return adj[bandKey];
}

/** Find the FICO/LTV adjustment for a deal */
function findFicoLtvAdjustment(
  adjustments: FicoLtvAdjustment[],
  fico: number,
  ltv: number,
  loanPurpose: string
): number | null {
  // Try purpose-specific grid first, then 'universal'
  const purposes = [loanPurpose, "universal"];

  for (const purpose of purposes) {
    const match = adjustments.find((a) => {
      if (a.loan_purpose !== purpose) return false;

      // FICO band match
      const ficoMatch =
        fico >= a.fico_min && (a.fico_max === null || fico <= a.fico_max);

      // LTV band match (inclusive on both ends)
      const ltvMatch = ltv >= a.ltv_min && ltv <= a.ltv_max;

      return ficoMatch && ltvMatch;
    });

    if (match) return match.adjustment;
  }

  return null;
}

/** Determine which LLPA adjusters apply to this deal */
function getApplicableAdjusters(
  adjustments: PriceAdjustment[],
  deal: DealInput,
  calculatedDscr: number
): PriceAdjustment[] {
  return adjustments.filter((adj) => {
    const key = adj.condition_key;

    // Property type adjustments
    if (adj.category === "property_type") {
      if (key.includes("2_4_unit") || key.includes("2-4")) {
        return ["2_4_unit"].includes(deal.property_type);
      }
      if (key.includes("condo") && !key.includes("nw") && !key.includes("non")) {
        return deal.property_type === "condo";
      }
      if (key.includes("nw_condo") || key.includes("non_warrantable") || key.includes("non-warrantable")) {
        return deal.property_type === "nw_condo";
      }
      if (key.includes("condotel")) return deal.property_type === "condotel";
      if (key.includes("5_10") || key.includes("5-10")) return deal.property_type === "5_10_unit";
      if (key.includes("rural")) return deal.property_type === "rural";
      if (key.includes("sfr")) return deal.property_type === "sfr";
      return false;
    }

    // Loan amount adjustments
    if (adj.category === "loan_amount") {
      const amt = deal.loan_amount;
      if (key.includes("lt_100k") || key.includes("<100")) return amt < 100000;
      if (key.includes("100k_150k")) return amt >= 100000 && amt < 150000;
      if (key.includes("150k_250k")) return amt >= 150000 && amt < 250000;
      if (key.includes("gt_1m_lte_1.5m") || key.includes("1m_1.5m")) return amt > 1000000 && amt <= 1500000;
      if (key.includes("gt_1.5m_lte_2m") || key.includes("1.5m_2m")) return amt > 1500000 && amt <= 2000000;
      if (key.includes("gt_2m_lte_2.5m") || key.includes("2m_2.5m")) return amt > 2000000 && amt <= 2500000;
      if (key.includes("gt_2.5m") || key.includes("2.5m_3m")) return amt > 2500000 && amt <= 3000000;
      if (key.includes("gt_3m") || key.includes(">3m")) return amt > 3000000;
      if (key.includes("gt_1m") || key.includes(">1m")) return amt > 1000000;
      return false;
    }

    // Loan purpose adjustments
    if (adj.category === "loan_purpose") {
      if (key.includes("rate_term") || key.includes("r_t") || key.includes("refinance")) {
        return deal.loan_purpose === "rate_term";
      }
      if (key.includes("cashout") || key.includes("cash_out")) {
        return deal.loan_purpose === "cashout";
      }
      return false;
    }

    // DSCR ratio adjustments
    if (adj.category === "dscr_ratio") {
      if (key.includes("gte_1.25") || key.includes(">=1.25")) return calculatedDscr >= 1.25;
      if (key.includes("1.15_1.25") || key.includes("gte_1.15")) return calculatedDscr >= 1.15 && calculatedDscr < 1.25;
      if (key.includes("1.00_1.15") || key.includes("gte_1.00")) return calculatedDscr >= 1.0 && calculatedDscr < 1.15;
      if (key.includes("0.95_1.00") || key.includes("0.95_0.99")) return calculatedDscr >= 0.95 && calculatedDscr < 1.0;
      if (key.includes("0.85_0.95") || key.includes("0.85_0.94")) return calculatedDscr >= 0.85 && calculatedDscr < 0.95;
      if (key.includes("0.75_0.85") || key.includes("lt_0.85")) return calculatedDscr >= 0.75 && calculatedDscr < 0.85;
      if (key.includes("lt_0.75") || key.includes("<0.75")) return calculatedDscr < 0.75;
      // "no_ratio" means no DSCR required (DSCR-only doc type)
      if (key.includes("no_ratio")) return false; // handled by doc type
      return false;
    }

    // Prepay penalty adjustments
    if (adj.category === "prepay_penalty") {
      const pref = deal.prepay_preference;
      if (pref === "flexible") return true; // show all
      if (key.includes("5yr_fixed") || key.includes("fixed_5")) return pref === "fixed_5yr";
      if (key.includes("5yr_declining") || key.includes("declining_5")) return pref === "declining_5yr";
      if (key.includes("4yr_fixed") || key.includes("fixed_4")) return pref === "fixed_4yr";
      if (key.includes("4yr_declining") || key.includes("declining_4")) return pref === "declining_4yr";
      if (key.includes("3yr_fixed") || key.includes("fixed_3")) return pref === "fixed_3yr";
      if (key.includes("3yr_declining") || key.includes("declining_3")) return pref === "declining_3yr";
      if (key.includes("2yr")) return pref === "fixed_2yr" || pref === "declining_2yr";
      if (key.includes("1yr")) return pref === "fixed_1yr";
      if (key.includes("no_ppp") || key.includes("none") || key.includes("no_prepay")) return pref === "no_prepay";
      return false;
    }

    // Interest only
    if (adj.category === "interest_only") {
      return deal.interest_only;
    }

    // Borrower type
    if (adj.category === "borrower_type") {
      if (key.includes("foreign_national")) return deal.borrower_type === "foreign_national";
      if (key.includes("non_perm")) return deal.borrower_type === "non_perm_resident";
      return false;
    }

    // Income doc type
    if (adj.category === "income_doc") {
      if (key.includes("bank_statement")) return deal.income_doc_type === "bank_statement";
      if (key.includes("full_doc")) return deal.income_doc_type === "full_doc";
      if (key.includes("asset")) return deal.income_doc_type === "asset_qualifier";
      if (key.includes("p_and_l") || key.includes("p&l")) return deal.income_doc_type === "p_and_l";
      return false;
    }

    // Escrow waiver
    if (adj.category === "escrow_waiver") {
      return deal.escrow_waiver;
    }

    // Rental type (STR)
    if (adj.category === "rental_type") {
      if (key.includes("str") || key.includes("short_term")) return deal.is_short_term_rental;
      return false;
    }

    return false;
  });
}

// ---------------------------------------------------------------------------
// Main Pricing Engine
// ---------------------------------------------------------------------------

export function priceProduct(
  product: LenderProduct,
  baseRates: BaseRate[],
  ficoLtvAdj: FicoLtvAdjustment[],
  priceAdj: PriceAdjustment[],
  deal: DealInput
): ProductResult {
  const result: ProductResult = {
    product_id: product.id,
    lender_name: product.lender_name,
    lender_short_name: product.lender_short_name,
    product_name: product.product_name,
    is_eligible: true,
    ineligibility_reasons: [],
    quotes: [],
    best_par_rate: null,
    best_comp_rate: null,
    max_ysp_rate: null,
    total_lender_fees: 0,
    rate_sheet_date: product.rate_sheet_date,
  };

  // Calculate total lender fees
  result.total_lender_fees =
    (product.funding_fee || 0) +
    (product.underwriting_fee || 0) +
    (product.processing_fee || 0) +
    (product.desk_review_fee || 0) +
    (product.entity_review_fee || 0);

  if (product.other_fees) {
    for (const fee of Object.values(product.other_fees)) {
      if (typeof fee === "number") result.total_lender_fees += fee;
    }
  }

  // ---- Eligibility checks ----

  // State check (Requity exclusions)
  if (REQUITY_EXCLUDED_STATES.includes(deal.property_state)) {
    result.is_eligible = false;
    result.ineligibility_reasons.push(
      `Requity does not lend in ${deal.property_state}`
    );
    return result;
  }

  // State restrictions from lender
  const restrictions = product.state_restrictions || [];
  if (restrictions.includes(deal.property_state)) {
    result.is_eligible = false;
    result.ineligibility_reasons.push(
      `${deal.property_state} is restricted by ${product.lender_short_name}`
    );
    return result;
  }

  // Loan amount
  if (product.min_loan_amount && deal.loan_amount < product.min_loan_amount) {
    result.is_eligible = false;
    result.ineligibility_reasons.push(
      `Loan amount below minimum ($${product.min_loan_amount.toLocaleString()})`
    );
  }
  if (product.max_loan_amount && deal.loan_amount > product.max_loan_amount) {
    result.is_eligible = false;
    result.ineligibility_reasons.push(
      `Loan amount exceeds maximum ($${product.max_loan_amount.toLocaleString()})`
    );
  }

  // LTV check by purpose
  const maxLtv =
    deal.loan_purpose === "purchase"
      ? product.max_ltv_purchase
      : deal.loan_purpose === "rate_term"
        ? product.max_ltv_rate_term
        : product.max_ltv_cashout;
  if (maxLtv && deal.ltv > maxLtv) {
    result.is_eligible = false;
    result.ineligibility_reasons.push(
      `LTV ${deal.ltv.toFixed(1)}% exceeds max ${maxLtv}% for ${deal.loan_purpose}`
    );
  }

  // Property type eligibility
  const eligibleTypes = product.eligible_property_types || [];
  if (eligibleTypes.length > 0) {
    const typeMatch = eligibleTypes.some(
      (t: string) =>
        t.toLowerCase().replace(/[\s-]/g, "_") === deal.property_type ||
        t.toLowerCase().includes(deal.property_type.replace(/_/g, " "))
    );
    if (!typeMatch) {
      result.is_eligible = false;
      result.ineligibility_reasons.push(
        `Property type "${deal.property_type}" not eligible`
      );
    }
  }

  // Borrower type eligibility
  const eligibleBorrowers = product.eligible_borrower_types || [];
  if (eligibleBorrowers.length > 0) {
    const borrowerMatch = eligibleBorrowers.some(
      (b: string) =>
        b.toLowerCase().replace(/[\s-]/g, "_") === deal.borrower_type ||
        b.toLowerCase().includes(deal.borrower_type.replace(/_/g, " "))
    );
    if (!borrowerMatch) {
      result.is_eligible = false;
      result.ineligibility_reasons.push(
        `Borrower type "${deal.borrower_type}" not eligible`
      );
    }
  }

  if (!result.is_eligible) return result;

  // ---- Rate sweep ----
  const sortedRates = [...baseRates].sort((a, b) => a.note_rate - b.note_rate);

  for (const rate of sortedRates) {
    // Floor rate check
    if (product.floor_rate && rate.note_rate < product.floor_rate) {
      continue;
    }

    // FICO/LTV adjustment
    const ficoLtvValue = findFicoLtvAdjustment(
      ficoLtvAdj,
      deal.borrower_fico,
      deal.ltv,
      deal.loan_purpose
    );

    if (ficoLtvValue === null) {
      // This FICO/LTV combination is not available
      continue;
    }

    // Calculate DSCR at this rate
    const monthlyPI = calculateMonthlyPI(
      deal.loan_amount,
      rate.note_rate,
      30,
      deal.interest_only
    );
    const monthlyPITIA =
      monthlyPI +
      deal.monthly_taxes +
      deal.monthly_insurance +
      deal.monthly_hoa +
      deal.monthly_flood;
    const calculatedDscr =
      monthlyPITIA > 0 ? deal.monthly_rent / monthlyPITIA : 0;

    // Get applicable LLPAs
    const applicableAdj = getApplicableAdjusters(
      priceAdj,
      deal,
      calculatedDscr
    );

    let totalLlpa = 0;
    const adjustmentDetails: { name: string; value: number }[] = [];
    let skipRate = false;

    for (const adj of applicableAdj) {
      const value = getAdjustmentForLtv(adj, deal.ltv);
      if (value === null) {
        // NULL means ineligible at this LTV for this adjuster
        skipRate = true;
        break;
      }
      totalLlpa += value;
      adjustmentDetails.push({ name: adj.condition_label, value });
    }

    if (skipRate) continue;

    // Calculate gross price
    let grossPrice = rate.base_price + ficoLtvValue + totalLlpa;

    // Apply max price cap
    let cappedPrice = grossPrice;
    if (product.max_price && grossPrice > product.max_price) {
      cappedPrice = product.max_price;
    }

    // Apply min price floor
    if (product.min_price && cappedPrice < product.min_price) {
      continue; // Deal doesn't work at this rate
    }

    const netPrice = cappedPrice;

    // Comp calculations
    const ysp = Math.max(0, netPrice - 100);
    const borrowerPointsFromPricing = Math.max(0, 100 - netPrice);
    const totalBorrowerCost = deal.broker_points + borrowerPointsFromPricing;
    const requityTotalComp = deal.broker_points + ysp;
    const requityCompDollars = (requityTotalComp * deal.loan_amount) / 100;

    const quote: RateQuote = {
      note_rate: rate.note_rate,
      base_price: rate.base_price,
      fico_ltv_adjustment: ficoLtvValue,
      llpa_adjustments: adjustmentDetails,
      total_llpa: totalLlpa,
      gross_price: grossPrice,
      capped_price: cappedPrice,
      net_price: netPrice,
      ysp,
      borrower_points_from_pricing: borrowerPointsFromPricing,
      broker_points: deal.broker_points,
      total_borrower_cost: totalBorrowerCost,
      requity_total_comp: requityTotalComp,
      requity_comp_dollars: requityCompDollars,
      monthly_pi: Math.round(monthlyPI * 100) / 100,
      monthly_pitia: Math.round(monthlyPITIA * 100) / 100,
      calculated_dscr: Math.round(calculatedDscr * 100) / 100,
      total_lender_fees: result.total_lender_fees,
    };

    result.quotes.push(quote);
  }

  // ---- Determine best execution scenarios ----

  // Best par rate: lowest rate where net_price >= 100 (no cost to borrower)
  const parQuotes = result.quotes.filter((q) => q.net_price >= 100);
  if (parQuotes.length > 0) {
    result.best_par_rate = parQuotes[0]; // Already sorted by rate asc
  }

  // Best comp rate: lowest rate where YSP >= 1.5 (target comp)
  const compQuotes = result.quotes.filter((q) => q.ysp >= 1.5);
  if (compQuotes.length > 0) {
    result.best_comp_rate = compQuotes[0];
  }

  // Max YSP rate: rate that maximizes back-end comp
  if (result.quotes.length > 0) {
    result.max_ysp_rate = result.quotes.reduce((best, q) =>
      q.ysp > best.ysp ? q : best
    );
  }

  return result;
}

/** Run pricing across all active products */
export function runPricing(
  products: Array<{
    product: LenderProduct;
    baseRates: BaseRate[];
    ficoLtvAdj: FicoLtvAdjustment[];
    priceAdj: PriceAdjustment[];
  }>,
  deal: DealInput
): PricingResult {
  const results = products.map(({ product, baseRates, ficoLtvAdj, priceAdj }) =>
    priceProduct(product, baseRates, ficoLtvAdj, priceAdj, deal)
  );

  // Find best execution (lowest total borrower cost at par or better)
  let bestExecution: ProductResult | null = null;
  let bestCost = Infinity;

  for (const result of results) {
    if (result.best_par_rate && result.best_par_rate.total_borrower_cost < bestCost) {
      bestCost = result.best_par_rate.total_borrower_cost;
      bestExecution = result;
    }
  }

  return {
    deal,
    products: results,
    best_execution: bestExecution,
    calculated_at: new Date().toISOString(),
  };
}
