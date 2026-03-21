"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/require-admin";
import { revalidateDealPaths as revalidateDeal } from "@/lib/pipeline/revalidate-deal";
import {
  getDealTeamContacts,
  addDealTeamContact as addDealTeamContactService,
  updateDealTeamContact as updateDealTeamContactService,
  removeDealTeamContact as removeDealTeamContactService,
} from "@/app/services/deal-team.server";
import type { DealTeamContact } from "@/app/types/deal-team";

// ─── Log Rich Activity (dual-write to deal activity + CRM activities) ───

export async function logDealActivityRich(
  dealId: string,
  primaryContactId: string | null,
  activityType: string,
  subject: string,
  description: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    // 1. Insert into unified_deal_activity (deal timeline)
    const { error: dealError } = await admin
      .from("unified_deal_activity" as never)
      .insert({
        deal_id: dealId,
        activity_type: activityType,
        title: subject || activityType.replace(/_/g, " "),
        description: description || null,
        metadata: {},
        created_by: auth.user.id,
      } as never);

    if (dealError) {
      console.error("logDealActivityRich deal insert error:", dealError);
      return { error: dealError.message };
    }

    // 2. If primary contact exists, also insert into crm_activities
    if (primaryContactId) {
      const { error: crmError } = await admin
        .from("crm_activities" as never)
        .insert({
          contact_id: primaryContactId,
          activity_type: activityType,
          subject: subject || null,
          description: description || null,
          linked_entity_type: "loan",
          linked_entity_id: dealId,
          performed_by: auth.user.id,
          created_by: auth.user.id,
        } as never);

      if (crmError) {
        console.error("logDealActivityRich crm insert error:", crmError);
        // Non-fatal: deal activity was already logged
      }

      // 3. Update contact's last_contacted_at
      await admin
        .from("crm_contacts" as never)
        .update({ last_contacted_at: new Date().toISOString() } as never)
        .eq("id" as never, primaryContactId as never);
    }

    // No revalidation -- activity logging doesn't change deal display data
    return { success: true };
  } catch (err: unknown) {
    console.error("logDealActivityRich error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
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

    // No revalidation -- quick actions are activity log entries only
    return { success: true };
  } catch (err: unknown) {
    console.error("logQuickActionV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Link / update Google Sheet for commercial UW (Phase 1: open in Sheets) ───

const GOOGLE_SHEET_ID_REGEX = /\/d\/([a-zA-Z0-9_-]+)/;

function parseGoogleSheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(GOOGLE_SHEET_ID_REGEX);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export async function updateDealGoogleSheetAction(
  dealId: string,
  sheetUrlOrId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const sheetId = parseGoogleSheetId(sheetUrlOrId);
    if (!sheetId) {
      return {
        error:
          "Invalid Google Sheet link. Paste the full URL (e.g. https://docs.google.com/spreadsheets/d/...) or the sheet ID.",
      };
    }

    const canonicalUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deals" as never)
      .update({
        google_sheet_id: sheetId,
        google_sheet_url: canonicalUrl,
      } as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("updateDealGoogleSheet error:", error);
      return { error: error.message };
    }

    // No revalidation -- inline field save, optimistic update handles UI
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealGoogleSheet error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

export async function clearDealGoogleSheetAction(
  dealId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("unified_deals" as never)
      .update({
        google_sheet_id: null,
        google_sheet_url: null,
      } as never)
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("clearDealGoogleSheet error:", error);
      return { error: error.message };
    }

    // No revalidation -- inline field save, optimistic update handles UI
    return { success: true };
  } catch (err: unknown) {
    console.error("clearDealGoogleSheet error:", err);
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

    // No revalidation -- inline assignment uses optimistic update
    return { success: true };
  } catch (err: unknown) {
    console.error("assignTeamMemberV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Add Deal Team Member ───

export async function addDealTeamMember(
  dealId: string,
  profileId: string,
  role: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("deal_team_members" as never)
      .insert({
        deal_id: dealId,
        profile_id: profileId,
        role,
      } as never);

    if (error) {
      if (error.code === "23505") {
        return { error: "This team member is already assigned to the deal" };
      }
      console.error("addDealTeamMember error:", error);
      return { error: error.message };
    }

    // Log activity
    await admin.from("unified_deal_activity" as never).insert({
      deal_id: dealId,
      activity_type: "team_updated",
      title: "Team member added",
      description: `Added with role: ${role}`,
      metadata: { profile_id: profileId, role },
      created_by: auth.user.id,
    } as never);

    await revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("addDealTeamMember error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Remove Deal Team Member ───

export async function removeDealTeamMember(
  dealId: string,
  memberId: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("deal_team_members" as never)
      .delete()
      .eq("id" as never, memberId as never);

    if (error) {
      console.error("removeDealTeamMember error:", error);
      return { error: error.message };
    }

    // Log activity
    await admin.from("unified_deal_activity" as never).insert({
      deal_id: dealId,
      activity_type: "team_updated",
      title: "Team member removed",
      metadata: { removed_member_id: memberId },
      created_by: auth.user.id,
    } as never);

    await revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("removeDealTeamMember error:", err);
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
  visibility?: "internal" | "external";
}): Promise<{ error: string | null; documentId: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", documentId: null };

    const admin = createAdminClient();

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
        visibility: params.visibility || "internal",
      } as never)
      .select("id" as never)
      .single();

    if (!insertResult || insertResult.error) {
      const dbError = insertResult?.error;
      console.error("saveDealDocumentRecord db error:", dbError);
      await admin.storage.from("loan-documents").remove([params.storagePath]);
      return { error: dbError?.message ?? "Failed to save document record", documentId: null };
    }

    const documentId = (insertResult.data as { id: string } | null)?.id ?? null;

    // Fire-and-forget: sync to Google Drive
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey && documentId) {
      fetch(`${supabaseUrl}/functions/v1/sync-document-to-drive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          document_id: documentId,
          deal_id: params.dealId,
          storage_path: params.storagePath,
          file_name: params.documentName,
          mime_type: params.mimeType,
        }),
      }).catch(() => {});
    }

    await revalidateDeal(params.dealId);
    return { error: null, documentId };
  } catch (err: unknown) {
    console.error("saveDealDocumentRecord error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save document record", documentId: null };
  }
}

export async function updateDocumentVisibility(
  docId: string,
  dealId: string,
  visibility: "internal" | "external"
): Promise<{ error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("unified_deal_documents" as never)
      .update({ visibility } as never)
      .eq("id" as never, docId);

    if (error) return { error: error.message };

    await revalidateDeal(dealId);

    // Fire-and-forget: move file in Google Drive into/out of Shared folder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      fetch(`${supabaseUrl}/functions/v1/move-document-drive-folder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ document_id: docId, deal_id: dealId }),
      }).catch(() => {});
    }

    return {};
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to update visibility" };
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
      await revalidateDeal(dealId);
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
      await revalidateDeal((doc as { deal_id: string }).deal_id);
    }
    return { error: null };
  } catch (err: unknown) {
    console.error("deleteDealDocumentV2 error:", err);
    return { error: err instanceof Error ? err.message : "Delete failed" };
  }
}

