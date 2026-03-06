// Supabase Edge Function: calculate-pricing
// Full deal pricing calculator for RTL Fix & Flip loans.
// Accepts deal parameters, fetches program pricing, applies leverage adjustments,
// and returns a complete deal summary with all computed fields.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DealInput {
  program_id?: string;
  purchase_price: number;
  rehab_budget: number;
  after_repair_value: number;
  credit_score?: number;
  experience_deals_24mo?: number;
  legal_status?: string;
  property_type?: string;
  flood_zone?: boolean;
  rural_status?: string;
  loan_term_months?: number;
  requested_loan_amount?: number;
  holding_period_months?: number;
  annual_property_tax?: number;
  annual_insurance?: number;
  monthly_utilities?: number;
  monthly_hoa?: number;
  title_closing_escrow?: number;
  sales_disposition_pct?: number;
  num_partners?: number;
  heated_sqft?: number;
  mobilization_draw?: number;
  lender_fees_flat?: number;
  // Leverage adjuster overrides (for Balance Sheet)
  applied_adjusters?: string[];
}

interface PricingProgram {
  id: string;
  program_id: string;
  loan_type: string;
  program_name: string;
  arv_label: string;
  interest_rate: number;
  rate_type: string;
  origination_points: number;
  min_origination_fee: number;
  points_note: string;
  max_ltv: number;
  ltv_note: string;
  max_ltc: number;
  ltc_note: string;
  max_ltp: number;
  loan_term_months: number;
  exit_points: number;
  term_note: string;
  legal_doc_fee: number;
  bpo_appraisal_cost: number;
  bpo_appraisal_note: string;
  min_credit_score: number;
  min_deals_24mo: number;
  citizenship: string;
  version: number;
  is_current: boolean;
}

interface LeverageAdjuster {
  id: string;
  risk_factor: string;
  display_name: string;
  condition_description: string;
  ltc_adjustment: number;
  ltv_adjustment: number;
  note: string;
  is_active: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse input
    const input: DealInput = await req.json();

