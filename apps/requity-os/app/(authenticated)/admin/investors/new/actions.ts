"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
// NOTE: Investor contact fields (first_name, last_name, email, phone, address)
// now live on crm_contacts. This legacy action uses `any` casts until refactored.

// ---------------------------------------------------------------------------
// Add Investor
// ---------------------------------------------------------------------------

interface AddInvestorInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
}

export async function addInvestorAction(input: AddInvestorInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Legacy fields — these columns now live on crm_contacts; cast to any until refactored
    const investorData: Record<string, unknown> = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone || null,
      address_line1: input.address_line1 || null,
      address_line2: input.address_line2 || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      country: input.country || "US",
      notes: input.notes || null,
      accreditation_status: "pending",
    };

    const { data, error } = await (admin as any)
      .from("investors")
      .insert(investorData)
      .select("id")
      .single();

    if (error) {
      // Handle unique constraint on email
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return { error: `An investor with email ${input.email} already exists.` };
      }
      return { error: error.message };
    }

    if (!data) {
      return { error: "Failed to create investor — no data returned" };
    }

    return { success: true, investorId: data.id };
  } catch (err: unknown) {
    console.error("addInvestorAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
