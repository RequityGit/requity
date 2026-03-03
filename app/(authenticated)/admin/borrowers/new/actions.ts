"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

  if (profile?.role !== "admin" && profile?.role !== "super_admin") return { error: "Unauthorized" } as const;

  return { user } as const;
}

// ---------------------------------------------------------------------------
// Borrower CRUD
// ---------------------------------------------------------------------------

interface AddBorrowerInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  ssn_last_four?: string;
  is_us_citizen?: boolean;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  credit_score?: number;
  credit_report_date?: string;
  experience_count?: number;
  notes?: string;
}

export async function addBorrowerAction(input: AddBorrowerInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // 1. Create the CRM contact first (contact fields live on crm_contacts)
    const { data: contact, error: contactError } = await admin
      .from("crm_contacts")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone || null,
        address_line1: input.address_line1 || null,
        address_line2: input.address_line2 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        country: input.country || "US",
        contact_type: "borrower" as any,
        status: "active" as any,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (contactError) {
      console.error("addBorrowerAction crm_contacts insert error:", contactError);
      return { error: contactError.message };
    }

    // 2. Create the borrower record with link to CRM contact
    const { data, error } = await admin
      .from("borrowers")
      .insert({
        crm_contact_id: contact.id,
        date_of_birth: input.date_of_birth || null,
        ssn_last_four: input.ssn_last_four || null,
        is_us_citizen: input.is_us_citizen ?? true,
        credit_score: input.credit_score ?? null,
        credit_report_date: input.credit_report_date || null,
        experience_count: input.experience_count ?? 0,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("addBorrowerAction borrowers insert error:", error);
      return { error: error.message };
    }

    if (!data) {
      return { error: "Failed to create borrower — no data returned" };
    }

    // 3. Link CRM contact back to the borrower
    await admin
      .from("crm_contacts")
      .update({ borrower_id: data.id })
      .eq("id", contact.id);

    return { success: true, borrowerId: data.id };
  } catch (err: any) {
    console.error("addBorrowerAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

interface UpdateBorrowerInput extends AddBorrowerInput {
  id: string;
}

export async function updateBorrowerAction(input: UpdateBorrowerInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Update borrower-only fields on the borrowers table
    const { error: borrowerError } = await admin
      .from("borrowers")
      .update({
        date_of_birth: input.date_of_birth || null,
        ssn_last_four: input.ssn_last_four || null,
        is_us_citizen: input.is_us_citizen ?? true,
        credit_score: input.credit_score ?? null,
        credit_report_date: input.credit_report_date || null,
        experience_count: input.experience_count ?? 0,
        notes: input.notes || null,
      })
      .eq("id", input.id);

    if (borrowerError) {
      return { error: borrowerError.message };
    }

    // Update contact fields on the linked CRM contact
    const { data: borrower } = await admin
      .from("borrowers")
      .select("crm_contact_id")
      .eq("id", input.id)
      .single();

    if (borrower?.crm_contact_id) {
      await admin
        .from("crm_contacts")
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email || null,
          phone: input.phone || null,
          address_line1: input.address_line1 || null,
          address_line2: input.address_line2 || null,
          city: input.city || null,
          state: input.state || null,
          zip: input.zip || null,
          country: input.country || "US",
        })
        .eq("id", borrower.crm_contact_id);
    }

    return { success: true };
  } catch (err: any) {
    console.error("updateBorrowerAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Entity CRUD
// ---------------------------------------------------------------------------

interface AddEntityInput {
  borrower_id: string;
  entity_name: string;
  entity_type: string;
  ein?: string;
  state_of_formation?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_foreign_filed?: boolean;
  foreign_filed_states?: string[];
  notes?: string;
}

export async function addEntityAction(input: AddEntityInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("borrower_entities")
      .insert({
        borrower_id: input.borrower_id,
        entity_name: input.entity_name,
        entity_type: input.entity_type,
        ein: input.ein || null,
        state_of_formation: input.state_of_formation || null,
        address_line1: input.address_line1 || null,
        address_line2: input.address_line2 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        is_foreign_filed: input.is_foreign_filed ?? false,
        foreign_filed_states:
          input.is_foreign_filed && input.foreign_filed_states?.length
            ? input.foreign_filed_states
            : null,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, entityId: data.id };
  } catch (err: any) {
    console.error("addEntityAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

interface UpdateEntityInput extends AddEntityInput {
  id: string;
}

export async function updateEntityAction(input: UpdateEntityInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("borrower_entities")
      .update({
        entity_name: input.entity_name,
        entity_type: input.entity_type,
        ein: input.ein || null,
        state_of_formation: input.state_of_formation || null,
        address_line1: input.address_line1 || null,
        address_line2: input.address_line2 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        is_foreign_filed: input.is_foreign_filed ?? false,
        foreign_filed_states:
          input.is_foreign_filed && input.foreign_filed_states?.length
            ? input.foreign_filed_states
            : null,
        notes: input.notes || null,
      })
      .eq("id", input.id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("updateEntityAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function deleteEntityAction(entityId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("borrower_entities")
      .delete()
      .eq("id", entityId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteEntityAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}
