"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

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

    // Step 1: Create a CRM contact for the investor
    const { data: contact, error: contactError } = await (admin as any)
      .from("crm_contacts")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        name: `${input.first_name} ${input.last_name}`.trim(),
        email: input.email || null,
        phone: input.phone || null,
        contact_type: "investor",
        contact_types: ["investor"],
        status: "active",
        address_line1: input.address_line1 || null,
        address_line2: input.address_line2 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        country: input.country || "US",
      })
      .select("id")
      .single();

    if (contactError) {
      if (contactError.message.includes("duplicate") || contactError.message.includes("unique")) {
        return { error: `A contact with email ${input.email} already exists.` };
      }
      return { error: `Failed to create contact: ${contactError.message}` };
    }

    // Step 2: Create the investor record linked to the CRM contact
    const { data: investor, error: investorError } = await admin
      .from("investors")
      .insert({
        crm_contact_id: contact.id,
        accreditation_status: "pending",
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (investorError) {
      // Clean up the orphaned contact
      await (admin as any).from("crm_contacts").delete().eq("id", contact.id);
      return { error: `Failed to create investor: ${investorError.message}` };
    }

    revalidatePath("/contacts");
    return { success: true, investorId: investor.id };
  } catch (err: unknown) {
    console.error("addInvestorAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