/** Set human approve/deny for a condition-linked document (used in conditions section). */
export async function updateConditionDocumentApproval(
  documentId: string,
  status: "approved" | "denied"
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();
    const { data: doc, error: fetchError } = await admin
      .from("unified_deal_documents" as never)
      .select("deal_id, condition_id" as never)
      .eq("id" as never, documentId as never)
      .single();

    if (fetchError || !doc) {
      return { error: "Document not found" };
    }
    if (!(doc as { condition_id: string | null }).condition_id) {
      return { error: "Document is not linked to a condition" };
    }

    const { error: updateError } = await admin
      .from("unified_deal_documents" as never)
      .update({ condition_approval_status: status } as never)
      .eq("id" as never, documentId as never);

    if (updateError) {
      console.error("updateConditionDocumentApproval error:", updateError);
      return { error: updateError.message };
    }

    await revalidateDeal((doc as { deal_id: string }).deal_id);
    return { error: null };
  } catch (err: unknown) {
    console.error("updateConditionDocumentApproval error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to update approval",
    };
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

    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
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

    const admin = createAdminClient();

    // Get the deal_id from the review to revalidate
    const { data: review } = await admin
      .from("document_reviews" as never)
      .select("deal_id" as never)
      .eq("id" as never, reviewId as never)
      .single();

    if (review) {
      await revalidateDeal((review as { deal_id: string }).deal_id);
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

    await revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("retriggerDocumentReview error:", err);
    return {
      error:
        err instanceof Error ? err.message : "Failed to retrigger review",
    };
  }
}

