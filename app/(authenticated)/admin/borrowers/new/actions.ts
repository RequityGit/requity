"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
// NOTE: Borrower contact fields (first_name, last_name, email, phone, address)
// now live on crm_contacts. This legacy action uses `any` casts until the
// borrower-creation flow is refactored to write to crm_contacts first.

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

    // Legacy fields (first_name, email, address, etc.) no longer exist on
    // borrowers table — they moved to crm_contacts.  Cast to any until refactored.
    const borrowerData: Record<string, unknown> = {
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email || null,
      phone: input.phone || null,
      date_of_birth: input.date_of_birth || null,
      ssn_last_four: input.ssn_last_four || null,
      is_us_citizen: input.is_us_citizen ?? true,
      address_line1: input.address_line1 || null,
      address_line2: input.address_line2 || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      country: input.country || "US",
      credit_score: input.credit_score ?? null,
      credit_report_date: input.credit_report_date || null,
      experience_count: input.experience_count ?? 0,
      notes: input.notes || null,
    };

    const { data, error } = await (admin as any)
      .from("borrowers")
      .insert(borrowerData)
      .select("id")
      .single();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: "Failed to create borrower — no data returned" };
    }

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

    const { error } = await (admin as any)
      .from("borrowers")
      .update({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone || null,
        date_of_birth: input.date_of_birth || null,
        ssn_last_four: input.ssn_last_four || null,
        is_us_citizen: input.is_us_citizen ?? true,
        address_line1: input.address_line1 || null,
        address_line2: input.address_line2 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        country: input.country || "US",
        credit_score: input.credit_score ?? null,
        credit_report_date: input.credit_report_date || null,
        experience_count: input.experience_count ?? 0,
        notes: input.notes || null,
      })
      .eq("id", input.id);

    if (error) {
      return { error: error.message };
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
