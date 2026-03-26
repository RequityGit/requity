"use server";

import { requireAdmin, type AuthResult } from "@/lib/auth/require-admin";
import {
  createFromTemplate,
  createFromGenerated,
  getSubmissionStatus,
  getSubmissionsForDeal,
  voidSubmission,
} from "@/lib/esign/esign-service";
import docuseal from "@/lib/docuseal";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EsignSignerRole,
  EsignSubmission,
} from "@/lib/esign/esign-types";

// ---------------------------------------------------------------------------
// Server actions for e-signature operations on deal detail pages
// ---------------------------------------------------------------------------

interface SignerInput {
  name: string;
  email: string;
  role: EsignSignerRole;
  contactId?: number | null;
  signOrder?: number;
}

/**
 * Send a document for signature using a pre-registered template.
 */
export async function sendForSignature(
  dealId: number,
  documentName: string,
  templateId: number,
  signers: SignerInput[],
  message?: string
): Promise<{ submissionId?: number; error?: string }> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const result = await createFromTemplate({
    dealId,
    documentName,
    signers: signers.map((s) => ({ ...s, userId: auth.user.id })),
    templateId,
    message,
  });

  if (result.error) return { error: result.error };

  // Log activity
  const admin = createAdminClient();
  const signerNames = signers.map((s) => s.name).join(", ");
  await admin.from("deal_activities" as never).insert({
    deal_id: String(dealId),
    activity_type: "system",
    subject: "E-signature request sent",
    description: `Sent "${documentName}" for signature to ${signerNames}`,
    created_by: auth.user.id,
  } as never);

  return { submissionId: result.submissionId };
}

/**
 * Send an already-generated document (PDF) for signature.
 */
export async function sendGeneratedForSignature(
  dealId: number,
  documentName: string,
  pdfBase64: string,
  signers: SignerInput[],
  message?: string
): Promise<{ submissionId?: number; error?: string }> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const result = await createFromGenerated({
    dealId,
    documentName,
    pdfBase64,
    signers: signers.map((s) => ({ ...s, userId: auth.user.id })),
    message,
  });

  if (result.error) return { error: result.error };

  const admin = createAdminClient();
  const signerNames = signers.map((s) => s.name).join(", ");
  await admin.from("deal_activities" as never).insert({
    deal_id: String(dealId),
    activity_type: "system",
    subject: "E-signature request sent",
    description: `Sent "${documentName}" for signature to ${signerNames}`,
    created_by: auth.user.id,
  } as never);

  return { submissionId: result.submissionId };
}

/**
 * Check the status of a signature request.
 */
export async function checkSignatureStatus(
  submissionId: number
): Promise<{ submission?: EsignSubmission; error?: string }> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const result = await getSubmissionStatus(submissionId);
  if (result.error) return { error: result.error };

  return { submission: result.submission ?? undefined };
}

/**
 * Get all e-signature submissions for a deal.
 */
export async function getDealSignatures(
  dealId: number
): Promise<{ submissions?: EsignSubmission[]; error?: string }> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const result = await getSubmissionsForDeal(dealId);
  if (result.error) return { error: result.error };

  return { submissions: result.submissions };
}

/**
 * Void/cancel a signature request.
 */
export async function voidSignatureRequest(
  submissionId: number,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const result = await voidSubmission(submissionId, reason);
  if (result.error) return { error: result.error };

  return { success: true };
}

/**
 * Resend signature request email to a specific signer.
 */
export async function resendSignatureRequest(
  submissionId: number,
  signerEmail: string
): Promise<{ success?: boolean; error?: string }> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();

  const { data: signer } = await admin
    .from("esign_signers")
    .select("docuseal_submitter_id")
    .eq("submission_id", submissionId)
    .eq("email", signerEmail)
    .single();

  if (!signer?.docuseal_submitter_id) {
    return { error: "Signer not found" };
  }

  try {
    await docuseal.updateSubmitter(signer.docuseal_submitter_id, {
      send_email: true,
    });
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not resend",
    };
  }
}

/**
 * Get available esign templates.
 */
export async function getEsignTemplates(): Promise<{
  templates?: { id: number; name: string; document_type: string; business_line: string }[];
  error?: string;
}> {
  const auth: AuthResult = await requireAdmin();
  if ("error" in auth) return { error: auth.error ?? "Unauthorized" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("esign_templates")
    .select("id, name, document_type, business_line")
    .eq("is_active", true)
    .order("name");

  if (error) return { error: error.message };

  return { templates: data ?? [] };
}
