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

export interface ServicingLoanFormData {
  // Basic info (any admin)
  loan_id: string;
  borrower_name: string;
  entity_name: string;
  property_address: string;
  city_state_zip: string;
  loan_type: string;
  loan_purpose: string;
  asset_class: string;
  program: string;
  originator: string;
  notes: string;
  // Financial / servicing fields (super admin only for edits post-creation)
  loan_status: string;
  total_loan_amount: string;
  construction_holdback: string;
  funds_released: string;
  current_balance: string;
  draw_funds_available: string;
  interest_rate: string;
  dutch_interest: boolean;
  origination_date: string;
  maturity_date: string;
  term_months: string;
  payment_type: string;
  monthly_payment: string;
  fund_name: string;
  fund_ownership_pct: string;
  purchase_price: string;
  origination_value: string;
  stabilized_value: string;
  ltv_origination: string;
  ltc: string;
  borrower_credit_score: string;
  origination_fee: string;
  exit_fee: string;
  default_rate: string;
  ach_status: string;
}

export async function addLoanToServicingAction(formData: ServicingLoanFormData) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient() as any;

    // Validate required fields
    if (!formData.loan_id?.trim()) return { error: "Loan ID is required" };
    if (!formData.total_loan_amount) return { error: "Total loan amount is required" };

    // Check for duplicate loan_id
    const { data: existing } = await admin
      .from("servicing_loans")
      .select("id")
      .eq("loan_id", formData.loan_id.trim())
      .single();

    if (existing) return { error: `Loan ID "${formData.loan_id}" already exists in servicing` };

    // Build insert payload
    const payload: Record<string, any> = {
      loan_id: formData.loan_id.trim(),
      loan_status: formData.loan_status || "Active",
      total_loan_amount: parseFloat(formData.total_loan_amount) || 0,
    };

    // Basic info fields
    if (formData.borrower_name?.trim()) payload.borrower_name = formData.borrower_name.trim();
    if (formData.entity_name?.trim()) payload.entity_name = formData.entity_name.trim();
    if (formData.property_address?.trim()) payload.property_address = formData.property_address.trim();
    if (formData.city_state_zip?.trim()) payload.city_state_zip = formData.city_state_zip.trim();
    if (formData.loan_type?.trim()) payload.loan_type = formData.loan_type.trim();
    if (formData.loan_purpose?.trim()) payload.loan_purpose = formData.loan_purpose.trim();
    if (formData.asset_class?.trim()) payload.asset_class = formData.asset_class.trim();
    if (formData.program?.trim()) payload.program = formData.program.trim();
    if (formData.originator?.trim()) payload.originator = formData.originator.trim();
    if (formData.notes?.trim()) payload.notes = formData.notes.trim();

    // Financial fields
    if (formData.construction_holdback) payload.construction_holdback = parseFloat(formData.construction_holdback);
    if (formData.funds_released) payload.funds_released = parseFloat(formData.funds_released);
    if (formData.current_balance) payload.current_balance = parseFloat(formData.current_balance);
    if (formData.draw_funds_available) payload.draw_funds_available = parseFloat(formData.draw_funds_available);
    if (formData.interest_rate) payload.interest_rate = parseFloat(formData.interest_rate) / 100; // Convert % to decimal
    payload.dutch_interest = formData.dutch_interest ?? false;
    if (formData.origination_date) payload.origination_date = formData.origination_date;
    if (formData.maturity_date) payload.maturity_date = formData.maturity_date;
    if (formData.term_months) payload.term_months = parseInt(formData.term_months);
    if (formData.payment_type) payload.payment_type = formData.payment_type;
    if (formData.monthly_payment) payload.monthly_payment = parseFloat(formData.monthly_payment);
    if (formData.fund_name?.trim()) payload.fund_name = formData.fund_name.trim();
    if (formData.fund_ownership_pct) payload.fund_ownership_pct = parseFloat(formData.fund_ownership_pct) / 100;
    if (formData.purchase_price) payload.purchase_price = parseFloat(formData.purchase_price);
    if (formData.origination_value) payload.origination_value = parseFloat(formData.origination_value);
    if (formData.stabilized_value) payload.stabilized_value = parseFloat(formData.stabilized_value);
    if (formData.ltv_origination) payload.ltv_origination = parseFloat(formData.ltv_origination) / 100;
    if (formData.ltc) payload.ltc = parseFloat(formData.ltc) / 100;
    if (formData.borrower_credit_score) payload.borrower_credit_score = parseInt(formData.borrower_credit_score);
    if (formData.origination_fee) payload.origination_fee = parseFloat(formData.origination_fee);
    if (formData.exit_fee) payload.exit_fee = parseFloat(formData.exit_fee);
    if (formData.default_rate) payload.default_rate = parseFloat(formData.default_rate) / 100;
    if (formData.ach_status?.trim()) payload.ach_status = formData.ach_status.trim();

    const { data: newLoan, error: insertError } = await admin
      .from("servicing_loans")
      .insert(payload)
      .select("id, loan_id")
      .single();

    if (insertError) {
      console.error("addLoanToServicingAction insert error:", insertError);
      return { error: insertError.message };
    }

    // Log to audit
    await admin.from("servicing_audit_log").insert({
      action: "LOAN_BOARDED",
      loan_id: formData.loan_id.trim(),
      field_changed: "loan_status",
      new_value: formData.loan_status || "Active",
      entry_type: "Manual",
      user_email: auth.user.email ?? "unknown",
      notes: `Loan boarded to servicing by ${auth.user.email}`,
    });

    return { success: true, loanId: newLoan.loan_id };
  } catch (err: unknown) {
    console.error("addLoanToServicingAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
