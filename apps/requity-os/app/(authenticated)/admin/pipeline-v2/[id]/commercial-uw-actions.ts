"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Helper to bypass type checking for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any { return createAdminClient(); }

const DEFAULT_INCOME_ROWS = [
  { line_item: "Gross Potential Rent", is_deduction: false, sort_order: 0 },
  { line_item: "Ancillary Income", is_deduction: false, sort_order: 1 },
  { line_item: "Vacancy Loss", is_deduction: true, sort_order: 2 },
  { line_item: "Concessions", is_deduction: true, sort_order: 3 },
];

const DEFAULT_EXPENSE_ROWS = [
  { category: "Property Taxes", is_percentage: false, sort_order: 0 },
  { category: "Insurance", is_percentage: false, sort_order: 1 },
  { category: "Utilities", is_percentage: false, sort_order: 2 },
  { category: "Repairs & Maintenance", is_percentage: false, sort_order: 3 },
  { category: "Management Fee", is_percentage: true, sort_order: 4 },
  { category: "G&A / Other", is_percentage: false, sort_order: 5 },
];

const DEFAULT_WATERFALL_TIERS = [
  { tier_order: 1, tier_name: "Return of Capital", hurdle_rate: null, sponsor_split: 0.0, investor_split: 1.0, is_catch_up: false, description: "All distributions until investors receive 1.0x return" },
  { tier_order: 2, tier_name: "Preferred Return", hurdle_rate: 0.08, sponsor_split: 0.0, investor_split: 1.0, is_catch_up: false, description: "Accrued 8% annual preferred return" },
  { tier_order: 3, tier_name: "Catch-Up", hurdle_rate: null, sponsor_split: 0.50, investor_split: 0.50, is_catch_up: true, description: "Until sponsor reaches 20% of total profit" },
  { tier_order: 4, tier_name: "Remaining Profits", hurdle_rate: null, sponsor_split: 0.20, investor_split: 0.80, is_catch_up: false, description: "Standard 80/20 split" },
];

export async function initCommercialUW(
  dealId: string,
  userId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const supabase = db();

  const { data: existing } = await supabase
    .from("deal_commercial_uw")
    .select("id")
    .eq("opportunity_id", dealId)
    .eq("version", 1)
    .maybeSingle();

  if (existing) return { data: { id: existing.id }, error: null };

  const { data: uw, error: uwError } = await supabase
    .from("deal_commercial_uw")
    .insert({
      opportunity_id: dealId,
      version: 1,
      status: "draft",
      created_by: userId,
    })
    .select("id")
    .single();

  if (uwError || !uw) {
    return { data: null, error: uwError?.message ?? "Failed to create UW record" };
  }

  // Seed default rows
  const incomeRows = DEFAULT_INCOME_ROWS.map((row) => ({
    uw_id: uw.id, ...row, t12_amount: 0, year_1_amount: 0, growth_rate: 0,
  }));
  await supabase.from("deal_commercial_income").insert(incomeRows);

  const expenseRows = DEFAULT_EXPENSE_ROWS.map((row) => ({
    uw_id: uw.id, ...row, t12_amount: 0, year_1_amount: 0, growth_rate: 0,
  }));
  await supabase.from("deal_commercial_expenses").insert(expenseRows);

  const waterfallRows = DEFAULT_WATERFALL_TIERS.map((t) => ({ uw_id: uw.id, ...t }));
  await supabase.from("deal_commercial_waterfall").insert(waterfallRows);

  revalidatePath(`/admin/pipeline/${dealId}`);
  return { data: { id: uw.id }, error: null };
}

/**
 * Ensures a commercial UW record exists for the given opportunity.
 * Used as a fallback in the page loader for legacy deals created before
 * the auto-init trigger was added.
 */
export async function ensureCommercialUW(
  opportunityId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const supabase = db();

  const { data: existing } = await supabase
    .from("deal_commercial_uw")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) return { data: { id: existing.id }, error: null };

  const { data: uw, error: uwError } = await supabase
    .from("deal_commercial_uw")
    .insert({ opportunity_id: opportunityId })
    .select("id")
    .single();

  if (uwError || !uw) {
    return { data: null, error: uwError?.message ?? "Failed to create UW record" };
  }

  // Seed default rows
  const incomeRows = DEFAULT_INCOME_ROWS.map((row) => ({
    uw_id: uw.id, ...row, t12_amount: 0, year_1_amount: 0, growth_rate: 0,
  }));
  await supabase.from("deal_commercial_income").insert(incomeRows);

  const expenseRows = DEFAULT_EXPENSE_ROWS.map((row) => ({
    uw_id: uw.id, ...row, t12_amount: 0, year_1_amount: 0, growth_rate: 0,
  }));
  await supabase.from("deal_commercial_expenses").insert(expenseRows);

  const waterfallRows = DEFAULT_WATERFALL_TIERS.map((t) => ({ uw_id: uw.id, ...t }));
  await supabase.from("deal_commercial_waterfall").insert(waterfallRows);

  revalidatePath(`/admin/pipeline/debt/${opportunityId}`);
  return { data: { id: uw.id }, error: null };
}

