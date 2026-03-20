"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidateDealPaths as revalidateDeal } from "@/lib/pipeline/revalidate-deal";
import type { Json } from "@/lib/supabase/types";
import {
  getBorrowingEntityByDealId,
  upsertBorrowingEntity,
  deleteBorrowingEntity,
  getBorrowerMembersByDealId,
  addBorrowerMember,
  updateBorrowerMember,
  removeBorrowerMember,
  searchContacts,
} from "@/app/services/borrower.server";
import type {
  DealBorrowingEntity,
  DealBorrowerMember,
} from "@/app/types/borrower";

export async function fetchBorrowingEntity(dealId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();
    const data = await getBorrowingEntityByDealId(admin, dealId);
    return { error: null, data };
  } catch (err) {
    console.error("fetchBorrowingEntity error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to load borrowing entity",
      data: null,
    };
  }
}

export async function upsertBorrowingEntityAction(
  dealId: string,
  entity: Partial<DealBorrowingEntity> & { deal_id: string }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();
    const data = await upsertBorrowingEntity(admin, entity);
    // Skip revalidateDeal — the BorrowingEntityCard does optimistic local updates
    // and BorrowerContactsTab silently re-fetches, avoiding full-page flash.
    return { error: null, data };
  } catch (err) {
    console.error("upsertBorrowingEntity error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to save entity",
      data: null,
    };
  }
}

export async function deleteBorrowingEntityAction(entityId: string, dealId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };
    const admin = createAdminClient();
    await deleteBorrowingEntity(admin, entityId);
    // Skip revalidateDeal — tab re-fetches silently after delete.
    return { error: null };
  } catch (err) {
    console.error("deleteBorrowingEntity error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to delete entity",
    };
  }
}

export async function fetchBorrowerMembers(dealId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: [] };
    const admin = createAdminClient();
    const data = await getBorrowerMembersByDealId(admin, dealId);
    return { error: null, data };
  } catch (err) {
    console.error("fetchBorrowerMembers error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to load members",
      data: [] as DealBorrowerMember[],
    };
  }
}

export async function addBorrowerMemberAction(
  borrowingEntityId: string,
  dealId: string,
  contactId: string,
  role?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();
    const data = await addBorrowerMember(admin, {
      borrowing_entity_id: borrowingEntityId,
      deal_id: dealId,
      contact_id: contactId,
      role,
    });
    await revalidateDeal(dealId);
    return { error: null, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add borrower";
    if (msg.includes("Maximum of 5")) return { error: "Maximum of 5 borrowers per deal.", data: null };
    if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("23505"))
      return { error: "This contact is already linked to this deal.", data: null };
    console.error("addBorrowerMember error:", err);
    return { error: msg, data: null };
  }
}

/** Inline member updates skip revalidation to avoid full-page loading flash.
 *  Syncs key borrower metrics (credit_score, liquidity, name) to uw_data for overview tab. */
export async function updateBorrowerMemberAction(
  memberId: string,
  dealId: string,
  updates: Partial<DealBorrowerMember>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();
    const data = await updateBorrowerMember(admin, memberId, updates);

    // Sync key borrower fields to uw_data if they changed
    const syncFields = ["credit_score", "liquidity", "first_name", "last_name", "email", "phone"];
    const needsSync = syncFields.some((f) => f in updates);
    if (needsSync) {
      try {
        // Fetch all members to compute rollup values
        const members = await getBorrowerMembersByDealId(admin, dealId);
        const scores = members.map((m) => m.credit_score ?? 0).filter((s) => s > 0);
        const lowestFico = scores.length > 0 ? Math.min(...scores) : null;
        const combinedLiquidity = members.reduce((sum, m) => sum + Number(m.liquidity ?? 0), 0);

        // Use the first (primary) member for name/email/phone
        const primary = members[0];
        const uwUpdates: Record<string, unknown> = {};
        if (lowestFico !== null) uwUpdates.borrower_credit_score = lowestFico;
        if (combinedLiquidity > 0) uwUpdates.borrower_liquidity = combinedLiquidity;
        if (primary) {
          const name = [primary.first_name, primary.last_name].filter(Boolean).join(" ");
          if (name) uwUpdates.borrower_name = name;
          if (primary.email) uwUpdates.borrower_email = primary.email;
          if (primary.phone) uwUpdates.borrower_phone = primary.phone;
        }

        if (Object.keys(uwUpdates).length > 0) {
          // Merge into existing uw_data
          const { data: deal } = await admin
            .from("unified_deals")
            .select("uw_data")
            .eq("id", dealId)
            .single();
          const existingUw = (deal as { uw_data: Record<string, unknown> } | null)?.uw_data || {};
          await admin
            .from("unified_deals")
            .update({ uw_data: { ...existingUw, ...uwUpdates } as unknown as Json })
            .eq("id", dealId);
        }
      } catch (syncErr) {
        // Non-fatal: overview will still show stale data but member tab is correct
        console.error("Non-fatal: Failed to sync borrower data to uw_data:", syncErr);
      }
    }

    return { error: null, data };
  } catch (err) {
    console.error("updateBorrowerMember error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to update",
      data: null,
    };
  }
}

