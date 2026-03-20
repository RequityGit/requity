import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/deal-messages/send
 *
 * Send a message in a deal thread.
 * Supports two auth modes:
 *   1. Admin auth (cookie-based) - sender_type: "admin"
 *   2. Token auth (upload link token) - sender_type: "borrower"
 *
 * Body: {
 *   dealId: string;
 *   body: string;
 *   token?: string;          // for borrower auth
 *   contactId?: string;      // borrower's crm_contacts id (resolved from token if not provided)
 * }
 */
export async function POST(request: Request) {
  try {
    const { dealId, body, token, contactId } = (await request.json()) as {
      dealId: string;
      body: string;
      token?: string;
      contactId?: string;
    };

    if (!dealId || !body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing dealId or body" },
        { status: 400 }
      );
    }

    if (body.length > 10000) {
      return NextResponse.json(
        { error: "Message too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Borrower auth (token-based) ──
    if (token) {
      const { data: link, error: linkError } = await admin
        .from("secure_upload_links")
        .select("id, deal_id, status, expires_at, contact_id")
        .eq("token", token)
        .single();

      if (linkError || !link) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
      }

      if (link.status === "revoked" || new Date(link.expires_at) < new Date()) {
        return NextResponse.json({ error: "Token expired or revoked" }, { status: 403 });
      }

      if (link.deal_id !== dealId) {
        return NextResponse.json({ error: "Token does not match deal" }, { status: 403 });
      }

      // Resolve contact: 1) explicit param, 2) link's contact_id, 3) deal primary contact
      let resolvedContactId = contactId;
      if (!resolvedContactId && link.contact_id) {
        resolvedContactId = link.contact_id;
      }
      if (!resolvedContactId) {
        const { data: deal } = await admin
          .from("unified_deals")
          .select("primary_contact_id")
          .eq("id", dealId)
          .single();
        resolvedContactId = deal?.primary_contact_id ?? undefined;
      }

      // Get contact name for activity log
      let contactName = "Borrower";
      if (resolvedContactId) {
        const { data: contact } = await admin
          .from("crm_contacts")
          .select("first_name, last_name")
          .eq("id", resolvedContactId)
          .single();
        if (contact) {
          contactName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
        }
      }

      // Insert message
      const { data: message, error: insertError } = await admin
        .from("deal_messages")
        .insert({
          deal_id: dealId,
          sender_type: "borrower",
          contact_id: resolvedContactId || null,
          source: "portal",
          body: body.trim(),
        })
        .select("id, created_at")
        .single();

      if (insertError) {
        console.error("deal-messages/send insert error:", insertError);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
      }

      // Log activity on the deal
      await admin.from("unified_deal_activity").insert({
        deal_id: dealId,
        activity_type: "message_received",
        title: `Message from ${contactName}`,
        description: body.trim().slice(0, 200),
        metadata: {
          message_id: message?.id,
          sender_type: "borrower",
          contact_id: resolvedContactId,
          source: "portal",
        },
      });

      // ── Notify deal team (in-app, 60s batched) ──
      // Fire-and-forget: don't block the response on notification delivery
      notifyDealTeamOfBorrowerMessage(admin, dealId, contactName).catch((e) =>
        console.error("deal-messages notification error:", e)
      );

      return NextResponse.json({ success: true, message });
    }

    // ── Admin auth (cookie-based) ──
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || !["admin", "super_admin"].includes(roleData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get admin display name
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const senderName = profile?.full_name ?? "Team Member";

    // Insert message
    const { data: message, error: insertError } = await admin
      .from("deal_messages")
      .insert({
        deal_id: dealId,
        sender_type: "admin",
        sender_id: user.id,
        source: "portal",
        body: body.trim(),
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("deal-messages/send insert error:", insertError);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Log activity on the deal
    await admin.from("unified_deal_activity").insert({
      deal_id: dealId,
      activity_type: "message_sent",
      title: `Message from ${senderName}`,
      description: body.trim().slice(0, 200),
      metadata: {
        message_id: message?.id,
        sender_type: "admin",
        sender_id: user.id,
        source: "portal",
      },
      created_by: user.id,
    });

    // TODO: Phase 1E - email notify borrower contacts with notify_email=true

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("deal-messages/send error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  Batched in-app notification for borrower messages (60s debounce)  */
/* ------------------------------------------------------------------ */

const BATCH_WINDOW_SECONDS = 60;

async function notifyDealTeamOfBorrowerMessage(
  admin: ReturnType<typeof createAdminClient>,
  dealId: string,
  contactName: string
) {
  // 1. Get deal name + assigned_to + deal_number for targeted notification
  const { data: deal } = await admin
    .from("unified_deals")
    .select("name, assigned_to, deal_number")
    .eq("id", dealId)
    .single();

  const dealLabel = deal?.name ?? "a deal";
  const dealRoute = deal?.deal_number ?? dealId;

  // 2. Determine recipients: assigned user + all super_admins
  const recipientIds = new Set<string>();

  if (deal?.assigned_to) {
    recipientIds.add(deal.assigned_to);
  }

  const { data: superAdmins } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin");

  for (const sa of superAdmins ?? []) {
    recipientIds.add(sa.user_id);
  }

  if (recipientIds.size === 0) return;

  // 3. For each recipient, check for a recent notification to batch into
  const cutoff = new Date(Date.now() - BATCH_WINDOW_SECONDS * 1000).toISOString();
  const userIds = Array.from(recipientIds);

  for (const userId of userIds) {
    // Look for an existing active notification for this deal within the batch window
    const { data: existing } = await admin
      .from("notifications")
      .select("id, title, body")
      .eq("user_id", userId)
      .eq("notification_slug", "borrower_message_received")
      .eq("entity_type", "deal")
      .eq("entity_id", dealId)
      .is("archived_at", null)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // Batch: update existing notification - extract count from title pattern
      const countMatch = existing.title?.match(/^(\d+) new message/);
      const prevCount = countMatch ? parseInt(countMatch[1], 10) : 1;
      const newCount = prevCount + 1;

      await admin
        .from("notifications")
        .update({
          title: `${newCount} new messages from ${contactName}`,
          body: `${contactName} sent ${newCount} messages on ${dealLabel}`,
          created_at: new Date().toISOString(), // bump timestamp so it re-surfaces
        })
        .eq("id", existing.id);
    } else {
      // New notification - appears immediately in the bell
      await admin.from("notifications").insert({
        user_id: userId,
        notification_slug: "borrower_message_received",
        title: `New message from ${contactName}`,
        body: `${contactName} sent a message on ${dealLabel}`,
        priority: "normal",
        entity_type: "deal",
        entity_id: dealId,
        entity_label: dealLabel,
        action_url: `/pipeline/${dealRoute}?tab=messages`,
      });
    }
  }
}
