"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function generateBillingCycleAction(billingMonth: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("generate_billing_cycle", {
      p_billing_month: billingMonth,
      p_created_by: auth.user.id,
    });

    if (error) {
      console.error("Generate billing cycle error:", error);
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, billingCycleId: data };
  } catch (err: unknown) {
    console.error("Generate billing cycle error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function runReconciliationAction(billingCycleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("run_reconciliation_checks", {
      p_billing_cycle_id: billingCycleId,
    });

    if (error) {
      console.error("Reconciliation error:", error);
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, result: data };
  } catch (err: unknown) {
    console.error("Reconciliation error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function approveBillingCycleAction(billingCycleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    // First run reconciliation checks
    const { data: reconData, error: reconError } = await admin.rpc(
      "run_reconciliation_checks",
      { p_billing_cycle_id: billingCycleId }
    );

    if (reconError) {
      return { error: "Reconciliation failed: " + reconError.message };
    }

    const reconResult = reconData as { passed?: boolean } | null;
    if (reconResult && !reconResult.passed) {
      return {
        error: "Reconciliation checks failed. Fix errors before approving.",
        reconciliation: reconResult,
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

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, reconciliation: reconData };
  } catch (err: unknown) {
    console.error("Approve billing cycle error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function submitBillingCycleAction(billingCycleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { error } = await admin
      .from("billing_cycles")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", billingCycleId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true };
  } catch (err: unknown) {
    console.error("Submit billing cycle error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function completeBillingCycleAction(billingCycleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { error } = await admin
      .from("billing_cycles")
      .update({ status: "complete" })
      .eq("id", billingCycleId);

    if (error) {
      return { error: error.message };
    }

    // Log to servicing audit
    const { error: auditError } = await admin.from("servicing_audit_log").insert({
      action: "BILLING_CYCLE_COMPLETED",
      loan_id: billingCycleId,
      field_changed: "status",
      new_value: "complete",
      entry_type: "System",
      user_email: auth.user.email ?? "unknown",
      notes: `Billing cycle marked complete by ${auth.user.email}`,
    });

    if (auditError) {
      console.error("completeBillingCycleAction audit log error:", auditError);
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true };
  } catch (err: unknown) {
    console.error("Complete billing cycle error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function generateNachaAction(billingCycleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("generate_nacha_file", {
      p_billing_cycle_id: billingCycleId,
    });

    if (error) {
      console.error("NACHA generation error:", error);
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, nachaContent: data };
  } catch (err: unknown) {
    console.error("NACHA generation error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function applyPaymentAction(
  loanId: string,
  paymentDate: string,
  amount: number,
  referenceNumber: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("apply_payment", {
      p_loan_id: loanId,
      p_payment_date: paymentDate,
      p_amount_received: amount,
      p_reference_number: referenceNumber,
      p_applied_by: auth.user.id,
    });

    if (error) {
      console.error("Apply payment error:", error);
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, result: data };
  } catch (err: unknown) {
    console.error("Apply payment error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function generatePayoffQuoteAction(
  loanId: string,
  payoffDate: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("generate_payoff_quote", {
      p_loan_id: loanId,
      p_payoff_date: payoffDate,
    });

    if (error) {
      console.error("Payoff quote error:", error);
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, result: data };
  } catch (err: unknown) {
    console.error("Payoff quote error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function refreshDelinquencyAction() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("refresh_delinquency_records");

    if (error) {
      console.error("Refresh delinquency error:", error);
      return { error: error.message };
    }

    revalidatePath("/servicing/billing");
    revalidatePath("/servicing");
    return { success: true, result: data };
  } catch (err: unknown) {
    console.error("Refresh delinquency error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function fetchBillingLineItemsAction(billingCycleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("billing_line_items")
      .select("*")
      .eq("billing_cycle_id", billingCycleId)
      .order("loan_id");

    if (error) {
      return { error: error.message };
    }

    return { success: true, items: data ?? [] };
  } catch (err: unknown) {
    console.error("Fetch billing line items error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function fetchLoanEventsAction(loanId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };
    const admin = createAdminClient();

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
  } catch (err: unknown) {
    console.error("Fetch loan events error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
