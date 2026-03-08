"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

function revalidateDeal(dealId: string) {
  revalidatePath("/admin/pipeline-v2");
  revalidatePath(`/admin/pipeline-v2/${dealId}`);
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/pipeline/${dealId}`);
}

// ─── Log Quick Action (call, email, approval, closing) ───

export async function logQuickActionV2(
  dealId: string,
  activityType: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const titles: Record<string, string> = {
      call_logged: "Call logged",
      email_sent: "Email logged",
      approval_requested: "Approval requested",
      closing_scheduled: "Closing scheduled",
    };

    const { error } = await admin
      .from("unified_deal_activity" as never)
      .insert({
        deal_id: dealId,
        activity_type: activityType,
        title: titles[activityType] ?? activityType,
        description,
        metadata: metadata ?? {},
        created_by: auth.user.id,
      } as never);

    if (error) {
      console.error("logQuickActionV2 error:", error);
      return { error: error.message };
    }

    revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("logQuickActionV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Assign Team Member ───

export async function assignTeamMemberV2(
  dealId: string,
  profileId: string | null
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deals" as never)
      .update({ assigned_to: profileId } as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("assignTeamMemberV2 error:", error);
      return { error: error.message };
    }

    // Log activity
    await admin.from("unified_deal_activity" as never).insert({
      deal_id: dealId,
      activity_type: "team_updated",
      title: profileId ? "Team member assigned" : "Team member unassigned",
      metadata: { assigned_to: profileId },
      created_by: auth.user.id,
    } as never);

    revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("assignTeamMemberV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Document Actions ───

export async function uploadDealDocumentV2(
  formData: FormData
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const file = formData.get("file") as File;
    const dealId = formData.get("dealId") as string;

    if (!file || !dealId) return { error: "Missing file or dealId" };

    const admin = createAdminClient();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `deals/${dealId}/${fileName}`;

    const { error: uploadError } = await admin.storage
      .from("loan-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("uploadDealDocumentV2 storage error:", uploadError);
      return { error: uploadError.message };
    }

    const { data: urlData } = admin.storage
      .from("loan-documents")
      .getPublicUrl(storagePath);

    const { error: dbError } = await admin
      .from("unified_deal_documents" as never)
      .insert({
        deal_id: dealId,
        document_name: file.name,
        file_url: urlData.publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: auth.user.id,
      } as never);

    if (dbError) {
      console.error("uploadDealDocumentV2 db error:", dbError);
      await admin.storage.from("loan-documents").remove([storagePath]);
      return { error: dbError.message };
    }

    revalidateDeal(dealId);
    return { error: null };
  } catch (err: unknown) {
    console.error("uploadDealDocumentV2 error:", err);
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

export async function deleteDealDocumentV2(
  docId: string
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { data: doc } = await admin
      .from("unified_deal_documents" as never)
      .select("deal_id, file_url" as never)
      .eq("id" as never, docId as never)
      .single();

    const { error } = await admin
      .from("unified_deal_documents" as never)
      .delete()
      .eq("id" as never, docId as never);

    if (error) {
      console.error("deleteDealDocumentV2 error:", error);
      return { error: error.message };
    }

    if (doc) {
      revalidateDeal((doc as { deal_id: string }).deal_id);
    }
    return { error: null };
  } catch (err: unknown) {
    console.error("deleteDealDocumentV2 error:", err);
    return { error: err instanceof Error ? err.message : "Delete failed" };
  }
}

// ─── Update Deal Field (direct fields on unified_deals) ───

export async function updateDealFieldV2(
  dealId: string,
  field: string,
  value: unknown
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deals" as never)
      .update({ [field]: value } as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("updateDealFieldV2 error:", error);
      return { error: error.message };
    }

    revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealFieldV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
