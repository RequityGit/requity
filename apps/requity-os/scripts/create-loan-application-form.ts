/**
 * Script to create the Loan Request form definition
 * 
 * Run with: pnpm --filter @repo/requity-os tsx scripts/create-loan-application-form.ts
 */

import { createAdminClient } from "../lib/supabase/admin";
import { LOAN_APPLICATION_FORM } from "../lib/form-engine/loan-application-form";
import type { Json } from "../lib/supabase/types";

async function main() {
  const supabase = createAdminClient();

  // Check if form already exists
  const { data: existing } = await supabase
    .from("form_definitions")
    .select("id, name, slug")
    .eq("slug", LOAN_APPLICATION_FORM.slug)
    .single();

  if (existing) {
    console.log(`Form "${existing.name}" already exists with slug "${existing.slug}"`);
    console.log(`ID: ${existing.id}`);
    console.log("\nTo update it, delete the existing form first or update it via Control Center.");
    process.exit(0);
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
    console.error("Error creating form:", error);
    process.exit(1);
  }

  console.log("✅ Loan Request form created successfully!");
  console.log(`ID: ${data.id}`);
  console.log(`Name: ${data.name}`);
  console.log(`Slug: ${data.slug}`);
  console.log(`\nAccess it at: /forms/${data.slug}`);
  console.log(`Edit it at: /control-center/forms/${data.id}`);
}

main().catch(console.error);
