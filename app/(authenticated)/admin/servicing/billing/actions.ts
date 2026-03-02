"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  return { user, supabase };
}

export async function generateBillingCycleAction(billingMonth: string) {
  try {
    const { user } = await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin.rpc("generate_billing_cycle", {
      p_billing_month: billingMonth,
      p_created_by: user.id,
    });

    if (error) {
      console.error("Generate billing cycle error:", error);
      return { error: error.message };
    }

    return { success: true, billingCycleId: data };
  } catch (err: any) {
    console.error("Generate billing cycle error:", err);
    return { error: err.message };
  }
}

export async function runReconciliationAction(billingCycleId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin.rpc("run_reconciliation_checks", {
      p_billing_cycle_id: billingCycleId,
    });

    if (error) {
      console.error("Reconciliation error:", error);
      return { error: error.message };
    }

    return { success: true, result: data };
  } catch (err: any) {
    console.error("Reconciliation error:", err);
    return { error: err.message };
  }
}

export async function approveBillingCycleAction(billingCycleId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    // First run reconciliation checks
    const { data: reconData, error: reconError } = await admin.rpc(
      "run_reconciliation_checks",
      { p_billing_cycle_id: billingCycleId }
    );

    if (reconError) {
      return { error: "Reconciliation failed: " + reconError.message };
    }

    if (reconData && !reconData.passed) {
      return {
        error: "Reconciliation checks failed. Fix errors before approving.",
        reconciliation: reconData,
      };
    }

    // Move to reconciled status
    const { error: updateError } = await admin
      .from("billing_cycles")
      .update({ status: "reconciled" })
      .eq("id", billingCycleId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true, reconciliation: reconData };
  } catch (err: any) {
    console.error("Approve billing cycle error:", err);
    return { error: err.message };
  }
}

export async function submitBillingCycleAction(billingCycleId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { error } = await admin
      .from("billing_cycles")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", billingCycleId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Submit billing cycle error:", err);
    return { error: err.message };
  }
}

export async function completeBillingCycleAction(billingCycleId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { error } = await admin
      .from("billing_cycles")
      .update({ status: "complete" })
      .eq("id", billingCycleId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Complete billing cycle error:", err);
    return { error: err.message };
  }
}

export async function generateNachaAction(billingCycleId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin.rpc("generate_nacha_file", {
      p_billing_cycle_id: billingCycleId,
    });

    if (error) {
      console.error("NACHA generation error:", error);
      return { error: error.message };
    }

    return { success: true, nachaContent: data };
  } catch (err: any) {
    console.error("NACHA generation error:", err);
    return { error: err.message };
  }
}

export async function applyPaymentAction(
  loanId: string,
  paymentDate: string,
  amount: number,
  referenceNumber: string
) {
  try {
    const { user } = await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin.rpc("apply_payment", {
      p_loan_id: loanId,
      p_payment_date: paymentDate,
      p_amount_received: amount,
      p_reference_number: referenceNumber,
      p_applied_by: user.id,
    });

    if (error) {
      console.error("Apply payment error:", error);
      return { error: error.message };
    }

    return { success: true, result: data };
  } catch (err: any) {
    console.error("Apply payment error:", err);
    return { error: err.message };
  }
}

export async function generatePayoffQuoteAction(
  loanId: string,
  payoffDate: string
) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin.rpc("generate_payoff_quote", {
      p_loan_id: loanId,
      p_payoff_date: payoffDate,
    });

    if (error) {
      console.error("Payoff quote error:", error);
      return { error: error.message };
    }

    return { success: true, result: data };
  } catch (err: any) {
    console.error("Payoff quote error:", err);
    return { error: err.message };
  }
}

export async function refreshDelinquencyAction() {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin.rpc("refresh_delinquency_records");

    if (error) {
      console.error("Refresh delinquency error:", error);
      return { error: error.message };
    }

    return { success: true, result: data };
  } catch (err: any) {
    console.error("Refresh delinquency error:", err);
    return { error: err.message };
  }
}

export async function fetchBillingLineItemsAction(billingCycleId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin
      .from("billing_line_items")
      .select("*")
      .eq("billing_cycle_id", billingCycleId)
      .order("loan_id");

    if (error) {
      return { error: error.message };
    }

    return { success: true, items: data ?? [] };
  } catch (err: any) {
    console.error("Fetch billing line items error:", err);
    return { error: err.message };
  }
}

export async function fetchLoanEventsAction(loanId: string) {
  try {
    await requireAdmin();
    const admin = createAdminClient() as any;

    const { data, error } = await admin
      .from("loan_events")
      .select("*")
      .eq("loan_id", loanId)
      .order("event_date", { ascending: false })
      .limit(100);

    if (error) {
      return { error: error.message };
    }

    return { success: true, events: data ?? [] };
  } catch (err: any) {
    console.error("Fetch loan events error:", err);
    return { error: err.message };
  }
}
