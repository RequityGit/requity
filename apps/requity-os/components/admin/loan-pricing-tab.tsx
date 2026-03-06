"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PricingCalculator } from "@/components/admin/pricing-calculator";
import { useToast } from "@/components/ui/use-toast";
import type { PricingProgram, LeverageAdjuster } from "@/lib/supabase/types";

interface LoanForPricing {
  id: string;
  purchase_price: number | null;
  rehab_budget: number | null;
  after_repair_value: number | null;
  arv: number | null;
  credit_score: number | null;
  experience_deals_24mo: number | null;
  legal_status: string | null;
  property_type: string | null;
  flood_zone: boolean | null;
  is_in_flood_zone: boolean | null;
  rural_status: string | null;
  holding_period_months: number | null;
  loan_term_months: number | null;
  requested_loan_amount: number | null;
  loan_amount: number | null;
  heated_sqft: number | null;
  mobilization_draw: number | null;
  annual_property_tax: number | null;
  annual_insurance: number | null;
  monthly_utilities: number | null;
  monthly_hoa: number | null;
  title_closing_escrow: number | null;
  lender_fees_flat: number | null;
  sales_disposition_pct: number | null;
  num_partners: number | null;
  program_id: string | null;
}

interface LoanPricingTabProps {
  loan: LoanForPricing;
  programs: PricingProgram[];
  adjusters: LeverageAdjuster[];
}

