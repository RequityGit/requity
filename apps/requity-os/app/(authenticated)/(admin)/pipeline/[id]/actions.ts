"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
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

    await revalidateDeal(dealId);
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

    await revalidateDeal(dealId);
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

    await revalidateDeal(dealId);
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

    await revalidateDeal(dealId);
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

    await revalidateDeal(dealId);
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

    await revalidateDeal(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealFieldV2 error:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// ─── Create Google Drive Folder ───

export async function createDealDriveFolder(
  dealId: string
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
        body: JSON.stringify({ deal_id: dealId }),
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
    await revalidateDeal(dealId);
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
