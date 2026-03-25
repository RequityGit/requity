"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";
import type { CommitmentStatus } from "./types";

export async function updateCommitmentStatus(
  commitmentId: string,
  status: CommitmentStatus
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = { status, updated_at: now };
  if (status === "confirmed") updates.confirmed_at = now;
  if (status === "subscribed") updates.subscribed_at = now;

  const { error } = await admin
    .from("soft_commitments" as never)
    .update(updates as never)
    .eq("id" as never, commitmentId as never);

  if (error) return { error: error.message };

  revalidatePath("/funds/soft-commitments");
  return { success: true };
}

export async function updateCommitmentNotes(
  commitmentId: string,
  notes: string
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("soft_commitments" as never)
    .update({ notes, updated_at: new Date().toISOString() } as never)
    .eq("id" as never, commitmentId as never);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addManualCommitment(data: {
  deal_id: string;
  name: string;
  email: string;
  phone?: string;
  commitment_amount: number;
  is_accredited?: boolean;
  notes?: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();

  // Try to match to an existing CRM contact by email
  const { data: contact } = await admin
    .from("crm_contacts" as never)
    .select("id" as never)
    .eq("email" as never, data.email as never)
    .maybeSingle();

  const { error } = await admin
    .from("soft_commitments" as never)
    .insert({
      ...data,
      contact_id: (contact as { id: string } | null)?.id ?? null,
      source: "manual",
      status: "pending",
      submitted_at: new Date().toISOString(),
    } as never);

  if (error) return { error: error.message };

  revalidatePath("/funds/soft-commitments");
  return { success: true };
}

export async function bulkUpdateCommitmentStatus(
  commitmentIds: string[],
  status: CommitmentStatus
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  if (commitmentIds.length === 0) return { error: "No commitments selected" };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = { status, updated_at: now };
  if (status === "confirmed") updates.confirmed_at = now;
  if (status === "subscribed") updates.subscribed_at = now;

  const { error } = await admin
    .from("soft_commitments" as never)
    .update(updates as never)
    .in("id" as never, commitmentIds as never);

  if (error) return { error: error.message };

  revalidatePath("/funds/soft-commitments");
  return { success: true };
}

export async function updateFundraiseSettings(
  dealId: string,
  settings: {
    fundraise_slug?: string;
    fundraise_enabled?: boolean;
    fundraise_target?: number | null;
    fundraise_hard_cap?: number | null;
    fundraise_description?: string | null;
    fundraise_amount_options?: number[];
    fundraise_hero_image_url?: string | null;
    fundraise_deck_url?: string | null;
  }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("unified_deals" as never)
    .update({ ...settings, updated_at: new Date().toISOString() } as never)
    .eq("id" as never, dealId as never);

  if (error) return { error: error.message };

  revalidatePath(`/pipeline/${dealId}`);
  return { success: true };
}
