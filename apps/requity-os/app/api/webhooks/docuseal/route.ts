import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadAndStoreSignedDocument } from "@/lib/esign/esign-service";
import type { DocuSealWebhookPayload } from "@/lib/esign/esign-types";

/**
 * POST /api/webhooks/docuseal
 * Handles DocuSeal webhook events for signature lifecycle.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify webhook signature
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-docuseal-signature");
    if (signature) {
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
  }

  let payload: DocuSealWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DocuSealWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (payload.event_type) {
    case "form.started":
    case "form.viewed": {
      await admin
        .from("esign_signers")
        .update({ status: "opened" })
        .eq("docuseal_submitter_id", payload.data.id)
        .in("status", ["pending", "sent"]);
      break;
    }

    case "form.completed": {
      // Update the signer record
      await admin
        .from("esign_signers")
        .update({
          status: "signed",
          signed_at: payload.data.completed_at ?? new Date().toISOString(),
        })
        .eq("docuseal_submitter_id", payload.data.id);

      // Find the submission
      const submissionId = payload.data.submission_id;
      const { data: submission } = await admin
        .from("esign_submissions")
        .select("id, deal_id, requested_by, document_name")
        .eq("docuseal_submission_id", submissionId)
        .single();

      if (!submission) break;

      // Check if all signers have signed
      const { data: signers } = await admin
        .from("esign_signers")
        .select("status")
        .eq("submission_id", submission.id);

      const allSigned =
        signers != null &&
        signers.length > 0 &&
        signers.every((s) => s.status === "signed");

      if (allSigned) {
        await admin
          .from("esign_submissions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", submission.id);

        // Download and store signed document
        await downloadAndStoreSignedDocument(submission.id);

        // Notify the requester
        if (submission.requested_by) {
          await admin.from("notifications").insert({
            user_id: submission.requested_by,
            notification_slug: "esign_completed",
            title: "All signatures collected",
            body: `All signers have signed "${submission.document_name}"`,
            priority: "normal",
            entity_type: submission.deal_id ? "deal" : null,
            entity_id: submission.deal_id ? String(submission.deal_id) : null,
            entity_label: submission.document_name,
            action_url: submission.deal_id
              ? `/pipeline/${submission.deal_id}?tab=documents`
              : null,
          });
        }
      } else {
        await admin
          .from("esign_submissions")
          .update({ status: "partially_signed" })
          .eq("id", submission.id);
      }
      break;
    }

    case "form.declined": {
      await admin
        .from("esign_signers")
        .update({ status: "declined" })
        .eq("docuseal_submitter_id", payload.data.id);

      const { data: decSub } = await admin
        .from("esign_submissions")
        .select("id, requested_by, document_name, deal_id")
        .eq("docuseal_submission_id", payload.data.submission_id)
        .single();

      if (decSub) {
        await admin
          .from("esign_submissions")
          .update({ status: "declined" })
          .eq("id", decSub.id);

        if (decSub.requested_by) {
          await admin.from("notifications").insert({
            user_id: decSub.requested_by,
            notification_slug: "esign_declined",
            title: "Signature declined",
            body: `${payload.data.email} declined to sign "${decSub.document_name}"`,
            priority: "high",
            entity_type: decSub.deal_id ? "deal" : null,
            entity_id: decSub.deal_id ? String(decSub.deal_id) : null,
            entity_label: decSub.document_name,
            action_url: decSub.deal_id
              ? `/pipeline/${decSub.deal_id}?tab=documents`
              : null,
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
