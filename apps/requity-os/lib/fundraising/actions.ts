"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";
import type { CommitmentStatus } from "./types";
import { ensureInvestorRelationship } from "@/lib/crm/ensure-investor-relationship";

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

  // Fetch current commitment to get contact_id for activity logging
  const { data: commitment } = await admin
    .from("soft_commitments" as never)
    .select("contact_id, status, name" as never)
    .eq("id" as never, commitmentId as never)
    .single();

  const { error } = await admin
    .from("soft_commitments" as never)
    .update(updates as never)
    .eq("id" as never, commitmentId as never);

  if (error) return { error: error.message };

  // Log status change on contact timeline
  const contactId = (commitment as { contact_id: string | null } | null)?.contact_id;
  if (contactId) {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    await admin.from("crm_activities").insert({
      contact_id: contactId,
      activity_type: "system",
      subject: `Commitment ${statusLabel.toLowerCase()}`,
      description: `Soft commitment status changed to "${statusLabel}".`,
      performed_by: auth.user.id,
      performed_by_name: "System",
      metadata: { soft_commitment_id: commitmentId },
    } as never);
  }

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

  const contactId = (contact as { id: string } | null)?.id ?? null;

  // Auto-tag matched contact as investor
  if (contactId) {
    await ensureInvestorRelationship(admin, contactId);
  }

  const { data: scData, error } = await admin
    .from("soft_commitments" as never)
    .insert({
      ...data,
      contact_id: contactId,
      source: "manual",
      status: "pending",
      submitted_at: new Date().toISOString(),
    } as never)
    .select("id" as never)
    .single();

  if (error) return { error: error.message };

  // Log activity on the CRM contact timeline
  if (contactId && scData) {
    const amountStr = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(data.commitment_amount);

    await admin.from("crm_activities").insert({
      contact_id: contactId,
      activity_type: "system",
      subject: "Soft commitment placed",
      description: `Placed a ${amountStr} soft commitment (added manually by admin).`,
      performed_by: auth.user.id,
      performed_by_name: "System",
      metadata: { soft_commitment_id: (scData as { id: string }).id },
    } as never);
  }

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
