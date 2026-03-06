"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-admin";

// ── Underwriting Assumptions (commercial_uw_assumptions) ──

export interface UWAssumptionData {
  id: string;
  property_type: string;
  vacancy_pct: number;
  stabilized_vacancy_pct: number;
  bad_debt_pct: number;
  mgmt_fee_pct: number;
  rent_growth_yr1: number;
  rent_growth_yr2: number;
  rent_growth_yr3: number;
  rent_growth_yr4: number;
  rent_growth_yr5: number;
  expense_growth_yr1: number;
  expense_growth_yr2: number;
  expense_growth_yr3: number;
  expense_growth_yr4: number;
  expense_growth_yr5: number;
  going_in_cap_rate: number;
  exit_cap_rate: number;
  disposition_cost_pct: number;
}

export async function updateAssumption(
  id: string,
  fields: Partial<Omit<UWAssumptionData, "id" | "property_type">>
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("commercial_uw_assumptions")
      .update(fields)
      .eq("id", id);

    if (error) {
      console.error("Update assumption error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Update assumption error:", err);
    return { error: "Failed to update assumption" };
  }
}

export async function resetAssumptionToDefaults(id: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data: row, error: fetchErr } = await admin
      .from("commercial_uw_assumptions")
      .select("property_type")
      .eq("id", id)
      .single();

    if (fetchErr || !row) {
      return { error: "Assumption row not found" };
    }

    // Reset to general defaults
    const defaults = {
      vacancy_pct: 5,
      stabilized_vacancy_pct: 5,
      bad_debt_pct: 1,
      mgmt_fee_pct: 8,
      rent_growth_yr1: 3,
      rent_growth_yr2: 3,
      rent_growth_yr3: 3,
      rent_growth_yr4: 3,
      rent_growth_yr5: 3,
      expense_growth_yr1: 2,
      expense_growth_yr2: 2,
      expense_growth_yr3: 2,
      expense_growth_yr4: 2,
      expense_growth_yr5: 2,
      going_in_cap_rate: 7,
      exit_cap_rate: 7.5,
      disposition_cost_pct: 2,
    };

    const { error } = await admin
      .from("commercial_uw_assumptions")
      .update(defaults)
      .eq("id", id);

    if (error) {
      console.error("Reset assumption error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Reset assumption error:", err);
    return { error: "Failed to reset assumption" };
  }
}

// ── Expense Defaults (commercial_expense_defaults) ──

export interface ExpenseDefaultData {
  id: string;
  property_type: string;
  expense_category: string;
  per_unit_amount: number;
  basis: string;
  range_low: number | null;
  range_high: number | null;
}

export async function updateExpenseDefault(
  id: string,
  fields: Partial<Pick<ExpenseDefaultData, "per_unit_amount" | "range_low" | "range_high">>
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("commercial_expense_defaults")
      .update(fields)
      .eq("id", id);

    if (error) {
      console.error("Update expense default error:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("Update expense default error:", err);
    return { error: "Failed to update expense default" };
  }
}

export async function bulkUpdateExpenseDefaults(
  updates: { id: string; per_unit_amount: number }[]
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    for (const update of updates) {
      const { error } = await admin
        .from("commercial_expense_defaults")
        .update({ per_unit_amount: update.per_unit_amount })
        .eq("id", update.id);

      if (error) {
        console.error("Bulk update expense default error:", error);
        return { error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Bulk update expense defaults error:", err);
    return { error: "Failed to update expense defaults" };
  }
}
