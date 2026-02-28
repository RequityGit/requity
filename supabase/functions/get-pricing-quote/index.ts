// Supabase Edge Function: get-pricing-quote
// PUBLIC endpoint (no auth required) for the marketing site "Get a Quote" widget.
// Accepts minimal deal params, runs both programs, returns which the borrower
// qualifies for and estimated terms.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteInput {
  purchase_price: number;
  rehab_budget: number;
  after_repair_value: number;
  credit_score?: number;
  experience_deals_24mo?: number;
  property_type?: string;
  legal_status?: string;
}

interface ProgramQuote {
  program_id: string;
  program_name: string;
  eligible: boolean;
  eligibility_notes: string[];
  interest_rate: number;
  origination_points: number;
  max_ltv: number;
  max_ltc: number;
  max_ltp: number;
  loan_term_months: number;
  exit_points: number;
  max_loan_amount: number;
  binding_constraint: number;
  binding_constraint_type: string;
  estimated_monthly_interest: number;
  estimated_origination_fee: number;
  legal_doc_fee: number;
  bpo_appraisal_cost: number;
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

    // Parse input — NO auth required
    const input: QuoteInput = await req.json();

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

    // Validate positive numbers
    if (
      input.purchase_price <= 0 ||
      input.rehab_budget < 0 ||
      input.after_repair_value <= 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "purchase_price and after_repair_value must be positive, rehab_budget must be non-negative",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role since this is a public endpoint
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch both current programs
    const { data: programs, error: programError } = await adminClient
      .from("pricing_programs")
      .select("*")
      .eq("is_current", true)
      .in("program_id", ["ff_premier", "ff_balance"]);

    if (programError || !programs || programs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pricing programs available" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const totalProjectCost = input.purchase_price + input.rehab_budget;
    const quotes: ProgramQuote[] = [];

    for (const program of programs) {
      const eligibilityNotes: string[] = [];
      let eligible = true;

      // Check eligibility for Premier
      if (program.program_id === "ff_premier") {
        if (program.min_credit_score > 0) {
          if (input.credit_score == null) {
            eligibilityNotes.push(
              `Requires minimum ${program.min_credit_score} FICO`
            );
            eligible = false;
          } else if (input.credit_score < program.min_credit_score) {
            eligibilityNotes.push(
              `Credit score ${input.credit_score} below minimum ${program.min_credit_score}`
            );
            eligible = false;
          }
        }

        if (program.min_deals_24mo > 0) {
          if (input.experience_deals_24mo == null) {
            eligibilityNotes.push(
              `Requires minimum ${program.min_deals_24mo} deals in 24 months`
            );
            eligible = false;
          } else if (input.experience_deals_24mo < program.min_deals_24mo) {
            eligibilityNotes.push(
              `Experience ${input.experience_deals_24mo} deals below minimum ${program.min_deals_24mo}`
            );
            eligible = false;
          }
        }

        if (
          program.citizenship === "us_resident" &&
          input.legal_status &&
          input.legal_status !== "US Citizen" &&
          input.legal_status !== "Permanent Resident"
        ) {
          eligibilityNotes.push("Requires US Citizen or Permanent Resident");
          eligible = false;
        }
      }

      // Calculate loan sizing (percentages stored as whole numbers)
      const maxLtv = program.max_ltv;
      const maxLtc = program.max_ltc;
      const maxLtp = program.max_ltp;

      const maxLoanArv = (maxLtv / 100) * input.after_repair_value;
      const maxLoanLtc = (maxLtc / 100) * totalProjectCost;
      const maxLoanLtp = (maxLtp / 100) * input.purchase_price;
      const bindingConstraint = Math.min(maxLoanArv, maxLoanLtc, maxLoanLtp);
      const bindingType =
        bindingConstraint === maxLoanArv
          ? "ARV"
          : bindingConstraint === maxLoanLtc
            ? "LTC"
            : "LTP";

      // Estimated costs
      const estimatedMonthlyInterest =
        bindingConstraint * (program.interest_rate / 100 / 12);
      const estimatedOriginationFee = Math.max(
        bindingConstraint * (program.origination_points / 100),
        program.min_origination_fee
      );

      quotes.push({
        program_id: program.program_id,
        program_name: program.program_name,
        eligible,
        eligibility_notes: eligibilityNotes,
        interest_rate: program.interest_rate,
        origination_points: program.origination_points,
        max_ltv: maxLtv,
        max_ltc: maxLtc,
        max_ltp: maxLtp,
        loan_term_months: program.loan_term_months,
        exit_points: program.exit_points,
        max_loan_amount: round2(bindingConstraint),
        binding_constraint: round2(bindingConstraint),
        binding_constraint_type: bindingType,
        estimated_monthly_interest: round2(estimatedMonthlyInterest),
        estimated_origination_fee: round2(estimatedOriginationFee),
        legal_doc_fee: program.legal_doc_fee,
        bpo_appraisal_cost: program.bpo_appraisal_cost,
      });
    }

    // Sort: eligible programs first, then by interest rate (ascending)
    quotes.sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return a.interest_rate - b.interest_rate;
    });

    const bestProgram = quotes.find((q) => q.eligible) ?? quotes[0];

    const response = {
      deal_summary: {
        purchase_price: input.purchase_price,
        rehab_budget: input.rehab_budget,
        total_project_cost: totalProjectCost,
        after_repair_value: input.after_repair_value,
      },
      recommended_program: bestProgram?.program_id ?? null,
      programs: quotes,
      disclaimer:
        "This is an estimate only. Actual terms may vary based on full underwriting review. All rates and terms are subject to change.",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-pricing-quote error:", err);
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
