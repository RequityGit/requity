import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DispositionPayload } from "@/lib/dialer/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: DispositionPayload = await request.json();
    const {
      listContactId,
      contactId,
      disposition,
      notes,
      scheduledCallback,
      listId,
    } = payload;

    if (!listContactId || !contactId || !disposition || !listId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Update the list contact with disposition
    const updateData: Record<string, unknown> = {
      disposition,
      disposition_notes: notes || null,
      status: scheduledCallback ? "callback_scheduled" : "called",
      scheduled_callback: scheduledCallback || null,
    };

    await admin
      .from("dialer_list_contacts")
      .update(updateData)
      .eq("id", listContactId);

    // If DNC, update the CRM contact
    if (disposition === "dnc") {
      await admin
        .from("crm_contacts")
        .update({
          dnc: true,
          dnc_reason: "Requested DNC during call",
        })
        .eq("id", contactId);
    }

    // Update last_contacted_at on CRM contact
    await admin
      .from("crm_contacts")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", contactId);

    // Create CRM activity
    await admin.from("crm_activities").insert({
      contact_id: contactId,
      activity_type: "call",
      direction: "outbound",
      subject: `Power Dialer - ${disposition.replace(/_/g, " ")}`,
      description: notes || `Dialer call dispositioned as: ${disposition}`,
      performed_by: user.id,
      call_disposition: disposition,
    });

    // Increment completed_contacts on the list
    const { data: listData } = await admin
      .from("dialer_lists")
      .select("completed_contacts")
      .eq("id", listId)
      .single();

    if (listData) {
      await admin
        .from("dialer_lists")
        .update({
          completed_contacts: (listData.completed_contacts || 0) + 1,
        })
        .eq("id", listId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Dialer] disposition error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