/** Removing a member skips revalidation to avoid full-page loading flash. */
export async function removeBorrowerMemberAction(memberId: string, dealId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };
    const admin = createAdminClient();
    await removeBorrowerMember(admin, memberId);
    return { error: null };
  } catch (err) {
    console.error("removeBorrowerMember error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to remove",
    };
  }
}

export async function searchContactsForBorrower(
  query: string,
  excludeContactIds: string[] = []
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", contacts: [] };
    const admin = createAdminClient();
    const contacts = await searchContacts(admin, query, excludeContactIds);
    return { error: null, contacts };
  } catch (err) {
    console.error("searchContactsForBorrower error:", err);
    return {
      error: err instanceof Error ? err.message : "Search failed",
      contacts: [],
    };
  }
}

/**
 * Adds a borrower member directly (no CRM contact required).
 * Auto-creates borrowing entity if one doesn't exist for the deal.
 */
export async function addDirectBorrowerMemberAction(
  dealId: string,
  entityId: string | null,
  fields: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    credit_score?: number;
    liquidity?: number;
    net_worth?: number;
    experience?: number;
    role?: string;
  }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();

    // Auto-create borrowing entity if none exists
    let resolvedEntityId = entityId;
    if (!resolvedEntityId) {
      const existing = await getBorrowingEntityByDealId(admin, dealId);
      if (existing) {
        resolvedEntityId = existing.id;
      } else {
        const newEntity = await upsertBorrowingEntity(admin, {
          deal_id: dealId,
          entity_name: "TBD",
          entity_type: "LLC",
        });
        resolvedEntityId = newEntity.id;
      }
    }

    const data = await addBorrowerMember(admin, {
      borrowing_entity_id: resolvedEntityId,
      deal_id: dealId,
      first_name: fields.first_name || null,
      last_name: fields.last_name || null,
      email: fields.email || null,
      phone: fields.phone || null,
      credit_score: fields.credit_score,
      liquidity: fields.liquidity,
      net_worth: fields.net_worth,
      experience: fields.experience,
      role: fields.role,
    });
    return { error: null, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add borrower";
    if (msg.includes("Maximum of 5")) return { error: "Maximum of 5 borrowers per deal.", data: null };
    console.error("addDirectBorrowerMember error:", err);
    return { error: msg, data: null };
  }
}

export type CreateContactPayload = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
};

/** Creates a CRM contact and adds them as a borrower member. Does not revalidate. */
export async function createContactAndAddAsBorrowerAction(
  dealId: string,
  borrowingEntityId: string,
  payload: CreateContactPayload
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };

    const first = (payload.first_name ?? "").trim();
    const last = (payload.last_name ?? "").trim();
    if (!first && !last) {
      return { error: "First name or last name is required.", data: null };
    }

    const admin = createAdminClient();

    const { data: newContact, error: contactError } = await admin
      .from("crm_contacts" as never)
      .insert({
        first_name: first || null,
        last_name: last || null,
        name: `${first} ${last}`.trim(),
        email: (payload.email ?? "").trim() || null,
        phone: (payload.phone ?? "").trim() || null,
        contact_type: "borrower",
        contact_types: ["borrower"],
        status: "active",
      } as never)
      .select("id")
      .single();

    if (contactError) {
      const msg = contactError.message ?? "Failed to create contact";
      if (msg.includes("duplicate") || msg.includes("unique") || String(contactError.code) === "23505") {
        return { error: "A contact with this email already exists.", data: null };
      }
      return { error: msg, data: null };
    }

    const contactId = (newContact as { id: string }).id;
    const member = await addBorrowerMember(admin, {
      borrowing_entity_id: borrowingEntityId,
      deal_id: dealId,
      contact_id: contactId,
    });

    return { error: null, data: { contactId, member } };
  } catch (err) {
    console.error("createContactAndAddAsBorrower error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to create contact and add as borrower",
      data: null,
    };
  }
}
