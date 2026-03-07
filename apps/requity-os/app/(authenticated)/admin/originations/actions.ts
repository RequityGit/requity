"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Opportunity CRUD
// ---------------------------------------------------------------------------

interface CreateOpportunityInput {
  // Property
  property_id?: string;
  property?: {
    address_line1: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
    property_type?: string;
    asset_type?: string;
    year_built?: number;
    number_of_units?: number;
    lot_size_acres?: number;
    gross_building_area_sqft?: number;
  };
  // Entity
  borrower_entity_id?: string;
  // Borrowers
  borrower_ids?: { borrower_id: string; role: string }[];
  // Deal classification
  deal_name?: string;
  loan_type?: string;
  loan_purpose?: string;
  funding_channel?: string;
  // Proposed terms
  proposed_loan_amount?: number;
  proposed_interest_rate?: number;
  proposed_loan_term_months?: number;
  proposed_ltv?: number;
}

export async function createOpportunityAction(input: CreateOpportunityInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Step 1: Create or link property
    let propertyId = input.property_id;
    if (!propertyId && input.property) {
      const { data: propData, error: propError } = await admin
        .from("properties")
        .insert({
          address_line1: input.property.address_line1,
          address_line2: input.property.address_line2 || null,
          city: input.property.city || null,
          state: input.property.state || null,
          zip: input.property.zip || null,
          county: input.property.county || null,
          property_type: input.property.property_type || null,
          asset_type: input.property.asset_type || null,
          year_built: input.property.year_built ?? null,
          number_of_units: input.property.number_of_units ?? null,
          lot_size_acres: input.property.lot_size_acres ?? null,
          gross_building_area_sqft:
            input.property.gross_building_area_sqft ?? null,
        })
        .select("id")
        .single();

      if (propError) return { error: `Property: ${propError.message}` };
      propertyId = propData.id;
    }

    // Step 2: Auto-default value_method based on loan_type
    let valueMethod: string | null = null;
    if (input.loan_type === "dscr" || input.loan_type === "guc") {
      valueMethod = "appraisal_1_arv";
    } else if (input.loan_type === "rtl") {
      valueMethod = "underwritten_arv";
    }

    // Step 3: Create opportunity
    const { data: oppData, error: oppError } = await admin
      .from("opportunities")
      .insert({
        created_by: auth.user.id,
        property_id: propertyId || null,
        borrower_entity_id: input.borrower_entity_id || null,
        deal_name: input.deal_name || null,
        loan_type: input.loan_type || null,
        loan_purpose: input.loan_purpose || null,
        funding_channel: input.funding_channel || null,
        proposed_loan_amount: input.proposed_loan_amount ?? null,
        proposed_interest_rate: input.proposed_interest_rate ?? null,
        proposed_loan_term_months: input.proposed_loan_term_months ?? null,
        proposed_ltv: input.proposed_ltv ?? null,
        value_method: valueMethod,
        stage: "awaiting_info",
        originator: auth.user.id,
      })
      .select("id")
      .single();

    if (oppError) return { error: `Opportunity: ${oppError.message}` };

    // Step 4: Add borrowers
    if (input.borrower_ids && input.borrower_ids.length > 0) {
      const borrowerRows = input.borrower_ids.map((b, idx) => ({
        opportunity_id: oppData.id,
        borrower_id: b.borrower_id,
        role: b.role || "primary",
        sort_order: idx + 1,
      }));

      const { error: borrowerError } = await admin
        .from("opportunity_borrowers")
        .insert(borrowerRows);

      if (borrowerError)
        console.error("Error adding borrowers:", borrowerError.message);
    }

    revalidatePath("/admin/originations");
    return { success: true, opportunityId: oppData.id };
  } catch (err: any) {
    console.error("createOpportunityAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update Opportunity
// ---------------------------------------------------------------------------

interface UpdateOpportunityInput {
  id: string;
  [key: string]: any;
}

export async function updateOpportunityAction(input: UpdateOpportunityInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { id, ...updates } = input;

    const { error } = await admin
      .from("opportunities")
      .update(updates)
      .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("updateOpportunityAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Move Stage
// ---------------------------------------------------------------------------

export async function moveOpportunityStageAction(
  opportunityId: string,
  newStage: string,
  lossReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Validate loss_reason is provided when closing lost
    if (newStage === "closed_lost" && !lossReason) {
      return { error: "Loss reason is required when closing a deal as lost" };
    }

    // Get current opportunity
    const { data: opp, error: fetchErr } = await admin
      .from("opportunities")
      .select("stage, approval_status, funding_channel")
      .eq("id", opportunityId)
      .single();

    if (fetchErr || !opp) return { error: "Opportunity not found" };

    // Validate stage advancement rules
    if (newStage !== "closed_lost") {
      // UW → advance requires approval
      if (
        opp.stage === "uw" &&
        !["awaiting_info", "closed_lost"].includes(newStage)
      ) {
        if (
          opp.approval_status !== "approved" &&
          opp.approval_status !== "auto_approved"
        ) {
          return { error: "Approval is required before advancing from UW" };
        }
      }

      // Quoting only for brokered deals
      if (newStage === "quoting" && opp.funding_channel !== "brokered") {
        return {
          error: "Quoting stage is only available for brokered deals",
        };
      }
    }

    const updateData: any = {
      stage: newStage,
      stage_changed_at: new Date().toISOString(),
      stage_changed_by: auth.user.id,
    };

    if (newStage === "closed_lost") {
      updateData.loss_reason = lossReason;
    }

    const { error } = await admin
      .from("opportunities")
      .update(updateData)
      .eq("id", opportunityId);

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("moveOpportunityStageAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Request Approval
// ---------------------------------------------------------------------------

export async function requestApprovalAction(opportunityId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get opportunity data for the deal snapshot
    const { data: opp } = await admin
      .from("opportunities")
      .select("*, properties(*)")
      .eq("id", opportunityId)
      .single();

    const { error } = await admin
      .from("opportunities")
      .update({
        approval_status: "pending",
        approval_requested_at: new Date().toISOString(),
        approval_requested_by: auth.user.id,
        approval_type: "manual",
      })
      .eq("id", opportunityId);

    if (error) return { error: error.message };

    // Also create an approval_requests record so it shows in the approvals queue
    // Find the first super_admin to assign as default approver
    const { data: superAdmins } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .eq("is_active", true)
      .limit(1);

    const assignedTo = superAdmins?.[0]?.user_id || auth.user.id;

    const dealSnapshot: Record<string, any> = {
      deal_name: opp?.deal_name || null,
      loan_type: opp?.loan_type || null,
      loan_amount: opp?.proposed_loan_amount || null,
      interest_rate: opp?.proposed_interest_rate || null,
      ltv: opp?.proposed_ltv || null,
      property_type: (opp as any)?.properties?.property_type || null,
      property_address: (opp as any)?.properties?.address_line1 || null,
      borrower_name: opp?.deal_name || "Deal",
      funding_channel: opp?.funding_channel || null,
    };

    const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: approvalError } = await admin
      .from("approval_requests" as any)
      .insert({
        entity_type: "opportunity",
        entity_id: opportunityId,
        submitted_by: auth.user.id,
        assigned_to: assignedTo,
        status: "pending",
        priority: "normal",
        sla_deadline: slaDeadline,
        deal_snapshot: dealSnapshot,
        submission_notes: null,
        checklist_results: [],
      });

    if (approvalError) {
      console.error("Error creating approval_requests record:", approvalError);
      return { error: approvalError.message };
    }

    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("requestApprovalAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Decide Approval
// ---------------------------------------------------------------------------

export async function decideApprovalAction(
  opportunityId: string,
  decision: "approved" | "denied",
  notes?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await admin
      .from("opportunities")
      .update({
        approval_status: decision,
        approval_decided_at: now,
        approval_decided_by: auth.user.id,
        approval_notes: notes || null,
      })
      .eq("id", opportunityId);

    if (error) return { error: error.message };

    // Also sync the formal approval_requests record if one exists
    const { data: existing } = await admin
      .from("approval_requests" as any)
      .select("id")
      .eq("entity_type", "opportunity")
      .eq("entity_id", opportunityId)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      const mappedStatus = decision === "approved" ? "approved" : "declined";
      await admin
        .from("approval_requests" as any)
        .update({
          status: mappedStatus,
          decision_at: now,
          decision_notes: notes || null,
        })
        .eq("id", (existing[0] as any).id);
    }

    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("decideApprovalAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Add Borrower to Opportunity
// ---------------------------------------------------------------------------

export async function addOpportunityBorrowerAction(
  opportunityId: string,
  borrowerId: string,
  role: string = "co_borrower"
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get max sort_order
    const { data: existing } = await admin
      .from("opportunity_borrowers")
      .select("sort_order")
      .eq("opportunity_id", opportunityId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

    const { error } = await admin.from("opportunity_borrowers").insert({
      opportunity_id: opportunityId,
      borrower_id: borrowerId,
      role,
      sort_order: nextOrder,
    });

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("addOpportunityBorrowerAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Remove Borrower from Opportunity
// ---------------------------------------------------------------------------

export async function removeOpportunityBorrowerAction(
  opportunityId: string,
  borrowerId: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("opportunity_borrowers")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("borrower_id", borrowerId);

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("removeOpportunityBorrowerAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Property Financial Snapshot CRUD
// ---------------------------------------------------------------------------

interface CreateSnapshotInput {
  property_id: string;
  opportunity_id?: string;
  snapshot_type: string;
  effective_date: string;
  source?: string;
  gross_potential_rent?: number;
  gross_scheduled_rent?: number;
  vacancy_loss?: number;
  vacancy_rate_pct?: number;
  other_income?: number;
  effective_gross_income?: number;
  total_operating_expenses?: number;
  taxes?: number;
  insurance?: number;
  management_fee?: number;
  repairs_maintenance?: number;
  utilities?: number;
  other_expenses?: number;
  net_operating_income?: number;
  capex?: number;
  noi_after_capex?: number;
  occupancy_pct?: number;
  economic_occupancy_pct?: number;
  number_of_occupied_units?: number;
  number_of_vacant_units?: number;
  avg_rent_per_unit?: number;
  avg_rent_per_sqft?: number;
  dscr?: number;
  annual_debt_service?: number;
  notes?: string;
}

export async function createSnapshotAction(input: CreateSnapshotInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("property_financial_snapshots")
      .insert({
        created_by: auth.user.id,
        property_id: input.property_id,
        opportunity_id: input.opportunity_id || null,
        snapshot_type: input.snapshot_type,
        effective_date: input.effective_date,
        source: input.source || null,
        gross_potential_rent: input.gross_potential_rent ?? null,
        gross_scheduled_rent: input.gross_scheduled_rent ?? null,
        vacancy_loss: input.vacancy_loss ?? null,
        vacancy_rate_pct: input.vacancy_rate_pct ?? null,
        other_income: input.other_income ?? null,
        effective_gross_income: input.effective_gross_income ?? null,
        total_operating_expenses: input.total_operating_expenses ?? null,
        taxes: input.taxes ?? null,
        insurance: input.insurance ?? null,
        management_fee: input.management_fee ?? null,
        repairs_maintenance: input.repairs_maintenance ?? null,
        utilities: input.utilities ?? null,
        other_expenses: input.other_expenses ?? null,
        net_operating_income: input.net_operating_income ?? null,
        capex: input.capex ?? null,
        noi_after_capex: input.noi_after_capex ?? null,
        occupancy_pct: input.occupancy_pct ?? null,
        economic_occupancy_pct: input.economic_occupancy_pct ?? null,
        number_of_occupied_units: input.number_of_occupied_units ?? null,
        number_of_vacant_units: input.number_of_vacant_units ?? null,
        avg_rent_per_unit: input.avg_rent_per_unit ?? null,
        avg_rent_per_sqft: input.avg_rent_per_sqft ?? null,
        dscr: input.dscr ?? null,
        annual_debt_service: input.annual_debt_service ?? null,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true, snapshotId: data.id };
  } catch (err: any) {
    console.error("createSnapshotAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function deleteSnapshotAction(snapshotId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("property_financial_snapshots")
      .delete()
      .eq("id", snapshotId);

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("deleteSnapshotAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Update Property
// ---------------------------------------------------------------------------

export async function updatePropertyAction(
  propertyId: string,
  updates: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("properties")
      .update(updates)
      .eq("id", propertyId);

    if (error) return { error: error.message };
    revalidatePath("/admin/originations");
    return { success: true };
  } catch (err: any) {
    console.error("updatePropertyAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

