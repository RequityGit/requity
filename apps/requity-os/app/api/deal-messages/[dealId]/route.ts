import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/deal-messages/[dealId]?token=xxx&cursor=xxx&limit=50
 *
 * Fetch messages for a deal thread.
 * Supports two auth modes:
 *   1. Admin auth (cookie-based)
 *   2. Token auth (upload link token via query param)
 *
 * Returns messages in ascending order (oldest first) for chat display.
 * Supports cursor-based pagination for loading older messages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const cursor = searchParams.get("cursor"); // ISO timestamp for pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    if (!dealId) {
      return NextResponse.json({ error: "Missing dealId" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── Auth: token or cookie ──
    if (token) {
      // Borrower token auth
      const { data: link, error: linkError } = await admin
        .from("secure_upload_links")
        .select("deal_id, status, expires_at")
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
    } else {
      // Admin cookie auth
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: roleData } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!roleData || !["admin", "super_admin"].includes(roleData.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Fetch messages ──
    // Initial load: get the most recent `limit` messages (order desc, then reverse for oldest-first display).
    // With cursor (load older): get messages older than cursor, order asc.
    let query = admin
      .from("deal_messages")
      .select(
        "id, deal_id, sender_type, sender_id, contact_id, source, body, metadata, created_at"
      )
      .eq("deal_id", dealId);

    if (cursor) {
      query = query
        .lt("created_at", cursor)
        .order("created_at", { ascending: true })
        .limit(limit);
    } else {
      query = query
        .order("created_at", { ascending: false })
        .limit(limit);
    }

    const { data: rawMessages, error } = await query;
    const messages = cursor ? rawMessages : (rawMessages ?? []).slice().reverse();

    if (error) {
      console.error("deal-messages fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // ── Resolve sender names ──
    const senderIds = Array.from(new Set((messages || []).filter((m) => m.sender_id).map((m) => m.sender_id!)));
    const contactIds = Array.from(new Set((messages || []).filter((m) => m.contact_id).map((m) => m.contact_id!)));

    let profileMap: Record<string, string> = {};
    let contactMap: Record<string, string> = {};

    if (senderIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);
      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, p.full_name ?? "Team Member"])
        );
      }
    }

    if (contactIds.length > 0) {
      const { data: contacts } = await admin
        .from("crm_contacts")
        .select("id, first_name, last_name")
        .in("id", contactIds);
      if (contacts) {
        contactMap = Object.fromEntries(
          contacts.map((c) => [
            c.id,
            [c.first_name, c.last_name].filter(Boolean).join(" ") || "Borrower",
          ])
        );
      }
    }

    // Canonical borrower name for this deal: prefer Borrowers/Signers (deal_borrower_members), then primary contact
    let canonicalBorrowerName: string | null = null;
    const { data: firstMember } = await admin
      .from("deal_borrower_members")
      .select("contact_id")
      .eq("deal_id", dealId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (firstMember?.contact_id) {
      const name = contactMap[firstMember.contact_id];
      if (name) canonicalBorrowerName = name;
      else {
        const { data: c } = await admin
          .from("crm_contacts")
          .select("first_name, last_name")
          .eq("id", firstMember.contact_id)
          .single();
        if (c)
          canonicalBorrowerName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Borrower";
      }
    }
    if (!canonicalBorrowerName) {
      const { data: deal } = await admin
        .from("unified_deals")
        .select("primary_contact_id")
        .eq("id", dealId)
        .single();
      if (deal?.primary_contact_id) {
        canonicalBorrowerName = contactMap[deal.primary_contact_id] ?? null;
        if (!canonicalBorrowerName) {
          const { data: c } = await admin
            .from("crm_contacts")
            .select("first_name, last_name")
            .eq("id", deal.primary_contact_id)
            .single();
          if (c)
            canonicalBorrowerName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Borrower";
        }
      }
    }

    // Enrich messages with sender names (borrower: use canonical deal borrower name when set)
    const enriched = (messages || []).map((m) => ({
      ...m,
      sender_name:
        m.sender_type === "admin"
          ? profileMap[m.sender_id ?? ""] ?? "Team Member"
          : m.sender_type === "borrower"
            ? canonicalBorrowerName ?? contactMap[m.contact_id ?? ""] ?? "Borrower"
            : "System",
    }));

    const hasMore = enriched.length === limit;
    const nextCursor = hasMore && enriched.length > 0 ? enriched[0].created_at : null;

    return NextResponse.json({
      messages: enriched,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("deal-messages GET error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
