"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Update one or more fields on an equity_deals record.
 */
export async function updateEquityDealField(
  dealId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const forbidden = ["id", "deal_number", "created_at", "deleted_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { error } = await (admin as any)
      .from("equity_deals")
      .update(fields)
      .eq("id", dealId);

    if (error) {
      console.error("updateEquityDealField error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateEquityDealField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Update one or more fields on a properties record linked to an equity deal.
 */
export async function updatePropertyField(
  propertyId: string,
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const forbidden = ["id", "created_at", "deleted_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { error } = await (admin as any)
      .from("properties")
      .update(fields)
      .eq("id", propertyId);

    if (error) {
      console.error("updatePropertyField error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updatePropertyField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
