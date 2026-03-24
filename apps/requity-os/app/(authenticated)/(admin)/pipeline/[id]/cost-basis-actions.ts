"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

// ─── Types ───

export interface CostBasisRow {
  id: string;
  deal_id: string;
  original_purchase_price: number | null;
  original_purchase_date: string | null;
  original_closing_costs: number | null;
  capital_improvements: number | null;
  total_basis: number | null;
  as_is_value: number | null;
  after_repair_value: number | null;
  basis_as_of_date: string | null;
  source: string | null;
  notes: string | null;
}

export interface ExistingLoanRow {
  id: string;
  deal_id: string;
  lien_position: number;
  lender_name: string | null;
  loan_type: string | null;
  original_loan_amount: number | null;
  current_balance: number | null;
  interest_rate: number | null;
  monthly_payment: number | null;
  is_interest_only: boolean;
  origination_date: string | null;
  maturity_date: string | null;
  prepayment_penalty: string | null;
  is_current: boolean;
  delinquency_notes: string | null;
  sort_order: number;
  notes: string | null;
}

// ─── Fetch ───

export async function fetchCostBasis(dealId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  const cbResult = await admin
    .from("deal_cost_basis" as never)
    .select("*" as never)
    .eq("deal_id" as never, dealId as never)
    .maybeSingle();

  const loansResult = await admin
    .from("deal_existing_loans" as never)
    .select("*" as never)
    .eq("deal_id" as never, dealId as never)
    .order("lien_position" as never, { ascending: true } as never)
    .order("sort_order" as never, { ascending: true } as never);

  if (cbResult.error) return { error: (cbResult.error as { message: string }).message };
  if (loansResult.error) return { error: (loansResult.error as { message: string }).message };

  return {
    costBasis: cbResult.data as CostBasisRow | null,
    existingLoans: ((loansResult.data as unknown[]) ?? []) as ExistingLoanRow[],
  };
}

// ─── Cost Basis: update single field ───

export async function updateCostBasisField(
  dealId: string,
  field: string,
  value: string | number | null
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const ALLOWED_FIELDS = [
    "original_purchase_price",
    "original_purchase_date",
    "original_closing_costs",
    "capital_improvements",
    "as_is_value",
    "after_repair_value",
    "basis_as_of_date",
    "source",
    "notes",
  ];

  if (!ALLOWED_FIELDS.includes(field)) {
    return { error: `Field "${field}" is not allowed` };
  }

  const admin = createAdminClient();

  // Upsert: create row if it doesn't exist yet
  const { error } = await admin
    .from("deal_cost_basis" as never)
    .upsert(
      { deal_id: dealId, [field]: value } as never,
      { onConflict: "deal_id" } as never
    );

  if (error) return { error: (error as { message: string }).message };
  return { success: true };
}

// ─── Existing Loans: create ───

export async function createExistingLoan(dealId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  // Get next lien position
  const { data: existing } = await admin
    .from("deal_existing_loans" as never)
    .select("lien_position" as never)
    .eq("deal_id" as never, dealId as never)
    .order("lien_position" as never, { ascending: false } as never)
    .limit(1);

  const rows = (existing ?? []) as { lien_position: number }[];
  const nextPosition = (rows[0]?.lien_position ?? 0) + 1;

  const { data, error } = await admin
    .from("deal_existing_loans" as never)
    .insert({ deal_id: dealId, lien_position: nextPosition } as never)
    .select("*" as never)
    .single();

  if (error) return { error: (error as { message: string }).message };
  return { loan: data as unknown as ExistingLoanRow };
}

// ─── Existing Loans: update single field ───

export async function updateExistingLoanField(
  loanId: string,
  field: string,
  value: string | number | boolean | null
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const ALLOWED_FIELDS = [
    "lien_position",
    "lender_name",
    "loan_type",
    "original_loan_amount",
    "current_balance",
    "interest_rate",
    "monthly_payment",
    "is_interest_only",
    "origination_date",
    "maturity_date",
    "prepayment_penalty",
    "is_current",
    "delinquency_notes",
    "notes",
  ];

  if (!ALLOWED_FIELDS.includes(field)) {
    return { error: `Field "${field}" is not allowed` };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("deal_existing_loans" as never)
    .update({ [field]: value } as never)
    .eq("id" as never, loanId as never);

  if (error) return { error: (error as { message: string }).message };
  return { success: true };
}

// ─── Existing Loans: delete ───

export async function deleteExistingLoan(loanId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();

  const { error } = await admin
    .from("deal_existing_loans" as never)
    .delete()
    .eq("id" as never, loanId as never);

  if (error) return { error: (error as { message: string }).message };
  return { success: true };
}