export function LoanPricingTab({
  loan,
  programs,
  adjusters,
}: LoanPricingTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Pre-fill calculator from existing loan data
  const initialValues = {
    program_id: loan.program_id ?? "",
    purchase_price: loan.purchase_price ? String(loan.purchase_price) : "",
    rehab_budget: loan.rehab_budget ? String(loan.rehab_budget) : "",
    after_repair_value: loan.after_repair_value
      ? String(loan.after_repair_value)
      : loan.arv
        ? String(loan.arv)
        : "",
    credit_score: loan.credit_score ? String(loan.credit_score) : "",
    experience_deals_24mo: loan.experience_deals_24mo
      ? String(loan.experience_deals_24mo)
      : "",
    legal_status: loan.legal_status ?? "",
    property_type: loan.property_type ?? "",
    flood_zone: loan.flood_zone ?? loan.is_in_flood_zone ?? false,
    rural_status: loan.rural_status ?? "Non-Rural",
    holding_period_months: loan.holding_period_months
      ? String(loan.holding_period_months)
      : loan.loan_term_months
        ? String(loan.loan_term_months)
        : "12",
    requested_loan_amount: loan.requested_loan_amount
      ? String(loan.requested_loan_amount)
      : loan.loan_amount
        ? String(loan.loan_amount)
        : "",
    heated_sqft: loan.heated_sqft ? String(loan.heated_sqft) : "",
    mobilization_draw: loan.mobilization_draw
      ? String(loan.mobilization_draw)
      : "0",
    annual_property_tax: loan.annual_property_tax
      ? String(loan.annual_property_tax)
      : "",
    annual_insurance: loan.annual_insurance
      ? String(loan.annual_insurance)
      : "",
    monthly_utilities: loan.monthly_utilities
      ? String(loan.monthly_utilities)
      : "",
    monthly_hoa: loan.monthly_hoa ? String(loan.monthly_hoa) : "",
    title_closing_escrow: loan.title_closing_escrow
      ? String(loan.title_closing_escrow)
      : "",
    lender_fees_flat: loan.lender_fees_flat
      ? String(loan.lender_fees_flat)
      : "",
    sales_disposition_pct: loan.sales_disposition_pct
      ? String(loan.sales_disposition_pct)
      : "3",
    num_partners: loan.num_partners ? String(loan.num_partners) : "1",
  };

  async function handleSave(result: any, inputs: any) {
    setSaving(true);
    try {
      const supabase = createClient();

      const updateData: Record<string, any> = {
        program_id: result.program.program_id,
        program_version: result.program.version,
        interest_rate: result.program.interest_rate,
        origination_points: result.program.origination_points,
        // Deal inputs
        purchase_price: parseFloat(inputs.purchase_price) || null,
        rehab_budget: parseFloat(inputs.rehab_budget) || null,
        after_repair_value: parseFloat(inputs.after_repair_value) || null,
        credit_score: parseInt(inputs.credit_score) || null,
        experience_deals_24mo: parseInt(inputs.experience_deals_24mo) || null,
        legal_status: inputs.legal_status || null,
        property_type: inputs.property_type || null,
        flood_zone: inputs.flood_zone,
        rural_status: inputs.rural_status || null,
        holding_period_months: parseInt(inputs.holding_period_months) || null,
        requested_loan_amount:
          parseFloat(inputs.requested_loan_amount) || null,
        heated_sqft: parseFloat(inputs.heated_sqft) || null,
        mobilization_draw: parseFloat(inputs.mobilization_draw) || null,
        annual_property_tax: parseFloat(inputs.annual_property_tax) || null,
        annual_insurance: parseFloat(inputs.annual_insurance) || null,
        monthly_utilities: parseFloat(inputs.monthly_utilities) || null,
        monthly_hoa: parseFloat(inputs.monthly_hoa) || null,
        title_closing_escrow:
          parseFloat(inputs.title_closing_escrow) || null,
        lender_fees_flat: parseFloat(inputs.lender_fees_flat) || null,
        sales_disposition_pct:
          parseFloat(inputs.sales_disposition_pct) || null,
        num_partners: parseInt(inputs.num_partners) || null,
        // Computed fields
        total_project_cost: result.sizing.total_project_cost,
        max_ltv: result.leverage?.effective_ltv ?? result.program.max_ltv,
        max_ltc: result.leverage?.effective_ltc ?? result.program.max_ltc,
        max_ltp: result.leverage?.effective_ltp ?? result.program.max_ltp,
        max_loan_arv_constraint: result.sizing.max_loan_arv,
        max_loan_ltc_constraint: result.sizing.max_loan_ltc,
        max_loan_ltp_constraint: result.sizing.max_loan_ltp,
        binding_constraint: result.sizing.binding_constraint,
        total_loan_amount: result.sizing.total_loan,
        allocated_to_purchase: result.sizing.allocated_to_purchase,
        allocated_to_rehab: result.sizing.allocated_to_rehab,
        lender_cash_at_closing: result.sizing.lender_cash_at_closing,
        remaining_rehab_draws: result.sizing.remaining_rehab_draws,
        requested_exceeds_max: result.sizing.requested_exceeds_max,
        monthly_interest_payment: result.holding.monthly_interest,
        total_monthly_holding_cost: result.holding.total_monthly,
        total_holding_costs: result.holding.total_holding,
        origination_fee_amount: result.closing.origination_fee,
        prepaid_interest_est: result.closing.prepaid_interest,
        total_closing_costs: result.closing.total_closing,
        total_borrower_cash_to_close: result.closing.total_cash_to_close,
        cash_to_close_pct_of_pp: result.closing.cash_to_close_pct,
        gross_sale_proceeds: result.pnl.gross_proceeds,
        sales_costs: result.pnl.sales_costs,
        net_sale_proceeds: result.pnl.net_proceeds,
        net_profit: result.pnl.net_profit,
        borrower_roi: result.pnl.roi,
        annualized_roi: result.pnl.annualized_roi,
        cash_per_partner: result.pnl.cash_per_partner,
        profit_per_partner: result.pnl.profit_per_partner,
        ltv_arv: result.creditBox.ltv_arv,
        ltc: result.creditBox.ltc,
        ltp: result.creditBox.ltp,
        day1_ltv: result.creditBox.day1_ltv,
        loan_per_sqft: result.creditBox.loan_per_sqft,
        borrower_equity_at_closing: result.creditBox.equity_at_closing,
        arv_minus_loan_cushion: result.creditBox.arv_cushion,
        break_even_sale_price: result.creditBox.break_even,
      };

      // Add per-sqft metrics if available
      if (result.perSqft) {
        updateData.purchase_price_per_sqft = result.perSqft.purchase;
        updateData.arv_per_sqft = result.perSqft.arv;
        updateData.rehab_per_sqft = result.perSqft.rehab;
      }

      const { error } = await supabase
        .from("loans")
        .update(updateData)
        .eq("id", loan.id);

      if (error) throw error;

      toast({ title: "Pricing saved to loan" });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error saving",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PricingCalculator
      programs={programs}
      adjusters={adjusters}
      initialValues={initialValues}
      onSave={handleSave}
      saving={saving}
    />
  );
}
