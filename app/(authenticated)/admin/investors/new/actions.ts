"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InvestorInsert } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" } as const;

  return { user } as const;
}

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

    const investorData: InvestorInsert = {
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
    };

    const { data, error } = await admin
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
