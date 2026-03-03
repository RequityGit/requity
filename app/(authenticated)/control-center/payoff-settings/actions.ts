"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function requireAdmin(): Promise<
  { user: { id: string; email?: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!adminRole) return { error: "Not authorized" };

  return { user: { id: user.id, email: user.email ?? undefined } };
}

// ── Wire Instructions ──────────────────────────────────────────

export interface WireInstructionsInput {
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  wire_type: string;
}

export async function getWireInstructions() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from("company_wire_instructions")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return { error: error.message };
    }

    return { success: true, data: data ?? null };
  } catch (err: any) {
    console.error("getWireInstructions error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function saveWireInstructions(input: WireInstructionsInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient() as any;

    // Check if a row exists
    const { data: existing } = await admin
      .from("company_wire_instructions")
      .select("id")
      .limit(1)
      .single();

    const payload = {
      bank_name: input.bank_name.trim(),
      account_name: input.account_name.trim(),
      account_number: input.account_number.trim(),
      routing_number: input.routing_number.trim(),
      wire_type: input.wire_type.trim(),
      updated_at: new Date().toISOString(),
      updated_by: auth.user.email ?? auth.user.id,
    };

    if (existing) {
      const { error } = await admin
        .from("company_wire_instructions")
        .update(payload)
        .eq("id", existing.id);

      if (error) return { error: error.message };
    } else {
      const { error } = await admin
        .from("company_wire_instructions")
        .insert(payload);

      if (error) return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("saveWireInstructions error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ── Payoff Fee Defaults ────────────────────────────────────────

export interface FeeDefaultUpdate {
  id: string;
  default_amount: number;
  is_active: boolean;
}

export async function getPayoffFeeDefaults() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from("payoff_fee_defaults")
      .select("*")
      .order("sort_order");

    if (error) return { error: error.message };

    return { success: true, data: data ?? [] };
  } catch (err: any) {
    console.error("getPayoffFeeDefaults error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function updatePayoffFeeDefaults(updates: FeeDefaultUpdate[]) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient() as any;

    for (const update of updates) {
      const { error } = await admin
        .from("payoff_fee_defaults")
        .update({
          default_amount: update.default_amount,
          is_active: update.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (error) return { error: `Failed to update fee: ${error.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("updatePayoffFeeDefaults error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}
