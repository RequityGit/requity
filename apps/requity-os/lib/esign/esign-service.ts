import docuseal from "@/lib/docuseal";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SendForSignatureInput,
  EsignSubmission,
} from "./esign-types";

// ---------------------------------------------------------------------------
// Core E-Signature Service
// Bridges document generation with DocuSeal for signing workflows.
//
// Note: esign_* tables are not yet in generated Supabase types (migration pending).
// All table references use `as never` casts until types are regenerated.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create a submission from a pre-registered DocuSeal template.
 */
export async function createFromTemplate(
  input: SendForSignatureInput & { templateId: number }
): Promise<{ submissionId: number; error?: string }> {
  const admin = createAdminClient();

  const { data: template, error: templateErr } = await admin
    .from("esign_templates" as never)
    .select("docuseal_template_id, field_mapping" as never)
    .eq("id" as never, input.templateId as never)
    .single();

  if (templateErr || !template) {
    return { submissionId: 0, error: "Template not found" };
  }

  const t = template as any;

  try {
    const dsSubmission = await docuseal.createSubmission({
      template_id: t.docuseal_template_id,
      send_email: true,
      message: input.message ? { body: input.message } : undefined,
      submitters: input.signers.map((s) => ({
        email: s.email,
        name: s.name,
        role: s.role === "signer" ? "First Party" : s.role,
        values: (t.field_mapping as Record<string, string>) ?? {},
      })),
    });

    const { data: submission, error: subErr } = await admin
      .from("esign_submissions" as never)
      .insert({
        docuseal_submission_id: dsSubmission.id,
        deal_id: input.dealId,
        template_id: input.templateId,
        requested_by: input.signers[0]?.userId ?? null,
        status: "pending",
        document_name: input.documentName,
        expiration_date: input.expirationDays
          ? new Date(Date.now() + input.expirationDays * 86400000).toISOString()
          : null,
        metadata: {},
      } as never)
      .select("id" as never)
      .single();

    if (subErr || !submission) {
      return { submissionId: 0, error: subErr?.message ?? "Could not create submission record" };
    }

    const sub = submission as any;

    const signerRows = dsSubmission.submitters.map(
      (submitter: any, idx: number) => ({
        submission_id: sub.id,
        docuseal_submitter_id: submitter.id,
        contact_id: input.signers[idx]?.contactId ?? null,
        user_id: input.signers[idx]?.userId ?? null,
        name: input.signers[idx]?.name ?? "",
        email: submitter.email,
        role: input.signers[idx]?.role ?? "signer",
        status: "sent",
        sign_order: input.signers[idx]?.signOrder ?? idx + 1,
      })
    );

    await admin.from("esign_signers" as never).insert(signerRows as never);

    return { submissionId: sub.id as number };
  } catch (err) {
    return {
      submissionId: 0,
      error: err instanceof Error ? err.message : "DocuSeal API error",
    };
  }
}

/**
 * Create a submission using a raw DocuSeal template ID (no esign_templates record needed).
 * Used for: ad-hoc builder field placement, and document_templates with linked docuseal_template_id.
 */
