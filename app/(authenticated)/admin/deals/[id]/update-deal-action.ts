"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Update one or more fields on a loan record.
 * Accepts a partial object of columns to update.
 */
export async function updateDealField(
  dealId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>,
  isOpportunity?: boolean
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Never allow updating these system-managed fields
    const forbidden = ["id", "loan_number", "created_at", "deleted_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const table = isOpportunity ? "opportunities" : "loans";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .update(fields)
      .eq("id", dealId);

    if (error) {
      console.error("updateDealField error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Update a field on a related entity (borrower_entities, borrowers).
 */
export async function updateRelatedField(
  table: string,
  recordId: string,
  field: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const allowedTables = ["borrower_entities", "borrowers"];
    if (!allowedTables.includes(table)) {
      return { error: `Table "${table}" is not allowed` };
    }

    const forbidden = ["id", "user_id", "created_at", "deleted_at"];
    if (forbidden.includes(field)) {
      return { error: `Field "${field}" cannot be updated` };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .update({ [field]: value })
      .eq("id", recordId);

    if (error) {
      console.error("updateRelatedField error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateRelatedField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Log a quick action (call, email, etc.) to the loan activity log.
 */
export async function logQuickAction(
  loanId: string,
  action: string,
  description: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin.from("loan_activity_log").insert({
      loan_id: loanId,
      action,
      description,
      performed_by: userId,
      metadata: (metadata ?? null) as unknown as import("@/lib/supabase/types").Json,
    });

    if (error) {
      console.error("logQuickAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("logQuickAction exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Assign a team member to a deal role.
 */
export async function assignTeamMember(
  dealId: string,
  roleField: string,
  profileId: string | null,
  isOpportunity?: boolean
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const allowedFields = ["originator_id", "processor_id", "underwriter_id", "closer_id"];
    if (!allowedFields.includes(roleField)) {
      return { error: `Invalid role field: ${roleField}` };
    }

    const table = isOpportunity ? "opportunities" : "loans";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .update({ [roleField]: profileId })
      .eq("id", dealId);

    if (error) {
      console.error("assignTeamMember error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("assignTeamMember exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
