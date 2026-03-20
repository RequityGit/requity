import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Days before first reminder for a pending condition */
const STALE_DAYS = 3;
/** Days between repeat reminders */
const REMINDER_INTERVAL_DAYS = 3;
/** Max reminders per condition before we stop */
const MAX_REMINDERS = 3;

/**
 * POST /api/cron/stale-condition-reminders
 *
 * Finds borrower-facing conditions that are stale (pending or rejected for too long
 * without borrower action) and sends consolidated reminder emails per deal.
 *
 * Auth: service role key in Authorization header.
 * Designed to be called by a Supabase Edge Function on a CRON schedule.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const now = new Date();
    const staleThreshold = new Date(
      now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const reminderThreshold = new Date(
      now.getTime() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // Find all borrower-facing conditions that need a reminder:
    // - Status is "pending" or "rejected" (needs action from borrower)
    // - is_borrower_facing = true
    // - Deal has an active upload link (borrower has portal access)
    // - Condition created_at (for pending) or feedback_updated_at (for rejected) is older than STALE_DAYS
    // - last_reminder_sent_at is null or older than REMINDER_INTERVAL_DAYS
    // - reminder_count < MAX_REMINDERS
    const { data: staleConditions, error: queryError } = await supabase
      .from("unified_deal_conditions" as never)
      .select(
        "id, deal_id, condition_name, status, is_borrower_facing, created_at, feedback_updated_at, last_reminder_sent_at, reminder_count" as never
      )
      .in("status" as never, ["pending", "rejected"] as never)
      .eq("is_borrower_facing" as never, true as never)
      .lt("reminder_count" as never, MAX_REMINDERS as never);

    if (queryError) {
      console.error("[stale-reminders] Query error:", queryError);
      return NextResponse.json(
        { error: queryError.message },
        { status: 500 }
      );
    }

    const conditions = (staleConditions as unknown as {
      id: string;
      deal_id: string;
      condition_name: string;
      status: string;
      is_borrower_facing: boolean;
      created_at: string;
      feedback_updated_at: string | null;
      last_reminder_sent_at: string | null;
      reminder_count: number;
    }[] | null) ?? [];

    // Filter for truly stale conditions
    const eligible = conditions.filter((c) => {
      // Must be old enough
      const relevantDate =
        c.status === "rejected" && c.feedback_updated_at
          ? c.feedback_updated_at
          : c.created_at;
      if (relevantDate > staleThreshold) return false;

      // Must not have been reminded too recently
      if (c.last_reminder_sent_at && c.last_reminder_sent_at > reminderThreshold) {
        return false;
      }

      return true;
    });

    if (eligible.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale conditions found",
        checked: conditions.length,
        reminded: 0,
      });
    }

    // Group by deal_id
    const byDeal = new Map<string, typeof eligible>();
    for (const c of eligible) {
      const existing = byDeal.get(c.deal_id) ?? [];
      existing.push(c);
      byDeal.set(c.deal_id, existing);
    }

    // Only send to deals that have an active upload link
    const dealIds = Array.from(byDeal.keys());
    const { data: activeLinks } = await supabase
      .from("secure_upload_links" as never)
      .select("deal_id" as never)
      .in("deal_id" as never, dealIds as never)
      .eq("status" as never, "active" as never);

    const dealsWithLinks = new Set(
      ((activeLinks as { deal_id: string }[] | null) ?? []).map((l) => l.deal_id)
    );

    // Send reminders
    const { sendStaleConditionReminderEmail } = await import(
      "@/lib/emails/condition-notifications"
    );

    let totalSent = 0;
    let totalConditions = 0;

    for (const [dealId, dealConditions] of Array.from(byDeal.entries())) {
      if (!dealsWithLinks.has(dealId)) continue;

      const conditionList = dealConditions.map((c) => ({
        name: c.condition_name,
        status: c.status,
      }));

      const result = await sendStaleConditionReminderEmail({
        dealId,
        conditions: conditionList,
        adminClient: supabase,
      });

      if (result.sent) {
        totalSent++;
        totalConditions += dealConditions.length;

        // Update reminder tracking on each condition
        const conditionIds = dealConditions.map((c) => c.id);
        for (const condId of conditionIds) {
          const cond = dealConditions.find((c) => c.id === condId);
          await supabase
            .from("unified_deal_conditions" as never)
            .update({
              last_reminder_sent_at: now.toISOString(),
              reminder_count: (cond?.reminder_count ?? 0) + 1,
            } as never)
            .eq("id" as never, condId as never);
        }
      } else {
        console.error(
          `[stale-reminders] Failed to send for deal ${dealId}:`,
          result.error
        );
      }
    }

    return NextResponse.json({
      success: true,
      dealsReminded: totalSent,
      conditionsIncluded: totalConditions,
      checked: conditions.length,
      eligible: eligible.length,
    });
  } catch (err) {
    console.error("[stale-condition-reminders] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
