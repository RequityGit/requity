import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOAN_APPLICATION_FORM } from "@/lib/form-engine/loan-application-form";
import type { Json } from "@/lib/supabase/types";

/**
 * POST /api/forms/fix-loan-forms
 * 1. Reverts "Loan Request" back to "Loan Application" (the comprehensive form)
 * 2. Creates the new quick "Loan Request" form from the form definition
 */
export async function POST() {
  try {
    const supabase = createAdminClient();

    // Step 1: Revert the comprehensive form back to "Loan Application"
    const { data: reverted, error: revertError } = await supabase
      .from("form_definitions")
      .update({
        name: "Loan Application",
        slug: "loan-application",
        description: "Comprehensive loan application form",
        updated_at: new Date().toISOString(),
      })
      .eq("slug", "loan-request")
      .select("id, name, slug")
      .single();

    if (revertError && revertError.code !== "PGRST116") {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to revert form: ${revertError.message}`,
        },
        { status: 500 }
      );
    }

    // Step 2: Check if quick "Loan Request" already exists
    const { data: existing } = await supabase
      .from("form_definitions")
      .select("id, name, slug")
      .eq("slug", "loan-request")
      .single();

    if (existing && existing.id !== reverted?.id) {
      // Quick form already exists separately
      return NextResponse.json({
        success: true,
        message: "Forms are correctly set up",
        comprehensiveForm: reverted || { name: "Loan Application", slug: "loan-application" },
        quickForm: existing,
      });
    }

    // Step 3: Create the new quick "Loan Request" form
    const { data: newForm, error: createError } = await supabase
      .from("form_definitions")
      .insert({
        name: LOAN_APPLICATION_FORM.name,
        slug: LOAN_APPLICATION_FORM.slug,
        description: LOAN_APPLICATION_FORM.description,
        status: LOAN_APPLICATION_FORM.status,
        mode: LOAN_APPLICATION_FORM.mode,
        contexts: LOAN_APPLICATION_FORM.contexts,
        settings: LOAN_APPLICATION_FORM.settings as Json,
        steps: LOAN_APPLICATION_FORM.steps as unknown as Json,
      })
      .select("id, name, slug")
      .single();

    if (createError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create quick form: ${createError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Forms fixed successfully",
      comprehensiveForm: reverted || { name: "Loan Application", slug: "loan-application" },
      quickForm: newForm,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fix forms",
      },
      { status: 500 }
    );
  }
}