export async function updateCommercialUW(
  uwId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>
): Promise<{ error: string | null }> {
  const supabase = db();
  const { error } = await supabase
    .from("deal_commercial_uw")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", uwId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function upsertIncomeRows(
  uwId: string,
  rows: {
    id?: string;
    line_item: string;
    t12_amount: number;
    year_1_amount: number;
    growth_rate: number;
    is_deduction: boolean;
    sort_order: number;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_income").delete().eq("uw_id", uwId);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_income")
      .insert(rows.map((r) => ({ uw_id: uwId, ...r })));
    if (error) return { error: error.message };
  }

  // Touch parent to trigger snapshot
  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);

  return { error: null };
}

export async function upsertExpenseRows(
  uwId: string,
  rows: {
    id?: string;
    category: string;
    t12_amount: number;
    year_1_amount: number;
    growth_rate: number;
    is_percentage: boolean;
    sort_order: number;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_expenses").delete().eq("uw_id", uwId);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_expenses")
      .insert(rows.map((r) => ({ uw_id: uwId, ...r })));
    if (error) return { error: error.message };
  }

  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);

  return { error: null };
}

export async function upsertRentRoll(
  uwId: string,
  rows: {
    unit_number: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    sq_ft?: number | null;
    current_rent: number;
    market_rent: number;
    status: string;
    lease_start?: string | null;
    lease_end?: string | null;
    tenant_name?: string | null;
    sort_order: number;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_rent_roll").delete().eq("uw_id", uwId);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_rent_roll")
      .insert(rows.map((r) => ({ uw_id: uwId, ...r })));
    if (error) return { error: error.message };
  }

  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);

  return { error: null };
}

export async function upsertScopeOfWork(
  uwId: string,
  rows: {
    item_name: string;
    description?: string | null;
    estimated_cost: number;
    sort_order: number;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_scope_of_work").delete().eq("uw_id", uwId);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_scope_of_work")
      .insert(rows.map((r) => ({ uw_id: uwId, ...r })));
    if (error) return { error: error.message };
  }

  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);

  return { error: null };
}

export async function upsertSourcesUses(
  uwId: string,
  rows: {
    type: string;
    line_item: string;
    amount: number;
    notes?: string | null;
    sort_order: number;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_sources_uses").delete().eq("uw_id", uwId);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_sources_uses")
      .insert(rows.map((r) => ({ uw_id: uwId, ...r })));
    if (error) return { error: error.message };
  }

  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);

  return { error: null };
}

export async function upsertWaterfall(
  uwId: string,
  tiers: {
    tier_order: number;
    tier_name: string;
    hurdle_rate?: number | null;
    sponsor_split?: number | null;
    investor_split?: number | null;
    is_catch_up?: boolean;
    description?: string | null;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_waterfall").delete().eq("uw_id", uwId);

  if (tiers.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_waterfall")
      .insert(tiers.map((t) => ({ uw_id: uwId, ...t })));
    if (error) return { error: error.message };
  }

  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);

  return { error: null };
}

export async function createNewVersion(
  dealId: string,
  userId: string
): Promise<{ data: { id: string; version: number } | null; error: string | null }> {
  const supabase = db();

  const { data: latest } = await supabase
    .from("deal_commercial_uw")
    .select("version")
    .eq("opportunity_id", dealId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newVersion = (latest?.version ?? 0) + 1;

  const { data: uw, error } = await supabase
    .from("deal_commercial_uw")
    .insert({
      opportunity_id: dealId,
      version: newVersion,
      status: "draft",
      created_by: userId,
    })
    .select("id, version")
    .single();

  if (error || !uw) {
    return { data: null, error: error?.message ?? "Failed to create version" };
  }

  revalidatePath(`/admin/pipeline/${dealId}`);
  return { data: { id: uw.id, version: uw.version }, error: null };
}

export async function fetchAssumptionDefaults(
  propertyType: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const supabase = db();
  const { data, error } = await supabase
    .from("commercial_uw_assumptions")
    .select("*")
    .eq("property_type", propertyType)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as Record<string, unknown> | null, error: null };
}

export async function fetchExpenseDefaults(
  propertyType: string
): Promise<{ data: Record<string, unknown>[]; error: string | null }> {
  const supabase = db();
  const { data, error } = await supabase
    .from("commercial_expense_defaults")
    .select("*")
    .eq("property_type", propertyType)
    .order("expense_category");

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Record<string, unknown>[], error: null };
}

export async function upsertDebtTranches(
  uwId: string,
  tranches: {
    tranche_name: string;
    loan_type?: string | null;
    loan_amount: number;
    interest_rate: number;
    term_years?: number | null;
    amortization_years?: number | null;
    io_period_months?: number | null;
    origination_fee_pct?: number | null;
    lender_name?: string | null;
    sort_order: number;
  }[]
): Promise<{ error: string | null }> {
  const supabase = db();
  await supabase.from("deal_commercial_debt").delete().eq("uw_id", uwId);

  if (tranches.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_debt")
      .insert(tranches.map((t) => ({ uw_id: uwId, ...t })));
    if (error) return { error: error.message };
  }

  await supabase.from("deal_commercial_uw").update({ updated_at: new Date().toISOString() }).eq("id", uwId);
  return { error: null };
}

export async function activateVersion(
  uwId: string,
  dealId: string
): Promise<{ error: string | null }> {
  const supabase = db();

  await supabase
    .from("deal_commercial_uw")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("opportunity_id", dealId)
    .neq("id", uwId);

  const { error } = await supabase
    .from("deal_commercial_uw")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", uwId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/pipeline/${dealId}`);
  return { error: null };
}
