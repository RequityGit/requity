"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

interface ProcessFormSubmissionInput {
  submissionId: string;
  action: "create_opportunity" | "mark_reviewed";
  dealName?: string | null;
  loanType?: string | null;
  loanAmount?: number | null;
  notes?: string | null;
}

export async function processFormSubmissionAction(
  input: ProcessFormSubmissionInput
): Promise<{ success?: boolean; error?: string; opportunityId?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Load submission
    const { data: submission, error: subError } = await admin
      .from("form_submissions")
      .select("*")
      .eq("id", input.submissionId)
      .single();

    if (subError || !submission) {
      return { error: "Submission not found" };
    }

    const formData = (submission.data as Record<string, unknown>) || {};
    const entityIds = (submission.entity_ids as Record<string, unknown>) || {};

    if (input.action === "create_opportunity") {
      if (!input.dealName) {
        return { error: "Deal name is required" };
      }

      // Build opportunity data from form submission
      const oppData: Record<string, unknown> = {
        created_by: auth.user.id,
        deal_name: input.dealName,
        loan_type: input.loanType || formData.loan_type || null,
        proposed_loan_amount: input.loanAmount || formData.loan_amount || formData.proposed_loan_amount || null,
        stage: "awaiting_info",
        originator: auth.user.id,
      };

      // Link existing entities
      if (entityIds.property_id) {
        oppData.property_id = entityIds.property_id;
      }
      if (entityIds.borrower_entity_id) {
        oppData.borrower_entity_id = entityIds.borrower_entity_id;
      }

      // Add other mapped fields from form data
      if (formData.loan_purpose) oppData.loan_purpose = formData.loan_purpose;
      if (formData.funding_channel) oppData.funding_channel = formData.funding_channel;
      if (formData.proposed_interest_rate) oppData.proposed_interest_rate = formData.proposed_interest_rate;
      if (formData.proposed_loan_term_months) oppData.proposed_loan_term_months = formData.proposed_loan_term_months;
      if (formData.proposed_ltv) oppData.proposed_ltv = formData.proposed_ltv;

      // Create opportunity
      const { data: newOpp, error: oppError } = await admin
        .from("opportunities")
        .insert(oppData)
        .select("id")
        .single();

      if (oppError) {
        return { error: `Failed to create opportunity: ${oppError.message}` };
      }

      // Update submission with opportunity ID and mark as reviewed
      const updatedEntityIds = { ...entityIds, opportunity_id: newOpp.id };
      const { error: updateError } = await admin
        .from("form_submissions")
        .update({
          status: "reviewed",
          entity_ids: updatedEntityIds,
          changes: {
            ...((submission.changes as Record<string, unknown>) || {}),
            internal_notes: input.notes || ((submission.changes as Record<string, unknown>)?.internal_notes as string) || null,
          },
        })
        .eq("id", input.submissionId);

      if (updateError) {
        console.error("Failed to update submission:", updateError);
        // Opportunity was created, so still return success
      }

      revalidatePath("/control-center/forms/review");
      return { success: true, opportunityId: newOpp.id };
    }

    if (input.action === "mark_reviewed") {
      const { error: updateError } = await admin
        .from("form_submissions")
        .update({
          status: "reviewed",
          changes: {
            ...((submission.changes as Record<string, unknown>) || {}),
            internal_notes: input.notes || ((submission.changes as Record<string, unknown>)?.internal_notes as string) || null,
          },
        })
        .eq("id", input.submissionId);

      if (updateError) {
        return { error: `Failed to update submission: ${updateError.message}` };
      }

      revalidatePath("/control-center/forms/review");
      return { success: true };
    }

    return { error: "Invalid action" };
  } catch (err: any) {
    console.error("processFormSubmissionAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}