    // Validate required fields
    if (
      input.purchase_price == null ||
      input.rehab_budget == null ||
      input.after_repair_value == null
    ) {
      return new Response(
        JSON.stringify({
          error:
            "purchase_price, rehab_budget, and after_repair_value are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Admin client for DB queries
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ---------------------------------------------------------------
    // 1. Determine program eligibility if no program_id provided
    // ---------------------------------------------------------------
    let selectedProgramId = input.program_id;

    if (!selectedProgramId) {
      // Check Premier eligibility first
      const premierEligible =
        (input.credit_score ?? 0) >= 650 &&
        (input.experience_deals_24mo ?? 0) >= 3 &&
        (input.legal_status === "US Citizen" ||
          input.legal_status === "Permanent Resident");

      selectedProgramId = premierEligible ? "ff_premier" : "ff_balance";
    }

    // ---------------------------------------------------------------
    // 2. Fetch the current pricing program
    // ---------------------------------------------------------------
    const { data: programData, error: programError } = await adminClient
      .from("pricing_programs")
      .select("*")
      .eq("program_id", selectedProgramId)
      .eq("is_current", true)
      .single();

    if (programError || !programData) {
      return new Response(
        JSON.stringify({
          error: `Pricing program not found: ${selectedProgramId}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const program = programData as PricingProgram;

    // ---------------------------------------------------------------
    // 3. Run eligibility check (for Premier)
    // ---------------------------------------------------------------
    const eligibility = {
      credit_score_check: "N/A" as string,
      experience_check: "N/A" as string,
      citizenship_check: "N/A" as string,
      appraisal_check: input.after_repair_value > 0 ? "PASS" : "N/A",
      overall_result: "NOT ELIGIBLE" as string,
      notes: [] as string[],
    };

    if (selectedProgramId === "ff_premier") {
      // Credit score check
      if (input.credit_score != null) {
        eligibility.credit_score_check =
          input.credit_score >= program.min_credit_score ? "PASS" : "FAIL";
        if (eligibility.credit_score_check === "FAIL") {
          eligibility.notes.push(
            `Credit score ${input.credit_score} below minimum ${program.min_credit_score}`
          );
        }
      }

      // Experience check
      if (input.experience_deals_24mo != null) {
        eligibility.experience_check =
          input.experience_deals_24mo >= program.min_deals_24mo
            ? "PASS"
            : "FAIL";
        if (eligibility.experience_check === "FAIL") {
          eligibility.notes.push(
            `Experience ${input.experience_deals_24mo} deals below minimum ${program.min_deals_24mo}`
          );
        }
      }

      // Citizenship check
      if (input.legal_status) {
        if (program.citizenship === "any") {
          eligibility.citizenship_check = "PASS";
        } else if (
          program.citizenship === "us_resident" &&
          (input.legal_status === "US Citizen" ||
            input.legal_status === "Permanent Resident")
        ) {
          eligibility.citizenship_check = "PASS";
        } else {
          eligibility.citizenship_check = "FAIL";
          eligibility.notes.push(
            `Legal status "${input.legal_status}" does not meet requirement`
          );
        }
      }

      // Overall
      const checks = [
        eligibility.credit_score_check,
        eligibility.experience_check,
        eligibility.citizenship_check,
      ];
      if (checks.some((c) => c === "FAIL")) {
        eligibility.overall_result = "NOT ELIGIBLE";
      } else if (checks.every((c) => c === "PASS")) {
        eligibility.overall_result = "ELIGIBLE";
      }
    }

    // ---------------------------------------------------------------
    // 4. Calculate leverage adjustments (Balance Sheet only)
    // ---------------------------------------------------------------
    let effectiveLtv = program.max_ltv;
    let effectiveLtc = program.max_ltc;
    let effectiveLtp = program.max_ltp;
    const appliedAdjustments: Array<{
      risk_factor: string;
      display_name: string;
      ltc_adjustment: number;
      ltv_adjustment: number;
    }> = [];

    if (selectedProgramId === "ff_balance") {
      // Fetch all active adjusters
      const { data: adjusters } = await adminClient
        .from("leverage_adjusters")
        .select("*")
        .eq("program_id", "ff_balance")
        .eq("is_active", true)
        .order("sort_order");

      if (adjusters) {
        for (const adj of adjusters as LeverageAdjuster[]) {
          let applies = false;

          // Auto-detect applicable adjusters
          if (input.applied_adjusters?.includes(adj.risk_factor)) {
            applies = true;
          } else {
            // Auto-detect based on input data
            switch (adj.risk_factor) {
              case "foreign_national":
                applies = input.legal_status === "Foreign National";
                break;
              case "low_credit":
                applies =
                  input.credit_score != null && input.credit_score < 600;
                break;
              case "no_experience":
                applies =
                  input.experience_deals_24mo != null &&
                  input.experience_deals_24mo === 0;
                break;
              case "rural_property":
                applies = input.rural_status === "Rural";
                break;
              case "flood_zone":
                applies = input.flood_zone === true;
                break;
              case "cash_out_refinance":
                // Must be explicitly set via applied_adjusters
                break;
              case "condo_townhouse":
                applies =
                  input.property_type === "Condo" ||
                  input.property_type === "Townhouse" ||
                  input.property_type === "condo" ||
                  input.property_type === "townhouse";
                break;
              case "high_rehab_ratio":
                applies =
                  input.purchase_price > 0 &&
                  input.rehab_budget / input.purchase_price > 0.5;
                break;
              case "extended_term":
                applies =
                  (input.loan_term_months ?? program.loan_term_months) > 12;
                break;
              case "low_arv_confidence":
                // Must be explicitly set via applied_adjusters
                break;
            }
          }

          if (applies) {
            effectiveLtc += adj.ltc_adjustment;
            effectiveLtv += adj.ltv_adjustment;
            effectiveLtp += adj.ltc_adjustment; // LTP adjusts same as LTC
            appliedAdjustments.push({
              risk_factor: adj.risk_factor,
              display_name: adj.display_name,
              ltc_adjustment: adj.ltc_adjustment,
              ltv_adjustment: adj.ltv_adjustment,
            });
          }
        }
      }
    }

    // ---------------------------------------------------------------
    // 5. Loan sizing (percentages stored as whole numbers, e.g. 70 = 70%)
    // ---------------------------------------------------------------
    const purchasePrice = input.purchase_price;
    const rehabBudget = input.rehab_budget;
    const arv = input.after_repair_value;
    const totalProjectCost = purchasePrice + rehabBudget;
    const heatedSqft = input.heated_sqft ?? 0;
    const holdingMonths =
      input.holding_period_months ?? program.loan_term_months;
    const numPartners = input.num_partners ?? 1;
    const salesDispPct = input.sales_disposition_pct ?? 3.0;
    const titleEscrow = input.title_closing_escrow ?? 0;
    const lenderFeesFlat = input.lender_fees_flat ?? 0;
    const mobilizationDraw = input.mobilization_draw ?? 0;

    const maxLoanArv = (effectiveLtv / 100) * arv;
    const maxLoanLtc = (effectiveLtc / 100) * totalProjectCost;
    const maxLoanLtp = (effectiveLtp / 100) * purchasePrice;
    const bindingConstraint = Math.min(maxLoanArv, maxLoanLtc, maxLoanLtp);

    // Check if requested exceeds max
    const requestedLoanAmount = input.requested_loan_amount ?? 0;
    const requestedExceedsMax =
      requestedLoanAmount > 0 && requestedLoanAmount > bindingConstraint;

    // Total loan = requested (if within limits) or binding constraint
    const totalLoan =
      requestedLoanAmount > 0 && !requestedExceedsMax
        ? requestedLoanAmount
        : bindingConstraint;

    // ---------------------------------------------------------------
    // 6. Loan allocation
    // ---------------------------------------------------------------
    const allocatedToPurchase = Math.min(totalLoan, purchasePrice);
    const allocatedToRehab = totalLoan - allocatedToPurchase;
    const lenderCashAtClosing = allocatedToPurchase + mobilizationDraw;
    const remainingRehabDraws = allocatedToRehab - mobilizationDraw;

    // ---------------------------------------------------------------
    // 7. Monthly interest payment: loan * (rate / 12)
    // ---------------------------------------------------------------
    const interestRate = program.interest_rate;
    const monthlyInterest = totalLoan * (interestRate / 100 / 12);

    // ---------------------------------------------------------------
    // 8. Holding costs
    // ---------------------------------------------------------------
    const monthlyPropertyTax = (input.annual_property_tax ?? 0) / 12;
    const monthlyInsurance = (input.annual_insurance ?? 0) / 12;
    const monthlyUtilities = input.monthly_utilities ?? 0;
    const monthlyHoa = input.monthly_hoa ?? 0;

    const totalMonthlyHolding =
      monthlyInterest +
      monthlyPropertyTax +
      monthlyInsurance +
      monthlyUtilities +
      monthlyHoa;
    const totalHoldingCosts = totalMonthlyHolding * holdingMonths;

    // ---------------------------------------------------------------
    // 9. Closing costs
    // ---------------------------------------------------------------
    const originationFee = Math.max(
      totalLoan * (program.origination_points / 100),
      program.min_origination_fee
    );
    const prepaidInterest = totalLoan * (interestRate / 100 / 360) * 15;
    const totalClosingCosts =
      originationFee + titleEscrow + prepaidInterest + lenderFeesFlat;

    // ---------------------------------------------------------------
    // 10. Total borrower cash to close
    // ---------------------------------------------------------------
    const cashToPurchaseGap = purchasePrice - allocatedToPurchase;
    const cashToRehabGap = rehabBudget - allocatedToRehab;
    const totalCashToClose =
      cashToPurchaseGap + cashToRehabGap + totalClosingCosts;
    const cashToClosePctOfPp =
      purchasePrice > 0 ? (totalCashToClose / purchasePrice) * 100 : 0;

    // ---------------------------------------------------------------
    // 11. Borrower P&L
    // ---------------------------------------------------------------
    const grossSaleProceeds = arv;
    const salesCosts = arv * (salesDispPct / 100);
    const netSaleProceeds = grossSaleProceeds - salesCosts;
    const netProfit =
      netSaleProceeds -
      purchasePrice -
      rehabBudget -
      totalClosingCosts -
      totalHoldingCosts;

    // ROI: cash-on-cash
    const borrowerRoi =
      totalCashToClose > 0 ? (netProfit / totalCashToClose) * 100 : 0;
    const annualizedRoi =
      holdingMonths > 0 ? borrowerRoi * (12 / holdingMonths) : 0;
    const cashPerPartner =
      numPartners > 0 ? totalCashToClose / numPartners : totalCashToClose;
    const profitPerPartner =
      numPartners > 0 ? netProfit / numPartners : netProfit;

    // ---------------------------------------------------------------
    // 12. Credit box metrics
    // ---------------------------------------------------------------
    const ltvArv = arv > 0 ? (totalLoan / arv) * 100 : 0;
    const ltc =
      totalProjectCost > 0 ? (totalLoan / totalProjectCost) * 100 : 0;
    const ltp = purchasePrice > 0 ? (totalLoan / purchasePrice) * 100 : 0;
    const day1Ltv = arv > 0 ? (lenderCashAtClosing / arv) * 100 : 0;
    const loanPerSqft = heatedSqft > 0 ? totalLoan / heatedSqft : 0;
    const borrowerEquityAtClosing = totalCashToClose;
    const arvMinusLoanCushion = arv - totalLoan;
    const breakEvenSalePrice =
      totalLoan + totalClosingCosts + totalHoldingCosts + salesCosts;

    // Per-sqft metrics
    const purchasePricePerSqft =
      heatedSqft > 0 ? purchasePrice / heatedSqft : 0;
    const arvPerSqft = heatedSqft > 0 ? arv / heatedSqft : 0;
    const rehabPerSqft = heatedSqft > 0 ? rehabBudget / heatedSqft : 0;

    // ---------------------------------------------------------------
    // 13. Build response
    // ---------------------------------------------------------------
    const response = {
      // Program info
      program: {
        program_id: program.program_id,
        program_name: program.program_name,
        version: program.version,
        interest_rate: program.interest_rate,
        rate_type: program.rate_type,
        origination_points: program.origination_points,
        min_origination_fee: program.min_origination_fee,
        loan_term_months: program.loan_term_months,
        exit_points: program.exit_points,
        legal_doc_fee: program.legal_doc_fee,
        bpo_appraisal_cost: program.bpo_appraisal_cost,
      },

      // Eligibility (Premier only)
      eligibility:
        selectedProgramId === "ff_premier" ? eligibility : undefined,

      // Leverage adjustments (Balance Sheet only)
      leverage_adjustments:
        selectedProgramId === "ff_balance"
          ? {
              base_ltv: program.max_ltv,
              base_ltc: program.max_ltc,
              base_ltp: program.max_ltp,
              adjustments_applied: appliedAdjustments,
              effective_ltv: effectiveLtv,
              effective_ltc: effectiveLtc,
              effective_ltp: effectiveLtp,
            }
          : undefined,

      // Deal summary
      deal_summary: {
        purchase_price: purchasePrice,
        rehab_budget: rehabBudget,
        total_project_cost: totalProjectCost,
        after_repair_value: arv,
        holding_period_months: holdingMonths,
      },

      // Per-sqft metrics
      per_sqft_metrics:
        heatedSqft > 0
          ? {
              heated_sqft: heatedSqft,
              purchase_price_per_sqft: round2(purchasePricePerSqft),
              arv_per_sqft: round2(arvPerSqft),
              rehab_per_sqft: round2(rehabPerSqft),
              loan_per_sqft: round2(loanPerSqft),
            }
          : undefined,

      // Loan sizing
      loan_sizing: {
        max_ltv: effectiveLtv,
        max_ltc: effectiveLtc,
        max_ltp: effectiveLtp,
        max_loan_arv_constraint: round2(maxLoanArv),
        max_loan_ltc_constraint: round2(maxLoanLtc),
        max_loan_ltp_constraint: round2(maxLoanLtp),
        binding_constraint: round2(bindingConstraint),
        binding_constraint_type:
          bindingConstraint === maxLoanArv
            ? "ARV"
            : bindingConstraint === maxLoanLtc
              ? "LTC"
              : "LTP",
      },

      // Proposed loan
      proposed_loan: {
        requested_loan_amount: requestedLoanAmount || null,
        requested_exceeds_max: requestedExceedsMax,
        total_loan_amount: round2(totalLoan),
        allocated_to_purchase: round2(allocatedToPurchase),
        allocated_to_rehab: round2(allocatedToRehab),
        mobilization_draw: mobilizationDraw,
        lender_cash_at_closing: round2(lenderCashAtClosing),
        remaining_rehab_draws: round2(remainingRehabDraws),
      },

      // Holding costs
      holding_costs: {
        monthly_interest_payment: round2(monthlyInterest),
        monthly_property_tax: round2(monthlyPropertyTax),
        monthly_insurance: round2(monthlyInsurance),
        monthly_utilities: monthlyUtilities,
        monthly_hoa: monthlyHoa,
        total_monthly_holding_cost: round2(totalMonthlyHolding),
        total_holding_costs: round2(totalHoldingCosts),
      },

      // Closing costs
      closing_costs: {
        origination_fee_amount: round2(originationFee),
        title_closing_escrow: titleEscrow,
        prepaid_interest_est: round2(prepaidInterest),
        lender_fees_flat: lenderFeesFlat,
        total_closing_costs: round2(totalClosingCosts),
        total_borrower_cash_to_close: round2(totalCashToClose),
        cash_to_close_pct_of_pp: round2(cashToClosePctOfPp),
      },

      // Borrower P&L
      borrower_pnl: {
        sales_disposition_pct: salesDispPct,
        gross_sale_proceeds: grossSaleProceeds,
        sales_costs: round2(salesCosts),
        net_sale_proceeds: round2(netSaleProceeds),
        net_profit: round2(netProfit),
        borrower_roi: round2(borrowerRoi),
        annualized_roi: round2(annualizedRoi),
        num_partners: numPartners,
        cash_per_partner: round2(cashPerPartner),
        profit_per_partner: round2(profitPerPartner),
      },

      // Credit box metrics
      credit_box: {
        ltv_arv: round2(ltvArv),
        ltc: round2(ltc),
        ltp: round2(ltp),
        day1_ltv: round2(day1Ltv),
        loan_per_sqft: heatedSqft > 0 ? round2(loanPerSqft) : null,
        borrower_equity_at_closing: round2(borrowerEquityAtClosing),
        arv_minus_loan_cushion: round2(arvMinusLoanCushion),
        break_even_sale_price: round2(breakEvenSalePrice),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("calculate-pricing error:", err);
    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
