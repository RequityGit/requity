import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/cron/send-notification-batches
 *
 * Processes expired notification batches (settling period timer has elapsed).
 * For each batch whose send_after <= now() and sent_at IS NULL:
 *   - condition_status batches -> send consolidated digest (approvals + revisions)
 *   - submission_confirm batches -> send consolidated "documents received" email
 *
 * Auth: service role key in Authorization header.
 * Designed to be called every 5 minutes by a Supabase Edge Function via pg_cron.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Find all batches whose timer has expired
    const { data: expiredBatches, error: queryError } = await supabase
      .from("notification_batches" as never)
      .select("id, deal_id, batch_type, changes" as never)
      .is("sent_at" as never, null as never)
      .lte("send_after" as never, new Date().toISOString() as never)
      .order("created_at" as never, { ascending: true } as never);

    if (queryError) {
      console.error("[send-notification-batches] Query error:", queryError);
      return NextResponse.json(
        { error: queryError.message },
        { status: 500 }
      );
    }

    const batches = (expiredBatches as unknown as {
      id: string;
      deal_id: string;
      batch_type: string;
      changes: Record<string, unknown>[];
    }[] | null) ?? [];

    if (batches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired batches",
        processed: 0,
      });
    }

    const {
      sendConditionStatusDigest,
      sendSubmissionConfirmDigest,
    } = await import("@/lib/emails/condition-notifications");

    let processed = 0;
    let sent = 0;
    const errors: string[] = [];

    for (const batch of batches) {
      processed++;

      try {
        let result: { sent: boolean; error?: string };

        if (batch.batch_type === "condition_status") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = await sendConditionStatusDigest({
            dealId: batch.deal_id,
            changes: batch.changes as any,
            adminClient: supabase,
          });
        } else if (batch.batch_type === "submission_confirm") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = await sendSubmissionConfirmDigest({
            dealId: batch.deal_id,
            changes: batch.changes as any,
            adminClient: supabase,
          });
        } else {
          console.warn(
            `[send-notification-batches] Unknown batch_type: ${batch.batch_type}`
          );
          result = { sent: false, error: `Unknown batch_type: ${batch.batch_type}` };
        }

        // Mark batch as sent regardless of email outcome (to prevent re-processing)
        await supabase
          .from("notification_batches" as never)
          .update({ sent_at: new Date().toISOString() } as never)
          .eq("id" as never, batch.id as never);

        if (result.sent) {
          sent++;
          console.log(
            `[send-notification-batches] Sent ${batch.batch_type} digest for deal ${batch.deal_id} (${batch.changes.length} changes)`
          );

          // Log activity on the deal so the team sees it in the activity feed
          const activityTitle =
            batch.batch_type === "condition_status"
              ? buildStatusActivityTitle(batch.changes)
              : buildSubmissionActivityTitle(batch.changes);

          await supabase
            .from("unified_deal_activity" as never)
            .insert({
              deal_id: batch.deal_id,
              activity_type: "email_sent",
              title: activityTitle,
              metadata: {
                batch_type: batch.batch_type,
                change_count: batch.changes.length,
                changes: batch.changes,
              },
            } as never)
            .then(({ error: actErr }) => {
              if (actErr) console.error("[send-notification-batches] Activity log failed:", actErr);
            });
        } else {
          console.warn(
            `[send-notification-batches] Could not send ${batch.batch_type} for deal ${batch.deal_id}: ${result.error}`
          );
          if (result.error) errors.push(result.error);
        }
      } catch (batchErr) {
        console.error(
          `[send-notification-batches] Error processing batch ${batch.id}:`,
          batchErr
        );
        // Still mark as sent to prevent infinite retry
        await supabase
          .from("notification_batches" as never)
          .update({ sent_at: new Date().toISOString() } as never)
          .eq("id" as never, batch.id as never);

        errors.push(
          batchErr instanceof Error ? batchErr.message : "Unknown error"
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      sent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[send-notification-batches] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Activity title builders                                            */
/* ------------------------------------------------------------------ */

function buildStatusActivityTitle(
  changes: Record<string, unknown>[]
): string {
  const clearedStatuses = new Set(["approved", "waived", "not_applicable"]);

  // Deduplicate by condition_id, take latest
  const latest = new Map<string, Record<string, unknown>>();
  for (const c of changes) {
    const cid = c.condition_id as string;
    const existing = latest.get(cid);
    if (!existing || (c.changed_at as string) > (existing.changed_at as string)) {
      latest.set(cid, c);
    }
  }

  const deduped = Array.from(latest.values());
  const approved = deduped.filter((c) => clearedStatuses.has(c.new_status as string));
  const revisions = deduped.filter((c) => c.new_status === "rejected");

  const parts: string[] = [];
  if (approved.length > 0) {
    parts.push(`${approved.length} approved`);
  }
  if (revisions.length > 0) {
    parts.push(`${revisions.length} revision${revisions.length === 1 ? "" : "s"} requested`);
  }

  return `Condition update email sent to borrower: ${parts.join(", ")}`;
}

function buildSubmissionActivityTitle(
  changes: Record<string, unknown>[]
): string {
  const totalDocs = changes.reduce(
    (sum, c) => sum + ((c.doc_count as number) || 0),
    0
  );
  const conditionCount = new Set(changes.map((c) => c.condition_id as string)).size;

  return `Submission confirmation email sent to borrower: ${totalDocs} doc${totalDocs === 1 ? "" : "s"} across ${conditionCount} condition${conditionCount === 1 ? "" : "s"}`;
}
