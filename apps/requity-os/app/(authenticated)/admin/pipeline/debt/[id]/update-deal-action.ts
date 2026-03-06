"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Map UI field names (loan-style) to opportunity DB column names.
 * The page.tsx aliases opportunity columns to loan-style names for the UI,
 * so we must reverse-map them when writing back to the opportunities table.
 */
const OPPORTUNITY_FIELD_MAP: Record<string, string> = {
  type: "loan_type",
  purpose: "loan_purpose",
  strategy: "investment_strategy",
  loan_amount: "proposed_loan_amount",
  interest_rate: "proposed_interest_rate",
  ltv: "proposed_ltv",
  loan_term_months: "proposed_loan_term_months",
  notes: "internal_notes",
  originator_id: "originator",
  processor_id: "processor",
  underwriter_id: "assigned_underwriter",
};

/** Fields that exist on loans but NOT on opportunities — skip silently */
const OPPORTUNITY_SKIP_FIELDS = new Set([
  "points",
  "dscr_ratio",
  "closer_id",
  "loan_number",
]);

/**
 * Map UI property field names (loan-style) to the properties table column names.
 * On loans these fields live directly on the loans table, but on opportunities
 * they live on the separate `properties` table.
 */
const PROPERTY_FIELD_MAP: Record<string, string> = {
  property_address_line1: "address_line1",
  property_city: "city",
  property_state: "state",
  property_zip: "zip",
  property_county: "county",
  property_units: "number_of_units",
  _property_year_built: "year_built",
  _property_sqft: "gross_building_area_sqft",
};

/** Fields that belong on the properties table when dealing with opportunities */
const OPPORTUNITY_PROPERTY_FIELDS = new Set([
  "property_address_line1",
  "property_address_line2",
  "property_city",
  "property_state",
  "property_zip",
  "property_county",
  "property_type",
  "property_units",
  "number_of_units",
  "appraised_value",
  "purchase_price",
  "_property_year_built",
  "_property_sqft",
]);

function mapFieldsForOpportunity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (OPPORTUNITY_SKIP_FIELDS.has(key)) continue;
    const dbColumn = OPPORTUNITY_FIELD_MAP[key] ?? key;
    mapped[dbColumn] = value;
  }
  return mapped;
}

/**
 * Update one or more fields on a loan or opportunity record.
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

    if (isOpportunity) {
      // Split fields: some go to the opportunities table, some to properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const propertyFields: Record<string, any> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oppFields: Record<string, any> = {};

      for (const [key, value] of Object.entries(fields)) {
        if (OPPORTUNITY_SKIP_FIELDS.has(key)) continue;
        if (OPPORTUNITY_PROPERTY_FIELDS.has(key)) {
          const dbCol = PROPERTY_FIELD_MAP[key] ?? key;
          propertyFields[dbCol] = value;
        } else {
          const dbCol = OPPORTUNITY_FIELD_MAP[key] ?? key;
          oppFields[dbCol] = value;
        }
      }

      // Update opportunity fields
      if (Object.keys(oppFields).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (admin as any)
          .from("opportunities")
          .update(oppFields)
          .eq("id", dealId)
          .select()
          .single();

        if (error) {
          console.error("updateDealField (opportunity) error:", error);
          return { error: error.message };
        }
        if (!data) {
          return { error: "Update failed — opportunity not found" };
        }
      }

      // Update property fields via the opportunity's property_id
      if (Object.keys(propertyFields).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: opp } = await (admin as any)
          .from("opportunities")
          .select("property_id")
          .eq("id", dealId)
          .single();

        if (opp?.property_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: propError } = await (admin as any)
            .from("properties")
            .update(propertyFields)
            .eq("id", opp.property_id);

          if (propError) {
            console.error("updateDealField (property) error:", propError);
            return { error: propError.message };
          }
        } else {
          return { error: "No property linked to this opportunity" };
        }
      }

      return { success: true };
    }

    // Loans: update directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("loans")
      .update(fields)
      .eq("id", dealId)
      .select()
      .single();

    if (error) {
      console.error("updateDealField error:", error);
      return { error: error.message };
    }

    if (!data) {
      return { error: "Update failed — record not found or no rows affected" };
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
    const { data, error } = await (admin as any)
      .from(table)
      .update({ [field]: value })
      .eq("id", recordId)
      .select()
      .single();

    if (error) {
      console.error("updateRelatedField error:", error);
      return { error: error.message };
    }

    if (!data) {
      return { error: "Update failed — record not found" };
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

    // Opportunities use different column names for team roles
    if (isOpportunity && roleField === "closer_id") {
      return { success: true }; // Opportunities don't have a closer field
    }

    const table = isOpportunity ? "opportunities" : "loans";
    const dbField = isOpportunity
      ? OPPORTUNITY_FIELD_MAP[roleField] ?? roleField
      : roleField;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from(table)
      .update({ [dbField]: profileId })
      .eq("id", dealId)
      .select()
      .single();

    if (error) {
      console.error("assignTeamMember error:", error);
      return { error: error.message };
    }

    if (!data) {
      return { error: "Assignment failed — record not found" };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("assignTeamMember exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
