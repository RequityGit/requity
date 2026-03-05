"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";
import type { DialerListSettings } from "@/lib/dialer/types";

// -----------------------------------------------------------
// Create a new dialer list
// -----------------------------------------------------------
export async function createDialerListAction(data: {
  name: string;
  description: string;
  assigned_to: string;
}): Promise<{ id?: string; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data: list, error } = await admin
      .from("dialer_lists")
      .insert({
        name: data.name,
        description: data.description || null,
        assigned_to: data.assigned_to || null,
        created_by: auth.user.id,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) {
      console.error("createDialerListAction error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/dialer");
    return { id: list.id };
  } catch (err: unknown) {
    console.error("createDialerListAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// -----------------------------------------------------------
// Update a dialer list
// -----------------------------------------------------------
export async function updateDialerListAction(
  listId: string,
  data: {
    name?: string;
    description?: string;
    assigned_to?: string;
    settings?: DialerListSettings;
  }
): Promise<{ error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.assigned_to !== undefined) update.assigned_to = data.assigned_to;
    if (data.settings !== undefined) update.settings = data.settings;

    const { error } = await admin
      .from("dialer_lists")
      .update(update)
      .eq("id", listId);

    if (error) {
      console.error("updateDialerListAction error:", error);
      return { error: error.message };
    }

    revalidatePath(`/admin/dialer/${listId}`);
    return {};
  } catch (err: unknown) {
    console.error("updateDialerListAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// -----------------------------------------------------------
// Add contacts to a dialer list
// -----------------------------------------------------------
export async function addContactsToListAction(
  listId: string,
  contactIds: string[]
): Promise<{ error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get current max position
    const { data: maxRow } = await admin
      .from("dialer_list_contacts")
      .select("position")
      .eq("list_id", listId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextPosition = (maxRow?.position ?? -1) + 1;

    // Insert contacts
    const rows = contactIds.map((contactId) => ({
      list_id: listId,
      contact_id: contactId,
      position: nextPosition++,
      status: "pending" as const,
    }));

    const { error: insertError } = await admin
      .from("dialer_list_contacts")
      .insert(rows);

    if (insertError) {
      console.error("addContactsToListAction insert error:", insertError);
      return { error: insertError.message };
    }

    // Update total_contacts count
    const { count } = await admin
      .from("dialer_list_contacts")
      .select("id", { count: "exact", head: true })
      .eq("list_id", listId);

    await admin
      .from("dialer_lists")
      .update({ total_contacts: count ?? 0 })
      .eq("id", listId);

    revalidatePath(`/admin/dialer/${listId}`);
    return {};
  } catch (err: unknown) {
    console.error("addContactsToListAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// -----------------------------------------------------------
// Remove a contact from a dialer list
// -----------------------------------------------------------
export async function removeContactFromListAction(
  listContactId: string,
  listId: string
): Promise<{ error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("dialer_list_contacts")
      .delete()
      .eq("id", listContactId);

    if (error) {
      console.error("removeContactFromListAction error:", error);
      return { error: error.message };
    }

    // Update total_contacts count
    const { count } = await admin
      .from("dialer_list_contacts")
      .select("id", { count: "exact", head: true })
      .eq("list_id", listId);

    await admin
      .from("dialer_lists")
      .update({ total_contacts: count ?? 0 })
      .eq("id", listId);

    revalidatePath(`/admin/dialer/${listId}`);
    return {};
  } catch (err: unknown) {
    console.error("removeContactFromListAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// -----------------------------------------------------------
// Delete a dialer list
// -----------------------------------------------------------
export async function deleteDialerListAction(
  listId: string
): Promise<{ error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Delete list contacts first (cascade should handle this, but be explicit)
    await admin.from("dialer_list_contacts").delete().eq("list_id", listId);

    const { error } = await admin.from("dialer_lists").delete().eq("id", listId);

    if (error) {
      console.error("deleteDialerListAction error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/dialer");
    return {};
  } catch (err: unknown) {
    console.error("deleteDialerListAction error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
