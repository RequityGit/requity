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

/**
 * Creates a signed upload URL so the client can upload directly to Supabase
 * storage, bypassing serverless function body-size limits (Netlify ~6 MB).
 */
export async function createDealDocumentUploadUrl(
  dealId: string,
  fileName: string,
  conditionId?: string
): Promise<{
  signedUrl: string | null;
  token: string | null;
  storagePath: string | null;
  error: string | null;
}> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth)
      return { signedUrl: null, token: null, storagePath: null, error: auth.error ?? "Unauthorized" };

    if (!dealId || !fileName)
      return { signedUrl: null, token: null, storagePath: null, error: "Missing dealId or fileName" };

    const admin = createAdminClient();
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = conditionId
      ? `deals/${dealId}/conditions/${conditionId}/${safeName}`
      : `deals/${dealId}/${safeName}`;

    const { data, error } = await admin.storage
      .from("loan-documents")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("createDealDocumentUploadUrl error:", error);
      return {
        signedUrl: null,
        token: null,
        storagePath: null,
        error: error?.message ?? "Failed to create upload URL",
      };
    }

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
      error: null,
    };
  } catch (err: unknown) {
    console.error("createDealDocumentUploadUrl error:", err);
    return {
      signedUrl: null,
      token: null,
      storagePath: null,
      error: err instanceof Error ? err.message : "Failed to create upload URL",
    };
  }
}

/**
 * Saves the document record in the database after the client has uploaded the
 * file directly to Supabase storage via a signed URL.
 */
export async function saveDealDocumentRecord(params: {
  dealId: string;
  storagePath: string;
  documentName: string;
  fileSizeBytes: number;
  mimeType: string;
  conditionId?: string;
}): Promise<{ error: string | null; documentId: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", documentId: null };

    const admin = createAdminClient();

    // Generate a signed URL for the stored file
    const signedUrlResult = await admin.storage
      .from("loan-documents")
      .createSignedUrl(params.storagePath, 60 * 60 * 24 * 365);

    const fileUrl =
      signedUrlResult?.error || !signedUrlResult?.data
        ? params.storagePath
        : signedUrlResult.data.signedUrl;

    const insertResult = await admin
      .from("unified_deal_documents" as never)
      .insert({
        deal_id: params.dealId,
        ...(params.conditionId ? { condition_id: params.conditionId } : {}),
        document_name: params.documentName,
        file_url: fileUrl,
        file_size_bytes: params.fileSizeBytes,
        mime_type: params.mimeType || "application/octet-stream",
        uploaded_by: auth.user.id,
        storage_path: params.storagePath,
        review_status: "pending",
      } as never)
      .select("id" as never)
      .single();

    if (!insertResult || insertResult.error) {
      const dbError = insertResult?.error;
      console.error("saveDealDocumentRecord db error:", dbError);
      // Clean up the uploaded file since DB insert failed
      await admin.storage.from("loan-documents").remove([params.storagePath]);
      return { error: dbError?.message ?? "Failed to save document record", documentId: null };
    }

    const documentId = (insertResult.data as { id: string } | null)?.id ?? null;

    revalidateDeal(params.dealId);
    return { error: null, documentId };
  } catch (err: unknown) {
    console.error("saveDealDocumentRecord error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save document record", documentId: null };
  }
}

/**
 * Trigger AI document analysis for a newly uploaded document.
 * Called from the client after saveDealDocumentRecord succeeds, so it runs
 * in its own server-action request context (avoiding serverless early-termination).
 */
export async function triggerDocumentAnalysis(
  documentId: string,
  dealId: string
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    await triggerDocumentReviewEdgeFunction(documentId, dealId);
    return { error: null };
  } catch (err: unknown) {
    console.error("triggerDocumentAnalysis error:", err);

    // Mark the document as errored so the UI shows "Error" instead of stuck "Queued"
    try {
      const admin = createAdminClient();
      await admin
        .from("unified_deal_documents" as never)
        .update({ review_status: "error" } as never)
        .eq("id" as never, documentId as never);
      revalidateDeal(dealId);
    } catch (updateErr) {
      console.error("Failed to mark document as errored:", updateErr);
    }

    return { error: err instanceof Error ? err.message : "Failed to trigger analysis" };
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  const url = `${supabaseUrl}/functions/v1/review-document`;

  // Use a short timeout — we only need to confirm the edge function accepted
  // the request. It processes independently and handles its own error states.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ document_id: documentId, deal_id: dealId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Document review trigger failed (${res.status}): ${body || res.statusText}`
      );
    }
  } catch (err) {
    clearTimeout(timeoutId);
    // AbortError means we timed out waiting for the response — the request
    // was sent and the edge function is processing independently.
    if (err instanceof Error && err.name === "AbortError") {
      return;
    }
    throw err;
  }
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

// ─── Save Grid Pro Forma Overrides ───

export async function saveGridOverrides(
  dealId: string,
  overrides: Record<string, { value?: number; formula?: string }>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deals" as never)
      .update({ uw_grid_overrides: overrides } as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("saveGridOverrides error:", error);
      return { error: error.message };
    }

    revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("saveGridOverrides error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
