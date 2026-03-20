import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nq } from "@/lib/notifications";

/**
 * Batch-submit staged documents for a condition.
 * Called when borrower clicks "Submit for Review" after uploading files.
 *
 * Body: { token: string; conditionId: string; comment?: string }
 *
 * This endpoint:
 * 1. Validates the upload link token
 * 2. Finalizes all staged docs for the condition (submission_status: "staged" -> "final")
 * 3. Sets condition status to "submitted" (or back to "submitted" if was "rejected")
 * 4. Saves borrower comment on the condition
 * 5. Notifies deal team
 */
export async function POST(request: Request) {
  try {
    const { token, conditionId, comment } = (await request.json()) as {
      token: string;
      conditionId: string;
      comment?: string;
    };

    if (!token || !conditionId) {
      return NextResponse.json(
        { error: "Missing token or conditionId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Validate link
    const { data: link, error: linkError } = await admin
      .from("secure_upload_links")
      .select("id, deal_id, status, expires_at")
      .eq("token", token)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: "Invalid upload link" },
        { status: 403 }
      );
    }

    if (link.status === "revoked") {
      return NextResponse.json(
        { error: "This upload link has been revoked" },
        { status: 403 }
      );
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This upload link has expired" },
        { status: 403 }
      );
    }

    // Finalize all staged docs for this condition
    const { data: stagedDocs, error: stagedError } = await admin
      .from("unified_deal_documents" as never)
      .update({ submission_status: "final" } as never)
      .eq("deal_id" as never, link.deal_id as never)
      .eq("condition_id" as never, conditionId as never)
      .eq("submission_status" as never, "staged" as never)
      .select("id, document_name" as never);

    if (stagedError) {
      console.error("upload-link/submit: failed to finalize docs", stagedError);
      return NextResponse.json(
        { error: "Failed to submit documents" },
        { status: 500 }
      );
    }

    const finalizedDocs = (stagedDocs as { id: string; document_name: string }[] | null) ?? [];

    // Update condition: set to submitted, save borrower comment
    const conditionUpdate: Record<string, unknown> = {
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };
    if (comment?.trim()) {
      conditionUpdate.borrower_comment = comment.trim();
    }

    await admin
      .from("unified_deal_conditions" as never)
      .update(conditionUpdate as never)
      .eq("id" as never, conditionId as never);

    // Get deal + condition info for notifications
    const dealId = link.deal_id as string;
    const { data: deal } = await admin
      .from("unified_deals")
      .select("name")
      .eq("id", dealId)
      .single();
    const dealName = (deal as { name?: string } | null)?.name ?? "Deal";

    const { data: cond } = await admin
      .from("unified_deal_conditions")
      .select("condition_name")
      .eq("id", conditionId)
      .single();
    const conditionName =
      (cond as { condition_name?: string } | null)?.condition_name ?? "Condition";

    // Build notification
    const fileCount = finalizedDocs.length;
    const fileList =
      fileCount === 1
        ? finalizedDocs[0].document_name
        : finalizedDocs.map((d) => d.document_name).join(", ");
    const title = `Documents submitted for ${dealName}: ${conditionName}`;
    const body =
      fileCount === 0
        ? "Borrower submitted for review"
        : `${fileCount} file${fileCount === 1 ? "" : "s"}: ${fileList}${comment?.trim() ? `\nBorrower note: ${comment.trim()}` : ""}`;

    // Notify deal team
    try {
      const { data: teamRows } = await admin
        .from("deal_team_members")
        .select("profile_id")
        .eq("deal_id", dealId);
      const profileIds = Array.from(
        new Set(
          (teamRows ?? [])
            .map((r: { profile_id: string | null }) => r.profile_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      for (const profileId of profileIds) {
        try {
          await nq(admin).notifications().insert({
            user_id: profileId,
            notification_slug: "borrower-document-submitted",
            title,
            body,
            priority: "normal",
            action_url: `/pipeline/${dealId}?tab=Diligence`,
          } as never);
        } catch (notifErr) {
          console.error(
            "upload-link/submit: failed to notify",
            profileId,
            notifErr
          );
        }
      }
    } catch (notifErr) {
      console.error("upload-link/submit: notification setup failed", notifErr);
    }

    // Queue submission confirmation email (15-min debounce so multiple submits consolidate)
    if (finalizedDocs.length > 0) {
      import("@/lib/emails/condition-notifications")
        .then(({ queueNotificationBatch }) =>
          queueNotificationBatch({
            adminClient: admin,
            dealId,
            batchType: "submission_confirm",
            change: {
              condition_id: conditionId,
              condition_name: conditionName,
              doc_count: finalizedDocs.length,
              doc_names: finalizedDocs.map((d) => d.document_name),
              submitted_at: new Date().toISOString(),
            },
          })
        )
        .then((result) => {
          if (result.queued) {
            console.log(`[settling-period] Queued submission confirm for ${conditionName}`);
          }
        })
        .catch((err) => {
          console.error("[settling-period] Queue submission confirm failed:", err);
        });
    }

    // Fire-and-forget: Auto-trigger AI condition review for each finalized doc
    if (finalizedDocs.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "";
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

      if (appUrl && serviceKey) {
        for (const doc of finalizedDocs) {
          fetch(`${appUrl}/api/deals/${dealId}/review-condition-document`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              document_id: doc.id,
              condition_id: conditionId,
            }),
          }).catch((err) => {
            console.error(
              `upload-link/submit: auto AI review failed for doc ${doc.id}:`,
              err
            );
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      submittedCount: finalizedDocs.length,
      conditionName,
    });
  } catch (err) {
    console.error("upload-link/submit error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
