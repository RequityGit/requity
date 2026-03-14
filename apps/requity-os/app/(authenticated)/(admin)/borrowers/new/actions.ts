"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Borrower CRUD
// Contact fields (first_name, email, address, etc.) live on crm_contacts.
// Borrower-specific fields (credit, experience, etc.) live on borrowers.
// Creating a borrower = create crm_contact + create borrower linked via crm_contact_id.
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

    // Step 1: Create a CRM contact for the borrower
    const { data: contact, error: contactError } = await admin
      .from("crm_contacts")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        name: `${input.first_name} ${input.last_name}`.trim(),
        email: input.email || null,
        phone: input.phone || null,
        contact_type: "borrower",
        contact_types: ["borrower"],
        address_line1: input.address_line1 || null,
        address_line2: input.address_line2 || null,
        city: input.city || null,
        state: input.state || null,
        zip: input.zip || null,
        country: input.country || "US",
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (contactError) {
      console.error("addBorrowerAction: failed to create crm_contact", contactError);
      return { error: `Failed to create contact: ${contactError.message}` };
    }

    // Step 2: Create the borrower record linked to the CRM contact
    const { data: borrower, error: borrowerError } = await admin
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

    if (borrowerError) {
      console.error("addBorrowerAction: failed to create borrower", borrowerError);
      // Clean up the orphaned contact
      await admin.from("crm_contacts").delete().eq("id", contact.id);
      return { error: `Failed to create borrower: ${borrowerError.message}` };
    }

    // Step 3: Link the contact back to the borrower
    const { error: linkError } = await admin
      .from("crm_contacts")
      .update({ borrower_id: borrower.id })
      .eq("id", contact.id);

    if (linkError) {
      console.error("addBorrowerAction: failed to link contact to borrower", linkError);
    }

    revalidatePath("/contacts");

    return { success: true, borrowerId: borrower.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("addBorrowerAction error:", err);
    return { error: message };
  }
}

interface UpdateBorrowerInput extends AddBorrowerInput {
  id: string;
  crm_contact_id?: string;
}

export async function updateBorrowerAction(input: UpdateBorrowerInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Update borrower-specific fields
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

    // Update contact fields if we have a crm_contact_id
    let contactId = input.crm_contact_id;
    if (!contactId) {
      // Look up the linked contact
      const { data: borrowerRow } = await admin
        .from("borrowers")
        .select("crm_contact_id")
        .eq("id", input.id)
        .single();
      contactId = borrowerRow?.crm_contact_id ?? undefined;
    }

    if (contactId) {
      const { error: contactError } = await admin
        .from("crm_contacts")
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          name: `${input.first_name} ${input.last_name}`.trim(),
          email: input.email || null,
          phone: input.phone || null,
          address_line1: input.address_line1 || null,
          address_line2: input.address_line2 || null,
          city: input.city || null,
          state: input.state || null,
          zip: input.zip || null,
          country: input.country || "US",
        })
        .eq("id", contactId);

      if (contactError) {
        console.error("updateBorrowerAction: failed to update crm_contact", contactError);
        return { error: `Failed to update contact info: ${contactError.message}` };
      }
    }

    revalidatePath(`/borrowers/${input.id}`);
    revalidatePath("/contacts");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("updateBorrowerAction error:", err);
    return { error: message };
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

    revalidatePath(`/borrowers/${input.borrower_id}`);

    return { success: true, entityId: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("addEntityAction error:", err);
    return { error: message };
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

    revalidatePath(`/borrowers/${input.borrower_id}`);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("updateEntityAction error:", err);
    return { error: message };
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

    revalidatePath("/contacts");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("deleteEntityAction error:", err);
    return { error: message };
  }
}
