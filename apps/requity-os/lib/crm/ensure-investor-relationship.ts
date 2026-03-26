import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Idempotently ensures a CRM contact has the "investor" relationship tag.
 * Updates both crm_contacts.contact_types array and contact_relationship_types table.
 * Non-throwing: logs errors but never breaks the calling flow.
 */
export async function ensureInvestorRelationship(
  supabase: SupabaseClient,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Add "investor" to contact_types array if not present
    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("contact_types")
      .eq("id", contactId)
      .single();

    if (contact) {
      const currentTypes: string[] = (contact as { contact_types: string[] | null }).contact_types || [];
      if (!currentTypes.includes("investor")) {
        await supabase
          .from("crm_contacts")
          .update({ contact_types: [...currentTypes, "investor"] })
          .eq("id", contactId);
      }
    }

    // 2. Upsert into contact_relationship_types
    const { error: relError } = await supabase
      .from("contact_relationship_types")
      .upsert(
        {
          contact_id: contactId,
          relationship_type: "investor",
          is_active: true,
        },
        {
          onConflict: "contact_id,relationship_type",
          ignoreDuplicates: true,
        }
      );

    if (relError) {
      console.error("Failed to upsert investor relationship:", relError.message);
      return { success: false, error: relError.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("ensureInvestorRelationship failed:", msg);
    return { success: false, error: msg };
  }
}
