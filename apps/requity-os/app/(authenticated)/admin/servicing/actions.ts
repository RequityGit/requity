"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

    revalidatePath("/admin/servicing");
    return { success: true, loanId: newLoan.loan_id };
  } catch (err: unknown) {
    console.error("addLoanToServicingAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Loan type mapping: pipeline enum → servicing display text
// ---------------------------------------------------------------------------

const LOAN_TYPE_MAP: Record<string, string> = {
  rtl: "RTL",
  commercial: "Commercial",
  dscr: "DSCR",
  guc: "GUC",
  transactional: "Transactional",
};

const LOAN_PURPOSE_MAP: Record<string, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  cash_out_refinance: "Refinance",
};

// ---------------------------------------------------------------------------
// Move a pipeline loan to servicing — copies all relevant data
// ---------------------------------------------------------------------------

export async function moveToServicingAction(pipelineLoanId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient() as any;

    // 1. Fetch pipeline loan with all fields
    const { data: loan, error: loanErr } = await admin
      .from("loans")
      .select("*")
      .eq("id", pipelineLoanId)
      .is("deleted_at", null)
      .single();

    if (loanErr || !loan) return { error: "Pipeline loan not found" };

    if (!loan.loan_number) return { error: "Pipeline loan has no loan number — cannot migrate" };

    // 2. Check if a servicing record already exists
    const { data: existingServicing } = await admin
      .from("servicing_loans")
      .select("id")
      .eq("loan_id", loan.loan_number)
      .maybeSingle();

    if (existingServicing) {
      return { error: `Loan ${loan.loan_number} already exists in servicing` };
    }

    // 3. Fetch borrower name
    let borrowerName: string | null = null;
    if (loan.borrower_id) {
      const { data: borrower } = await admin
        .from("borrowers")
        .select("first_name, last_name, crm_contact_id")
        .eq("id", loan.borrower_id)
        .maybeSingle();

      if (borrower?.crm_contact_id) {
        const { data: contact } = await admin
          .from("crm_contacts")
          .select("first_name, last_name")
          .eq("id", borrower.crm_contact_id)
          .maybeSingle();
        if (contact) {
          borrowerName = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || null;
        }
      }
      if (!borrowerName && borrower) {
        borrowerName = `${borrower.first_name ?? ""} ${borrower.last_name ?? ""}`.trim() || null;
      }
    }

    // 4. Fetch entity name
    let entityName: string | null = null;
    if (loan.borrower_entity_id) {
      const { data: entity } = await admin
        .from("borrower_entities")
        .select("entity_name")
        .eq("id", loan.borrower_entity_id)
        .maybeSingle();
      entityName = entity?.entity_name ?? null;
    }

    // 5. Build servicing loan payload
    const cityStateZip = [loan.property_city, loan.property_state, loan.property_zip]
      .filter(Boolean)
      .join(", ");

    const payload: Record<string, any> = {
      loan_id: loan.loan_number,
      pipeline_loan_id: loan.id,
      loan_status: "Active",
      total_loan_amount: loan.loan_amount ?? loan.total_loan_amount ?? 0,
      current_balance: loan.loan_amount ?? loan.total_loan_amount ?? 0,
    };

    // Map basic info
    if (borrowerName) payload.borrower_name = borrowerName;
    if (entityName) payload.entity_name = entityName;
    if (loan.property_address) payload.property_address = loan.property_address;
    if (cityStateZip) payload.city_state_zip = cityStateZip;
    if (loan.type) payload.loan_type = LOAN_TYPE_MAP[loan.type] ?? loan.type;
    if (loan.purpose) payload.loan_purpose = LOAN_PURPOSE_MAP[loan.purpose] ?? loan.purpose;
    if (loan.originator) payload.originator = loan.originator;
    if (loan.notes) payload.notes = loan.notes;

    // Map financial fields
    if (loan.rehab_holdback != null) payload.construction_holdback = loan.rehab_holdback;
    if (loan.interest_rate != null) payload.interest_rate = loan.interest_rate;
    if (loan.default_rate != null) payload.default_rate = loan.default_rate;
    if (loan.origination_date) payload.origination_date = loan.origination_date;
    if (loan.funding_date) payload.origination_date = loan.funding_date; // prefer funding_date
    if (loan.maturity_date) payload.maturity_date = loan.maturity_date;
    if (loan.first_payment_date) payload.first_payment_date = loan.first_payment_date;
    if (loan.loan_term_months) payload.term_months = loan.loan_term_months;
    if (loan.monthly_payment) payload.monthly_payment = loan.monthly_payment;
    if (loan.purchase_price) payload.purchase_price = loan.purchase_price;
    if (loan.appraised_value) payload.origination_value = loan.appraised_value;
    if (loan.after_repair_value ?? loan.arv) payload.stabilized_value = loan.after_repair_value ?? loan.arv;
    if (loan.ltv != null) payload.ltv_origination = loan.ltv;
    if (loan.origination_fee_amount ?? loan.origination_fee) {
      payload.origination_fee = loan.origination_fee_amount ?? loan.origination_fee;
    }

    // Compute draw funds available from rehab budget & total draws
    if (loan.rehab_budget != null) {
      const totalDrawsFunded = loan.total_draws_funded ?? 0;
      payload.draw_funds_available = Math.max(0, loan.rehab_budget - totalDrawsFunded);
      payload.funds_released = totalDrawsFunded;
    }

    // 6. Insert servicing loan
    const { data: newLoan, error: insertError } = await admin
      .from("servicing_loans")
      .insert(payload)
      .select("id, loan_id")
      .single();

    if (insertError) {
      console.error("moveToServicingAction insert error:", insertError);
      return { error: insertError.message };
    }

    // 7. Update pipeline loan stage to 'servicing'
    await admin
      .from("loans")
      .update({
        stage: "servicing",
        stage_updated_at: new Date().toISOString(),
      })
      .eq("id", pipelineLoanId);

    // 8. Log stage history
    await admin.from("loan_stage_history" as any).insert({
      loan_id: pipelineLoanId,
      from_stage: loan.stage,
      to_stage: "servicing",
      changed_by: auth.user.id,
      changed_at: new Date().toISOString(),
    });

    // 9. Log to servicing audit
    await admin.from("servicing_audit_log").insert({
      action: "LOAN_BOARDED",
      loan_id: loan.loan_number,
      field_changed: "loan_status",
      new_value: "Active",
      entry_type: "Pipeline Migration",
      user_email: auth.user.email ?? "unknown",
      notes: `Loan migrated from pipeline (stage: ${loan.stage}) by ${auth.user.email}`,
    });

    revalidatePath("/admin/servicing");
    return { success: true, loanId: newLoan.loan_id };
  } catch (err: unknown) {
    console.error("moveToServicingAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
