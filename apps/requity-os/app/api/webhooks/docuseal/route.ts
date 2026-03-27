import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadAndStoreSignedDocument } from "@/lib/esign/esign-service";
import type { DocuSealWebhookPayload } from "@/lib/esign/esign-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
        .from("esign_signers" as never)
        .update({ status: "opened" } as never)
        .eq("docuseal_submitter_id" as never, payload.data.id as never)
        .in("status" as never, ["pending", "sent"] as never);
      break;
    }

    case "form.completed": {
      // Update the signer record
      await admin
        .from("esign_signers" as never)
        .update({
          status: "signed",
          signed_at: payload.data.completed_at ?? new Date().toISOString(),
        } as never)
        .eq("docuseal_submitter_id" as never, payload.data.id as never);

      // Find the submission
      const submissionId = payload.data.submission_id;
      const { data: submission } = await admin
        .from("esign_submissions" as never)
        .select("id, deal_id, requested_by, document_name" as never)
        .eq("docuseal_submission_id" as never, submissionId as never)
        .single();

      const sub = submission as any;
      if (!sub) break;

      // Check if all signers have signed
      const { data: signers } = await admin
        .from("esign_signers" as never)
        .select("status" as never)
        .eq("submission_id" as never, sub.id as never);

      const allSigned =
        signers != null &&
        signers.length > 0 &&
        (signers as any[]).every((s) => s.status === "signed");

      if (allSigned) {
        await admin
          .from("esign_submissions" as never)
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          } as never)
          .eq("id" as never, sub.id as never);

        // Download and store signed document
        await downloadAndStoreSignedDocument(sub.id as number);

        // Notify the requester
        if (sub.requested_by) {
          await admin.from("notifications").insert({
            user_id: sub.requested_by,
            notification_slug: "esign_completed",
            title: "All signatures collected",
            body: `All signers have signed "${sub.document_name}"`,
            priority: "normal",
            entity_type: sub.deal_id ? "deal" : null,
            entity_id: sub.deal_id ? String(sub.deal_id) : null,
            entity_label: sub.document_name,
            action_url: sub.deal_id
              ? `/pipeline/${sub.deal_id}?tab=documents`
              : null,
          });
        }
      } else {
        await admin
          .from("esign_submissions" as never)
          .update({ status: "partially_signed" } as never)
          .eq("id" as never, sub.id as never);
      }
      break;
    }

    case "form.declined": {
      await admin
        .from("esign_signers" as never)
        .update({ status: "declined" } as never)
        .eq("docuseal_submitter_id" as never, payload.data.id as never);

      const { data: decSub } = await admin
        .from("esign_submissions" as never)
        .select("id, requested_by, document_name, deal_id" as never)
        .eq("docuseal_submission_id" as never, payload.data.submission_id as never)
        .single();

      const ds = decSub as any;
      if (ds) {
        await admin
          .from("esign_submissions" as never)
          .update({ status: "declined" } as never)
          .eq("id" as never, ds.id as never);

        if (ds.requested_by) {
          await admin.from("notifications").insert({
            user_id: ds.requested_by,
            notification_slug: "esign_declined",
            title: "Signature declined",
            body: `${payload.data.email} declined to sign "${ds.document_name}"`,
            priority: "high",
            entity_type: ds.deal_id ? "deal" : null,
            entity_id: ds.deal_id ? String(ds.deal_id) : null,
            entity_label: ds.document_name,
            action_url: ds.deal_id
              ? `/pipeline/${ds.deal_id}?tab=documents`
              : null,
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
