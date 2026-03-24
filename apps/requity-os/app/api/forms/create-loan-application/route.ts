import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOAN_APPLICATION_FORM } from "@/lib/form-engine/loan-application-form";
import type { Json } from "@/lib/supabase/types";

/**
 * POST /api/forms/create-loan-application
 * Creates the loan request form definition (quick intake form for website)
 */
export async function POST() {
  try {
    const supabase = createAdminClient();

    // Check if form already exists
    const { data: existing } = await supabase
      .from("form_definitions")
      .select("id, name, slug")
      .eq("slug", LOAN_APPLICATION_FORM.slug)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: `Form "${existing.name}" already exists`,
        formId: existing.id,
        slug: existing.slug,
      });
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
        settings: LOAN_APPLICATION_FORM.settings as Json,
        steps: LOAN_APPLICATION_FORM.steps as unknown as Json,
      })
      .select("id, name, slug")
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      formId: data.id,
      name: data.name,
      slug: data.slug,
      message: `Form created successfully! Access it at /forms/${data.slug}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create form",
      },
      { status: 500 }
    );
  }
}