// ─── AI Condition Review ───

export interface ConditionCriterionResult {
  criterion: string;
  result: "pass" | "fail" | "unclear";
  detail: string;
}

export interface ConditionReviewData {
  review_id: string;
  criteria_results: ConditionCriterionResult[];
  recommendation: "approve" | "request_revision" | "needs_manual_review";
  recommendation_reasoning: string;
  summary: string;
  flags: string[];
  document_type: string;
  processing_time_ms: number;
  tokens_used: number;
}

/**
 * Trigger an AI condition review for a specific document linked to a condition.
 * Calls the /api/deals/[dealId]/review-condition-document endpoint.
 */
export async function triggerConditionReview(
  documentId: string,
  conditionId: string,
  dealId: string
): Promise<{ data?: ConditionReviewData; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    // Delete any existing condition review for this doc+condition pair
    await admin
      .from("document_reviews" as never)
      .delete()
      .eq("document_id" as never, documentId as never)
      .eq("condition_id" as never, conditionId as never);

    // Reset document review status
    await admin
      .from("unified_deal_documents" as never)
      .update({ review_status: "pending" } as never)
      .eq("id" as never, documentId as never);

    // Call the review API (absolute URL required when fetch runs in Node/server action)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.URL ||
      (typeof process.env.PORT === "string"
        ? `http://localhost:${process.env.PORT}`
        : "http://localhost:3000");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/deals/${dealId}/review-condition-document`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ document_id: documentId, condition_id: conditionId }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "AI review failed" };
    }

    await revalidateDeal(dealId);

    return {
      data: {
        review_id: result.review_id,
        criteria_results: result.criteria_results ?? [],
        recommendation: result.recommendation ?? "needs_manual_review",
        recommendation_reasoning: result.recommendation_reasoning ?? "",
        summary: result.summary ?? "",
        flags: result.flags ?? [],
        document_type: result.document_type ?? "other",
        processing_time_ms: result.processing_time_ms ?? 0,
        tokens_used: result.tokens_used ?? 0,
      },
    };
  } catch (err: unknown) {
    console.error("triggerConditionReview error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to trigger AI review",
    };
  }
}

/**
 * Fetch an existing condition review for a document+condition pair.
 */
export async function getConditionReview(
  documentId: string,
  conditionId: string
): Promise<{ data?: ConditionReviewData; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();

    const { data: review, error: reviewError } = await admin
      .from("document_reviews" as never)
      .select("*" as never)
      .eq("document_id" as never, documentId as never)
      .eq("condition_id" as never, conditionId as never)
      .order("created_at" as never, { ascending: false })
      .limit(1)
      .single();

    if (reviewError || !review) {
      return { error: "No review found" };
    }

    const r = review as {
      id: string;
      status: string;
      raw_extraction: {
        criteria_results?: ConditionCriterionResult[];
        recommendation?: string;
        recommendation_reasoning?: string;
        summary?: string;
        flags?: string[];
        document_type?: string;
      } | null;
      summary: string | null;
      flags: string[] | null;
      document_type: string | null;
      processing_time_ms: number | null;
      tokens_used: number | null;
      error_message: string | null;
    };

    if (r.status === "processing") {
      return { error: "Review is still processing" };
    }

    if (r.status === "error") {
      return { error: r.error_message || "Review failed" };
    }

    const extraction = r.raw_extraction;

    return {
      data: {
        review_id: r.id,
        criteria_results: extraction?.criteria_results ?? [],
        recommendation: (extraction?.recommendation as ConditionReviewData["recommendation"]) ?? "needs_manual_review",
        recommendation_reasoning: extraction?.recommendation_reasoning ?? "",
        summary: extraction?.summary ?? r.summary ?? "",
        flags: extraction?.flags ?? r.flags ?? [],
        document_type: extraction?.document_type ?? r.document_type ?? "other",
        processing_time_ms: r.processing_time_ms ?? 0,
        tokens_used: r.tokens_used ?? 0,
      },
    };
  } catch (err: unknown) {
    console.error("getConditionReview error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to load condition review",
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

    // No revalidation -- inline field saves use optimistic local state updates.
    // Revalidating /pipeline here caused full kanban re-renders on every edit.
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealFieldV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

/** Permanently delete a pipeline deal. Super admin only. */
export async function deleteUnifiedDealSuperAdmin(
  dealId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error ?? "Not authorized" };

    const admin = createAdminClient();

    // All child tables use ON DELETE CASCADE or ON DELETE SET NULL at the DB level.
    // No app-level cleanup needed — just delete the deal row.
    const { error } = await admin
      .from("unified_deals" as never)
      .delete()
      .eq("id" as never, dealId as never);

    if (error) {
      console.error("deleteUnifiedDealSuperAdmin:", error);
      return { error: error.message };
    }

    revalidatePath("/pipeline");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteUnifiedDealSuperAdmin:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to delete deal",
    };
  }
}

// ─── Create Google Drive Folder ───

export async function createDealDriveFolder(
  dealId: string,
  options?: { backfill?: boolean }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return { error: "Server configuration missing" };
    }

    const res = await fetch(
      `${supabaseUrl}/functions/v1/create-deal-drive-folder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          deal_id: dealId,
          ...(options?.backfill ? { backfill: true } : {}),
        }),
      }
    );

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body.error ?? JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => detail);
      }
      return { error: detail };
    }

    await revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Deal Contacts (multi-borrower / signer) ───

