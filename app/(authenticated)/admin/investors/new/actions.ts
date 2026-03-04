"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
// NOTE: Investor contact fields (first_name, last_name, email, phone, address)
// now live on crm_contacts. This legacy action uses `any` casts until refactored.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" } as const;

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!adminRole) return { error: "Unauthorized" } as const;

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

    // 1. Create CRM contact with contact-level fields
    const { data: contact, error: contactError } = await (admin as any)
      .from("crm_contacts")
      .insert({
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
        contact_type: "investor",
        status: "active",
      })
      .select("id")
      .single();

    if (contactError) {
      if (contactError.message.includes("duplicate") || contactError.message.includes("unique")) {
        return { error: `A contact with email ${input.email} already exists.` };
      }
      return { error: contactError.message };
    }

    // 2. Create investor with investor-specific fields + crm_contact_id link
    const { data, error } = await admin
      .from("investors")
      .insert({
        crm_contact_id: contact.id,
        notes: input.notes || null,
        accreditation_status: "pending",
      })
      .select("id")
      .single();

    if (error) {
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
