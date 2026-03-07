"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Helper to bypass type checking for new tables not yet in generated types
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

export async function initCommercialUW(
  opportunityId: string,
  userId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const supabase = db();

  // Check if one already exists
  const { data: existing } = await supabase
    .from("deal_commercial_uw")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("version", 1)
    .maybeSingle();

  if (existing) return { data: { id: existing.id }, error: null };

  const { data: uw, error: uwError } = await supabase
    .from("deal_commercial_uw")
    .insert({
      opportunity_id: opportunityId,
      version: 1,
      status: "draft",
      created_by: userId,
    })
    .select("id")
    .single();

  if (uwError || !uw) {
    return { data: null, error: uwError?.message ?? "Failed to create UW record" };
  }

  // Seed default income rows
  const incomeRows = DEFAULT_INCOME_ROWS.map((row) => ({
    uw_id: uw.id,
    ...row,
    t12_amount: 0,
    year_1_amount: 0,
    growth_rate: 0,
  }));
  await supabase.from("deal_commercial_income").insert(incomeRows);

  // Seed default expense rows
  const expenseRows = DEFAULT_EXPENSE_ROWS.map((row) => ({
    uw_id: uw.id,
    ...row,
    t12_amount: 0,
    year_1_amount: 0,
    growth_rate: 0,
  }));
  await supabase.from("deal_commercial_expenses").insert(expenseRows);

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

  // Delete existing and re-insert for simplicity
  await supabase.from("deal_commercial_income").delete().eq("uw_id", uwId);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("deal_commercial_income")
      .insert(rows.map((r) => ({ uw_id: uwId, ...r })));
    if (error) return { error: error.message };
  }

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

  return { error: null };
}

export async function createNewVersion(
  opportunityId: string,
  userId: string
): Promise<{ data: { id: string; version: number } | null; error: string | null }> {
  const supabase = db();

  // Get latest version number
  const { data: latest } = await supabase
    .from("deal_commercial_uw")
    .select("version")
    .eq("opportunity_id", opportunityId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newVersion = (latest?.version ?? 0) + 1;

  const { data: uw, error } = await supabase
    .from("deal_commercial_uw")
    .insert({
      opportunity_id: opportunityId,
      version: newVersion,
      status: "draft",
      created_by: userId,
    })
    .select("id, version")
    .single();

  if (error || !uw) {
    return { data: null, error: error?.message ?? "Failed to create version" };
  }

  revalidatePath(`/admin/pipeline/debt/${opportunityId}`);
  return { data: { id: uw.id, version: uw.version }, error: null };
}

export async function activateVersion(
  uwId: string,
  opportunityId: string
): Promise<{ error: string | null }> {
  const supabase = db();

  // Archive all other versions for this opportunity
  await supabase
    .from("deal_commercial_uw")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("opportunity_id", opportunityId)
    .neq("id", uwId);

  // Set this one as active
  const { error } = await supabase
    .from("deal_commercial_uw")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", uwId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/pipeline/debt/${opportunityId}`);
  return { error: null };
}

export async function saveDraft(
  uwId: string,
  opportunityId: string
): Promise<{ error: string | null }> {
  const supabase = db();

  const { error } = await supabase
    .from("deal_commercial_uw")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", uwId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/pipeline/debt/${opportunityId}`);
  return { error: null };
}