export interface DealContact {
  id: string;
  deal_id: string;
  contact_id: string;
  role: "primary" | "co_borrower";
  is_guarantor: boolean;
  sort_order: number;
  created_at: string;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    borrower_id: string | null;
  } | null;
  borrower?: {
    id: string;
    credit_score: number | null;
    experience_count: number | null;
  } | null;
}

export async function searchContactsForDeal(query: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error, contacts: [] };

  if (!query || query.trim().length < 2) return { contacts: [] };

  const admin = createAdminClient();
  const term = `%${query.trim()}%`;

  const { data, error } = await admin
    .from("crm_contacts")
    .select("id, first_name, last_name, email, phone, company_name")
    .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},name.ilike.${term}`)
    .order("last_name" as never, { ascending: true })
    .limit(10);

  if (error) return { error: error.message, contacts: [] };
  return { contacts: data ?? [] };
}

export async function fetchDealContacts(dealId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error, dealContacts: [] };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("deal_contacts")
    .select("*, contact:crm_contacts(id, first_name, last_name, email, phone, borrower_id)")
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true });

  if (error) return { error: error.message, dealContacts: [] };

  const contacts = (data ?? []) as unknown as DealContact[];

  const borrowerIds = contacts
    .map((dc) => dc.contact?.borrower_id)
    .filter((id): id is string => !!id);

  if (borrowerIds.length > 0) {
    const { data: borrowers } = await admin
      .from("borrowers")
      .select("id, credit_score, experience_count, crm_contact_id")
      .in("id", borrowerIds);

    if (borrowers) {
      const borrowerMap = new Map(borrowers.map((b) => [b.id, b]));
      for (const dc of contacts) {
        if (dc.contact?.borrower_id) {
          dc.borrower = borrowerMap.get(dc.contact.borrower_id) ?? null;
        }
      }
    }
  }

  return { dealContacts: contacts };
}

async function syncBorrowerDataOnLink(
  admin: ReturnType<typeof createAdminClient>,
  dealId: string,
  contactId: string
) {
  try {
    // Find borrower record linked to this contact
    const { data: contact } = await admin
      .from("crm_contacts")
      .select("borrower_id")
      .eq("id", contactId)
      .single();

    if (!contact?.borrower_id) return;

    const { data: borrower } = await admin
      .from("borrowers")
      .select("credit_score, experience_count")
      .eq("id", contact.borrower_id)
      .single();

    if (!borrower) return;

    // Get current uw_data to check for empty values
    const { data: deal } = await admin
      .from("unified_deals")
      .select("uw_data")
      .eq("id", dealId)
      .single();

    const uwData = (deal?.uw_data as Record<string, unknown>) ?? {};
    const updates: Record<string, unknown> = {};

    if (borrower.credit_score && !uwData.borrower_fico) {
      updates.borrower_fico = borrower.credit_score;
    }
    if (borrower.experience_count != null && !uwData.borrower_experience) {
      updates.borrower_experience = borrower.experience_count;
    }

    if (Object.keys(updates).length > 0) {
      await admin
        .from("unified_deals")
        .update({
          uw_data: { ...uwData, ...updates },
        } as never)
        .eq("id" as never, dealId as never);
    }
  } catch (err) {
    console.error("syncBorrowerDataOnLink error:", err);
  }
}

export async function addDealContact(
  dealId: string,
  contactId: string,
  role: "primary" | "co_borrower" = "co_borrower",
  isGuarantor = false
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();

  // Enforce max 5 contacts per deal
  const { count } = await admin
    .from("deal_contacts")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);

  if ((count ?? 0) >= 5) {
    return { error: "Maximum of 5 contacts per deal" };
  }

  // If adding as primary, demote existing primary to co_borrower
  if (role === "primary") {
    await admin
      .from("deal_contacts")
      .update({ role: "co_borrower" } as never)
      .eq("deal_id" as never, dealId as never)
      .eq("role" as never, "primary" as never);
  }

  const nextOrder = (count ?? 0) + 1;

  const { error } = await admin.from("deal_contacts").insert({
    deal_id: dealId,
    contact_id: contactId,
    role,
    is_guarantor: isGuarantor,
    sort_order: nextOrder,
  });

  if (error) {
    if (error.code === "23505") return { error: "Contact already linked to this deal" };
    return { error: error.message };
  }

  // Sync primary_contact_id on unified_deals
  if (role === "primary") {
    await admin
      .from("unified_deals")
      .update({ primary_contact_id: contactId } as never)
      .eq("id" as never, dealId as never);
  }

  // If this is the first contact (or primary), auto-populate empty borrower fields
  if (role === "primary" || nextOrder === 1) {
    await syncBorrowerDataOnLink(admin, dealId, contactId);
  }

  // Auto-generate per-borrower conditions for this contact
  try {
    await admin.rpc("generate_borrower_conditions" as never, {
      p_deal_id: dealId,
      p_contact_id: contactId,
    } as never);
  } catch (err) {
    // Non-blocking: log but don't fail the contact add
    console.error("generate_borrower_conditions error:", err);
  }

  await revalidateDeal(dealId);
  return { success: true };
}

export async function removeDealContact(dealId: string, contactId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();

  // Check if the removed contact is primary
  const { data: existing } = await admin
    .from("deal_contacts")
    .select("role")
    .eq("deal_id", dealId)
    .eq("contact_id", contactId)
    .single();

  const wasPrimary = existing?.role === "primary";

  const { error } = await admin
    .from("deal_contacts")
    .delete()
    .eq("deal_id", dealId)
    .eq("contact_id", contactId);

  if (error) return { error: error.message };

  if (wasPrimary) {
    // Promote next contact by sort_order, or clear primary_contact_id
    const { data: remaining } = await admin
      .from("deal_contacts")
      .select("contact_id")
      .eq("deal_id", dealId)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await admin
        .from("deal_contacts")
        .update({ role: "primary" } as never)
        .eq("deal_id" as never, dealId as never)
        .eq("contact_id" as never, remaining[0].contact_id as never);

      await admin
        .from("unified_deals")
        .update({ primary_contact_id: remaining[0].contact_id } as never)
        .eq("id" as never, dealId as never);
    } else {
      await admin
        .from("unified_deals")
        .update({ primary_contact_id: null } as never)
        .eq("id" as never, dealId as never);
    }
  }

  // Re-normalize sort_order
  const { data: allRemaining } = await admin
    .from("deal_contacts")
    .select("id")
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true });

  if (allRemaining) {
    for (let i = 0; i < allRemaining.length; i++) {
      await admin
        .from("deal_contacts")
        .update({ sort_order: i + 1 } as never)
        .eq("id" as never, allRemaining[i].id as never);
    }
  }

  await revalidateDeal(dealId);
  return { success: true };
}

export async function updateDealContact(
  dealId: string,
  contactId: string,
  updates: { role?: "primary" | "co_borrower"; is_guarantor?: boolean }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();

  // If promoting to primary, demote existing primary
  if (updates.role === "primary") {
    await admin
      .from("deal_contacts")
      .update({ role: "co_borrower" } as never)
      .eq("deal_id" as never, dealId as never)
      .eq("role" as never, "primary" as never);
  }

  const { error } = await admin
    .from("deal_contacts")
    .update(updates as never)
    .eq("deal_id" as never, dealId as never)
    .eq("contact_id" as never, contactId as never);

  if (error) return { error: error.message };

  // Sync primary_contact_id
  if (updates.role === "primary") {
    await admin
      .from("unified_deals")
      .update({ primary_contact_id: contactId } as never)
      .eq("id" as never, dealId as never);
  } else if (updates.role === "co_borrower") {
    // Check if there's still a primary
    const { data: primaries } = await admin
      .from("deal_contacts")
      .select("contact_id")
      .eq("deal_id", dealId)
      .eq("role", "primary")
      .limit(1);

    const newPrimaryId = primaries && primaries.length > 0 ? primaries[0].contact_id : null;
    await admin
      .from("unified_deals")
      .update({ primary_contact_id: newPrimaryId } as never)
      .eq("id" as never, dealId as never);
  }

  await revalidateDeal(dealId);
  return { success: true };
}

// ─── Fetch Activity Tab Data (deferred from initial page load) ───

export async function fetchActivityTabData(
  dealId: string,
  primaryContactId: string | null
) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error, dealActivities: [], crmActivities: [], crmEmails: [] };

  const admin = createAdminClient();

  const queries: PromiseLike<unknown>[] = [
    admin
      .from("unified_deal_activity" as never)
      .select("*")
      .eq("deal_id" as never, dealId as never)
      .order("created_at" as never, { ascending: false })
      .limit(200),
  ];

  if (primaryContactId) {
    queries.push(
      admin
        .from("crm_activities" as never)
        .select(
          "id, activity_type, subject, description, outcome, direction, call_duration_seconds, performed_by_name, created_at" as never
        )
        .eq("contact_id" as never, primaryContactId as never)
        .order("created_at" as never, { ascending: false })
        .limit(200),
      admin
        .from("crm_emails" as never)
        .select("*" as never)
        .eq("linked_contact_id" as never, primaryContactId as never)
        .order("created_at" as never, { ascending: false })
        .limit(100)
    );
  }

  const results = await Promise.all(queries);

  type QueryResult = { data: Record<string, unknown>[] | null };

  const dealActivities = ((results[0] as QueryResult).data ?? []) as Record<string, unknown>[];
  const crmActivities = primaryContactId
    ? ((results[1] as QueryResult).data ?? []).map((a: Record<string, unknown>) => ({
        ...a,
        created_by_name: a.performed_by_name,
      }))
    : [];
  const crmEmails = primaryContactId
    ? ((results[2] as QueryResult).data ?? [])
    : [];

  return { dealActivities, crmActivities, crmEmails };
}

// ─── Deal Team Contacts (Overview tab: broker, title, insurance, etc.) ───

export async function fetchDealTeamContacts(dealId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: [] };
    const admin = createAdminClient();
    const data = await getDealTeamContacts(admin, dealId);
    return { error: null, data };
  } catch (err) {
    console.error("fetchDealTeamContacts error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to load deal team",
      data: [] as DealTeamContact[],
    };
  }
}

export async function addDealTeamContactAction(
  dealId: string,
  entry: {
    role: string;
    contact_id?: string | null;
    manual_name?: string;
    manual_company?: string;
    manual_phone?: string;
    manual_email?: string;
    notes?: string;
  }
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();
    const data = await addDealTeamContactService(admin, { deal_id: dealId, ...entry });
    await revalidateDeal(dealId);
    return { error: null, data };
  } catch (err) {
    console.error("addDealTeamContact error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to add deal team contact",
      data: null,
    };
  }
}

export async function updateDealTeamContactAction(
  id: string,
  dealId: string,
  updates: Partial<
    Pick<
      DealTeamContact,
      | "role"
      | "contact_id"
      | "manual_name"
      | "manual_company"
      | "manual_phone"
      | "manual_email"
      | "notes"
      | "sort_order"
    >
  >
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", data: null };
    const admin = createAdminClient();
    const data = await updateDealTeamContactService(admin, id, updates);
    // No revalidation -- inline contact field edit, optimistic update handles UI
    return { error: null, data };
  } catch (err) {
    console.error("updateDealTeamContact error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to update deal team contact",
      data: null,
    };
  }
}

export async function removeDealTeamContactAction(id: string, dealId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };
    const admin = createAdminClient();
    await removeDealTeamContactService(admin, id);
    await revalidateDeal(dealId);
    return { error: null };
  } catch (err) {
    console.error("removeDealTeamContact error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to remove deal team contact",
    };
  }
}

// ─── Secure Upload Links ───

export async function createSecureUploadLink(
  dealId: string,
  opts: {
    mode: "general" | "checklist";
    label?: string;
    instructions?: string;
    expiresInDays: number;
    maxUploads?: number;
    conditionIds?: string[];
    includeGeneralUpload?: boolean;
    contactId?: string;
    /** Client origin (e.g. window.location.origin) so the link matches the host the user is on; avoids 404 when NEXT_PUBLIC_APP_URL is wrong or unset */
    origin?: string;
  }
): Promise<{ error: string | null; url: string | null; linkId: string | null; expiresAt: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", url: null, linkId: null, expiresAt: null };

    const admin = createAdminClient();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + opts.expiresInDays);

    const { data: link, error } = await admin
      .from("secure_upload_links")
      .insert({
        deal_id: dealId,
        created_by: auth.user.id,
        mode: opts.mode,
        label: opts.label || null,
        instructions: opts.instructions || null,
        expires_at: expiresAt.toISOString(),
        max_uploads: opts.maxUploads || null,
        include_general_upload: opts.includeGeneralUpload ?? true,
        contact_id: opts.contactId || null,
      })
      .select("id, token, expires_at")
      .single();

    if (error || !link) {
      console.error("createSecureUploadLink error:", error);
      return { error: error?.message ?? "Failed to create upload link", url: null, linkId: null, expiresAt: null };
    }

    if (opts.mode === "checklist" && opts.conditionIds && opts.conditionIds.length > 0) {
      const rows = opts.conditionIds.map((conditionId, i) => ({
        upload_link_id: link.id,
        condition_id: conditionId,
        sort_order: i,
      }));

      const { error: condError } = await admin
        .from("secure_upload_link_conditions")
        .insert(rows);

      if (condError) {
        console.error("createSecureUploadLink conditions error:", condError);
      }
    }

    // Prefer client origin so the link always matches the host (avoids 404 if env is wrong)
    const base =
      opts.origin && /^https?:\/\//i.test(opts.origin)
        ? opts.origin.replace(/\/$/, "")
        : process.env.NEXT_PUBLIC_APP_URL || "https://app.requitygroup.com";
    const url = `${base}/upload/${link.token}`;
    const expiresAtStr = (link as { expires_at?: string }).expires_at ?? null;

    return { error: null, url, linkId: link.id, expiresAt: expiresAtStr };
  } catch (err) {
    console.error("createSecureUploadLink error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to create upload link",
      url: null,
      linkId: null,
      expiresAt: null,
    };
  }
}

export async function revokeSecureUploadLink(
  linkId: string
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("secure_upload_links")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", linkId);

    if (error) {
      console.error("revokeSecureUploadLink error:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error("revokeSecureUploadLink error:", err);
    return { error: err instanceof Error ? err.message : "Failed to revoke link" };
  }
}

export async function listSecureUploadLinks(
  dealId: string
): Promise<{
  error: string | null;
  links: {
    id: string;
    token: string;
    mode: string;
    label: string | null;
    status: string;
    expires_at: string;
    upload_count: number;
    max_uploads: number | null;
    created_at: string;
  }[];
}> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized", links: [] };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("secure_upload_links")
      .select("id, token, mode, label, status, expires_at, upload_count, max_uploads, created_at")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listSecureUploadLinks error:", error);
      return { error: error.message, links: [] };
    }

    return { error: null, links: data || [] };
  } catch (err) {
    console.error("listSecureUploadLinks error:", err);
    return { error: err instanceof Error ? err.message : "Failed to list links", links: [] };
  }
}

// ─── Request Condition Revision ───

/**
 * Sets a condition to "rejected" status with borrower-facing feedback.
 * This feedback is displayed on the borrower's upload link page so they
 * know exactly what to fix and can re-upload.
 */
export async function requestConditionRevision(
  conditionId: string,
  dealId: string,
  borrowerFeedback: string,
  primaryContactId: string | null
): Promise<{ error: string | null }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

    if (!borrowerFeedback.trim()) {
      return { error: "Feedback is required when requesting a revision" };
    }

    const admin = createAdminClient();

    // Update condition: set status to rejected, add borrower feedback
    const { error: updateErr } = await admin
      .from("unified_deal_conditions" as never)
      .update({
        status: "rejected",
        borrower_feedback: borrowerFeedback.trim(),
        feedback_updated_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.user.id,
      } as never)
      .eq("id" as never, conditionId as never);

    if (updateErr) {
      console.error("requestConditionRevision update error:", updateErr);
      return { error: updateErr.message };
    }

    // Get condition name for activity log
    const { data: condData } = await admin
      .from("unified_deal_conditions" as never)
      .select("condition_name" as never)
      .eq("id" as never, conditionId as never)
      .single();

    const condName = (condData as { condition_name: string } | null)?.condition_name ?? "Condition";

    // Log activity
    await logDealActivityRich(
      dealId,
      primaryContactId,
      "condition_revision_requested",
      `Revision requested: ${condName}`,
      `Borrower feedback: ${borrowerFeedback.trim()}`
    );

    // Queue revision into settling period batch (15-min debounce)
    import("@/lib/emails/condition-notifications").then(({ queueNotificationBatch }) => {
      queueNotificationBatch({
        adminClient: admin,
        dealId,
        batchType: "condition_status",
        change: {
          condition_id: conditionId,
          condition_name: condName,
          new_status: "rejected",
          feedback: borrowerFeedback.trim(),
          changed_at: new Date().toISOString(),
        },
      }).then((result) => {
        if (result.queued) {
          console.log(`[settling-period] Queued revision for condition ${conditionId}`);
        }
      }).catch((err) => {
        console.error("[settling-period] Queue failed:", err);
      });
    }).catch((err) => {
      console.error("[settling-period] Failed to import email module:", err);
    });

    await revalidateDeal(dealId);
    return { error: null };
  } catch (err) {
    console.error("requestConditionRevision error:", err);
    return { error: err instanceof Error ? err.message : "Failed to request revision" };
  }
}
