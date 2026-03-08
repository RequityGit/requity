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

    // Convert File to Buffer for reliable server-side upload
    // (File objects from server action FormData may not be compatible
    // with Supabase storage in all Node.js/serverless environments)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const admin = createAdminClient();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = `deals/${dealId}/${fileName}`;

    const uploadResult = await admin.storage
      .from("loan-documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (!uploadResult) {
      console.error("uploadDealDocumentV2: storage upload returned undefined");
      return { error: "Storage upload failed — no response from storage service" };
    }

    if (uploadResult.error) {
      console.error("uploadDealDocumentV2 storage error:", uploadResult.error);
      return { error: uploadResult.error.message };
    }

    // Generate a signed URL (bucket is private, getPublicUrl won't work)
    const signedUrlResult = await admin.storage
      .from("loan-documents")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    const fileUrl =
      signedUrlResult?.error || !signedUrlResult?.data
        ? storagePath
        : signedUrlResult.data.signedUrl;

    const insertResult = await admin
      .from("unified_deal_documents" as never)
      .insert({
        deal_id: dealId,
        document_name: file.name,
        file_url: fileUrl,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
        uploaded_by: auth.user.id,
        storage_path: storagePath,
        review_status: "pending",
      } as never)
      .select("id" as never)
      .single();

    if (!insertResult || insertResult.error) {
      const dbError = insertResult?.error;
      console.error("uploadDealDocumentV2 db error:", dbError);
      await admin.storage.from("loan-documents").remove([storagePath]);
      return { error: dbError?.message ?? "Failed to save document record" };
    }

    // Fire AI document review (non-blocking)
    const documentId = (insertResult.data as { id: string } | null)?.id;
    if (documentId) {
      triggerDocumentReviewEdgeFunction(documentId, dealId).catch((err) =>
        console.error("Failed to trigger document review:", err)
      );
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

// ─── AI Document Review Actions ───

async function triggerDocumentReviewEdgeFunction(
  documentId: string,
  dealId: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  await fetch(`${supabaseUrl}/functions/v1/review-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ document_id: documentId, deal_id: dealId }),
  });
}

export async function getDocumentReview(documentId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { data: review, error: reviewError } = await admin
      .from("document_reviews" as never)
      .select("*" as never)
      .eq("document_id" as never, documentId as never)
      .single();

    if (reviewError || !review) {
      return { error: reviewError?.message ?? "Review not found" };
    }

    const reviewId = (review as { id: string }).id;

    const { data: items, error: itemsError } = await admin
      .from("document_review_items" as never)
      .select("*" as never)
      .eq("review_id" as never, reviewId as never)
      .order("confidence" as never, { ascending: false });

    if (itemsError) {
      return { error: itemsError.message };
    }

    return { review, items: items ?? [] };
  } catch (err: unknown) {
    console.error("getDocumentReview error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to load review",
    };
  }
}

export async function submitDocumentReview(
  reviewId: string,
  approvedItems: string[],
  rejectedItems: string[],
  noteText: string | null
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { data, error } = await admin.rpc(
      "apply_document_review" as never,
      {
        p_review_id: reviewId,
        p_approved_items: approvedItems,
        p_rejected_items: rejectedItems,
        p_note_text: noteText,
      } as never
    );

    if (error) {
      console.error("submitDocumentReview error:", error);
      return { error: error.message };
    }

    // Get the deal_id from the review to revalidate
    const { data: review } = await admin
      .from("document_reviews" as never)
      .select("deal_id" as never)
      .eq("id" as never, reviewId as never)
      .single();

    if (review) {
      revalidateDeal((review as { deal_id: string }).deal_id);
    }

    return { data: data as Record<string, unknown> };
  } catch (err: unknown) {
    console.error("submitDocumentReview error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to submit review",
    };
  }
}

export async function retriggerDocumentReview(documentId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    // Get document to find deal_id
    const { data: doc, error: docError } = await admin
      .from("unified_deal_documents" as never)
      .select("deal_id" as never)
      .eq("id" as never, documentId as never)
      .single();

    if (docError || !doc) {
      return { error: "Document not found" };
    }

    const dealId = (doc as { deal_id: string }).deal_id;

    // Delete existing review if any
    await admin
      .from("document_reviews" as never)
      .delete()
      .eq("document_id" as never, documentId as never);

    // Reset document review status
    await admin
      .from("unified_deal_documents" as never)
      .update({ review_status: "pending" } as never)
      .eq("id" as never, documentId as never);

    // Trigger edge function
    await triggerDocumentReviewEdgeFunction(documentId, dealId);

    revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("retriggerDocumentReview error:", err);
    return {
      error:
        err instanceof Error ? err.message : "Failed to retrigger review",
    };
  }
}

// ─── Get Signed Download URL ───

export async function getDocumentSignedUrl(
  storagePath: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { url: null, error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("loan-documents")
      .createSignedUrl(storagePath, 60 * 60); // 1 hour

    if (error) {
      console.error("getDocumentSignedUrl error:", error);
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (err: unknown) {
    console.error("getDocumentSignedUrl error:", err);
    return {
      url: null,
      error: err instanceof Error ? err.message : "Failed to generate URL",
    };
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