export async function createFromDocusealTemplate(
  input: SendForSignatureInput & { docusealTemplateId: number }
): Promise<{ submissionId: number; error?: string }> {
  const admin = createAdminClient();

  try {
    const dsSubmission = await docuseal.createSubmission({
      template_id: input.docusealTemplateId,
      send_email: true,
      message: input.message ? { body: input.message } : undefined,
      submitters: input.signers.map((s) => ({
        email: s.email,
        name: s.name,
        role: s.role === "signer" ? "First Party" : s.role,
      })),
    });

    const { data: submission, error: subErr } = await admin
      .from("esign_submissions" as never)
      .insert({
        docuseal_submission_id: dsSubmission.id,
        deal_id: input.dealId,
        requested_by: input.signers[0]?.userId ?? null,
        status: "pending",
        document_name: input.documentName,
        expiration_date: input.expirationDays
          ? new Date(Date.now() + input.expirationDays * 86400000).toISOString()
          : null,
        metadata: { docuseal_template_id: input.docusealTemplateId },
      } as never)
      .select("id" as never)
      .single();

    if (subErr || !submission) {
      return { submissionId: 0, error: subErr?.message ?? "Could not create submission record" };
    }

    const sub = submission as any;

    const signerRows = dsSubmission.submitters.map(
      (submitter: any, idx: number) => ({
        submission_id: sub.id,
        docuseal_submitter_id: submitter.id,
        contact_id: input.signers[idx]?.contactId ?? null,
        user_id: input.signers[idx]?.userId ?? null,
        name: input.signers[idx]?.name ?? "",
        email: submitter.email,
        role: input.signers[idx]?.role ?? "signer",
        status: "sent",
        sign_order: input.signers[idx]?.signOrder ?? idx + 1,
      })
    );

    await admin.from("esign_signers" as never).insert(signerRows as never);

    return { submissionId: sub.id as number };
  } catch (err) {
    return {
      submissionId: 0,
      error: err instanceof Error ? err.message : "DocuSeal API error",
    };
  }
}

/**
 * Create a submission from a freshly generated PDF.
 * Key integration: takes PDF output from doc generator and sends to DocuSeal.
 */
export async function createFromGenerated(
  input: SendForSignatureInput & { pdfBase64: string }
): Promise<{ submissionId: number; error?: string }> {
  const admin = createAdminClient();

  try {
    const dsSubmission = await docuseal.createSubmissionFromPdf({
      documents: [{ name: input.documentName, file: input.pdfBase64 }],
      send_email: true,
      submitters: input.signers.map((s) => ({
        email: s.email,
        name: s.name,
        role: s.role === "signer" ? "First Party" : s.role,
      })),
    });

    // Response can be array of submitters or an object
    const dsResult = dsSubmission as any;
    const submissionId = Array.isArray(dsResult)
      ? dsResult[0]?.submission_id
      : dsResult.id ?? null;

    const { data: submission, error: subErr } = await admin
      .from("esign_submissions" as never)
      .insert({
        docuseal_submission_id: submissionId,
        deal_id: input.dealId,
        requested_by: null,
        status: "pending",
        document_name: input.documentName,
        expiration_date: input.expirationDays
          ? new Date(Date.now() + input.expirationDays * 86400000).toISOString()
          : null,
        metadata: {},
      } as never)
      .select("id" as never)
      .single();

    if (subErr || !submission) {
      return { submissionId: 0, error: subErr?.message ?? "Could not create submission record" };
    }

    const sub = submission as any;

    const submitters = Array.isArray(dsResult)
      ? dsResult
      : dsResult.submitters ?? [];

    const signerRows = input.signers.map((s, idx) => ({
      submission_id: sub.id,
      docuseal_submitter_id: submitters[idx]?.id ?? null,
      contact_id: s.contactId ?? null,
      user_id: s.userId ?? null,
      name: s.name,
      email: s.email,
      role: s.role,
      status: "sent",
      sign_order: s.signOrder ?? idx + 1,
    }));

    await admin.from("esign_signers" as never).insert(signerRows as never);

    return { submissionId: sub.id as number };
  } catch (err) {
    return {
      submissionId: 0,
      error: err instanceof Error ? err.message : "DocuSeal API error",
    };
  }
}

/**
 * Get an embedded signing URL for a specific signer.
 */
export async function getSigningUrl(
  submissionId: number,
  signerEmail: string
): Promise<{ slug: string | null; error?: string }> {
  const admin = createAdminClient();

  const { data: signer } = await admin
    .from("esign_signers" as never)
    .select("docuseal_submitter_id" as never)
    .eq("submission_id" as never, submissionId as never)
    .eq("email" as never, signerEmail as never)
    .single();

  const s = signer as any;
  if (!s?.docuseal_submitter_id) {
    return { slug: null, error: "Signer not found" };
  }

  try {
    const submitter = await docuseal.getSubmitter(s.docuseal_submitter_id);
    return { slug: (submitter as any).slug ?? null };
  } catch (err) {
    return {
      slug: null,
      error: err instanceof Error ? err.message : "Could not get signing URL",
    };
  }
}

