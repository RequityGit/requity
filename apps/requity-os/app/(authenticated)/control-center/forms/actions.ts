"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { LOAN_APPLICATION_FORM } from "@/lib/form-engine/loan-application-form";

/**
 * Server action to rename "Loan Application" to "Loan Request"
 */
export async function renameLoanApplicationToLoanRequestAction() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("form_definitions")
      .update({
        name: "Loan Request",
        slug: "loan-request",
        description:
          "Quick loan request form for borrowers and brokers with real-time pricing and term sheet generation",
        updated_at: new Date().toISOString(),
      })
      .eq("slug", "loan-application")
      .select("id, name, slug")
      .single();

    if (error) {
      // Check if already renamed
      if (error.code === "PGRST116") {
        const { data: existing } = await supabase
          .from("form_definitions")
          .select("id, name, slug")
          .eq("slug", "loan-request")
          .single();

        if (existing) {
          return {
            success: true,
            message: "Form already renamed to 'Loan Request'",
            form: existing,
          };
        }
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Form renamed successfully",
      form: data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to rename form",
    };
  }
}

/**
 * Server action to create the loan request form
 * Can be called from the Control Center UI
 */
export async function createLoanApplicationFormAction() {
  try {
    const supabase = createAdminClient();

    // Check if form already exists
    const { data: existing } = await supabase
      .from("form_definitions")
      .select("id, name, slug")
      .eq("slug", LOAN_APPLICATION_FORM.slug)
      .single();

    if (existing) {
      return {
        success: false,
        error: `Form "${existing.name}" already exists with slug "${existing.slug}" (ID: ${existing.id})`,
        formId: existing.id,
      };
    }

    // Insert the form
    const { data, error } = await supabase
      .from("form_definitions")
      .insert({
        name: LOAN_APPLICATION_FORM.name,
        slug: LOAN_APPLICATION_FORM.slug,
        description: LOAN_APPLICATION_FORM.description,
        status: LOAN_APPLICATION_FORM.status,
        mode: LOAN_APPLICATION_FORM.mode,
        contexts: LOAN_APPLICATION_FORM.contexts,
        settings: LOAN_APPLICATION_FORM.settings,
        steps: LOAN_APPLICATION_FORM.steps as any,
      })
      .select("id, name, slug")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      formId: data.id,
      name: data.name,
      slug: data.slug,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create form",
    };
  }
}
