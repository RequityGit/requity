"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// lender_quotes / lender_quote_activities tables may not be in the generated
// TypeScript schema yet — use `any` casts on admin client for these tables.

async function requireAdmin(): Promise<
  { user: { id: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: role } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!role) return { error: "Not authorized" };

  return { user };
}

// ── Create Quote ──────────────────────────────────────────────────────────

export async function createLenderQuote(input: {
  quote_name: string;
  loan_id: string;
  lender_company_id?: string | null;
  lender_contact_name?: string | null;
  loan_amount?: number | null;
  interest_rate?: number | null;
  loan_term_months?: number | null;
  description?: string | null;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await (admin as any)
      .from("lender_quotes")
      .insert({
        quote_name: input.quote_name,
        loan_id: input.loan_id,
        lender_company_id: input.lender_company_id ?? null,
        lender_contact_name: input.lender_contact_name ?? null,
        loan_amount: input.loan_amount ?? null,
        interest_rate: input.interest_rate ?? null,
        loan_term_months: input.loan_term_months ?? null,
        description: input.description ?? null,
        requested_at: new Date().toISOString(),
        created_by: auth.user.id,
        updated_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("createLenderQuote error:", error);
      return { error: error.message };
    }

    // Log activity
    await (admin as any).from("lender_quote_activities").insert({
      quote_id: data.id,
      activity_type: "status_change",
      description: "Quote created with status: Request for Quote",
      new_status: "request_for_quote",
      created_by: auth.user.id,
    });

    return { success: true, data };
  } catch (err: unknown) {
    console.error("createLenderQuote error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ── Update Quote ──────────────────────────────────────────────────────────

export async function updateLenderQuote(
  quoteId: string,
  input: {
    quote_name?: string;
    lender_company_id?: string | null;
    lender_contact_name?: string | null;
    linked_property_id?: string | null;
    loan_amount?: number | null;
    interest_rate?: number | null;
    loan_term_months?: number | null;
    interest_only_period_months?: number | null;
    ltv?: number | null;
    amortization_months?: number | null;
    origination_fee?: number | null;
    uw_processing_fee?: number | null;
    requity_lending_fee?: number | null;
    prepayment_penalty?: string | null;
    ym_spread?: number | null;
    ym_amount?: number | null;
    term_sheet_url?: string | null;
    description?: string | null;
  }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await (admin as any)
      .from("lender_quotes")
      .update({
        ...input,
        updated_by: auth.user.id,
      })
      .eq("id", quoteId)
      .select()
      .single();

    if (error) {
      console.error("updateLenderQuote error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("updateLenderQuote error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ── Change Quote Status ───────────────────────────────────────────────────

export async function changeQuoteStatus(
  quoteId: string,
  newStatus: string,
  declinedReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get current status
    const { data: current, error: fetchError } = await (admin as any)
      .from("lender_quotes")
      .select("status")
      .eq("id", quoteId)
      .single();

    if (fetchError || !current) {
      return { error: "Quote not found" };
    }

    const oldStatus = current.status;

    // Build update object with auto-set timestamps
    const updateData: Record<string, unknown> = {
      status: newStatus,
      status_changed_at: new Date().toISOString(),
      updated_by: auth.user.id,
    };

    if (newStatus === "term_sheet_unsigned") {
      updateData.received_at = new Date().toISOString();
    } else if (newStatus === "term_sheet_accepted") {
      updateData.accepted_at = new Date().toISOString();
    } else if (newStatus === "declined") {
      updateData.declined_at = new Date().toISOString();
      if (declinedReason) {
        updateData.declined_reason = declinedReason;
      }
    }

    const { data, error } = await (admin as any)
      .from("lender_quotes")
      .update(updateData)
      .eq("id", quoteId)
      .select()
      .single();

    if (error) {
      console.error("changeQuoteStatus error:", error);
      return { error: error.message };
    }

    // Log the status change activity
    const statusLabels: Record<string, string> = {
      request_for_quote: "Request for Quote",
      term_sheet_unsigned: "Term Sheet - Unsigned",
      term_sheet_accepted: "Term Sheet - Accepted",
      declined: "Declined",
      complete: "Complete",
    };

    await (admin as any).from("lender_quote_activities").insert({
      quote_id: quoteId,
      activity_type: "status_change",
      description: `Status changed from "${statusLabels[oldStatus] ?? oldStatus}" to "${statusLabels[newStatus] ?? newStatus}"`,
      old_status: oldStatus,
      new_status: newStatus,
      created_by: auth.user.id,
    });

    return { success: true, data };
  } catch (err: unknown) {
    console.error("changeQuoteStatus error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ── Decline Other Quotes ──────────────────────────────────────────────────

export async function declineOtherQuotes(
  acceptedQuoteId: string,
  loanId: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get all other non-declined, non-complete quotes for this loan
    const { data: otherQuotes, error: fetchError } = await (admin as any)
      .from("lender_quotes")
      .select("id, status, quote_name")
      .eq("loan_id", loanId)
      .neq("id", acceptedQuoteId)
      .not("status", "in", '("declined","complete")');

    if (fetchError) {
      console.error("declineOtherQuotes fetch error:", fetchError);
      return { error: fetchError.message };
    }

    const now = new Date().toISOString();

    for (const quote of otherQuotes ?? []) {
      await (admin as any)
        .from("lender_quotes")
        .update({
          status: "declined",
          status_changed_at: now,
          declined_at: now,
          declined_reason: "Another quote was accepted",
          updated_by: auth.user.id,
        })
        .eq("id", quote.id);

      await (admin as any).from("lender_quote_activities").insert({
        quote_id: quote.id,
        activity_type: "status_change",
        description: `Auto-declined: another quote was accepted for this deal`,
        old_status: quote.status,
        new_status: "declined",
        created_by: auth.user.id,
      });
    }

    return { success: true, declined: (otherQuotes ?? []).length };
  } catch (err: unknown) {
    console.error("declineOtherQuotes error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ── Add Quote Activity ────────────────────────────────────────────────────

export async function addQuoteActivity(input: {
  quote_id: string;
  activity_type: string;
  description: string;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await (admin as any)
      .from("lender_quote_activities")
      .insert({
        quote_id: input.quote_id,
        activity_type: input.activity_type,
        description: input.description,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("addQuoteActivity error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("addQuoteActivity error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ── Delete Quote ──────────────────────────────────────────────────────────

export async function deleteLenderQuote(quoteId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Activities cascade delete via FK
    const { error } = await (admin as any)
      .from("lender_quotes")
      .delete()
      .eq("id", quoteId);

    if (error) {
      console.error("deleteLenderQuote error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteLenderQuote error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