/**
 * Get the full status of a submission including all signers.
 */
export async function getSubmissionStatus(
  submissionId: number
): Promise<{ submission: EsignSubmission | null; error?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("esign_submissions" as never)
    .select("*, signers:esign_signers(*), documents:esign_documents(*)" as never)
    .eq("id" as never, submissionId as never)
    .single();

  if (error) return { submission: null, error: error.message };
  return { submission: data as unknown as EsignSubmission };
}

/**
 * Get all submissions for a deal.
 */
export async function getSubmissionsForDeal(
  dealId: number
): Promise<{ submissions: EsignSubmission[]; error?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("esign_submissions" as never)
    .select("*, signers:esign_signers(*), documents:esign_documents(*)" as never)
    .eq("deal_id" as never, dealId as never)
    .order("created_at" as never, { ascending: false });

  if (error) return { submissions: [], error: error.message };
  return { submissions: (data ?? []) as unknown as EsignSubmission[] };
}

/**
 * Void/cancel an outstanding signature request.
 */
export async function voidSubmission(
  submissionId: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: submission } = await admin
    .from("esign_submissions" as never)
    .select("docuseal_submission_id" as never)
    .eq("id" as never, submissionId as never)
    .single();

  const sub = submission as any;
  if (sub?.docuseal_submission_id) {
    try {
      await docuseal.archiveSubmission(sub.docuseal_submission_id);
    } catch {
      // Continue even if DocuSeal archive fails
    }
  }

  const { error } = await admin
    .from("esign_submissions" as never)
    .update({
      status: "voided",
      voided_at: new Date().toISOString(),
      metadata: reason ? { void_reason: reason } : {},
    } as never)
    .eq("id" as never, submissionId as never);

  if (error) return { success: false, error: error.message };

  await admin
    .from("esign_signers" as never)
    .update({ status: "declined" } as never)
    .eq("submission_id" as never, submissionId as never)
    .in("status" as never, ["pending", "sent", "opened"] as never);

  return { success: true };
}

/**
 * Download signed PDF from DocuSeal and store in Supabase Storage.
 */
export async function downloadAndStoreSignedDocument(
  submissionId: number
): Promise<{ storagePath: string | null; error?: string }> {
  const admin = createAdminClient();

  const { data: submission } = await admin
    .from("esign_submissions" as never)
    .select("docuseal_submission_id, document_name, deal_id" as never)
    .eq("id" as never, submissionId as never)
    .single();

  const sub = submission as any;
  if (!sub?.docuseal_submission_id) {
    return { storagePath: null, error: "Submission not found" };
  }

  try {
    const docs = await docuseal.getSubmissionDocuments(sub.docuseal_submission_id);
    const docList = Array.isArray(docs) ? docs : (docs as any).documents ?? [];

    if (docList.length === 0) {
      return { storagePath: null, error: "No signed documents available" };
    }

    const firstDoc = docList[0] as any;
    if (!firstDoc.url) {
      return { storagePath: null, error: "Document URL not available" };
    }

    const response = await fetch(firstDoc.url);
    if (!response.ok) {
      return { storagePath: null, error: "Could not download signed document" };
    }

    const pdfBuffer = await response.arrayBuffer();
    const fileName = `${String(sub.document_name).replace(/[^a-zA-Z0-9_-]/g, "_")}_signed.pdf`;
    const storagePath = `deals/${sub.deal_id ?? "general"}/${submissionId}/${fileName}`;

    const { error: uploadErr } = await admin.storage
      .from("signed-documents")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      return { storagePath: null, error: uploadErr.message };
    }

    await admin.from("esign_documents" as never).insert({
      submission_id: submissionId,
      docuseal_document_url: firstDoc.url,
      storage_path: storagePath,
      file_name: fileName,
      file_size: pdfBuffer.byteLength,
      content_type: "application/pdf",
      audit_trail: {},
      certificate_url: null,
    } as never);

    return { storagePath };
  } catch (err) {
    return {
      storagePath: null,
      error: err instanceof Error ? err.message : "Could not store signed document",
    };
  }
}
