import { createClient } from "@/lib/supabase/client";
import type {
  DialerList,
  DialerListContact,
  DialerListSettings,
  SessionStats,
  EMPTY_STATS,
} from "./types";

const supabase = () => createClient();

// -----------------------------------------------------------
// Load a dialer list with full data
// -----------------------------------------------------------
export async function loadDialerList(listId: string): Promise<DialerList | null> {
  const { data, error } = await supabase()
    .from("dialer_lists")
    .select("*")
    .eq("id", listId)
    .single();

  if (error || !data) return null;
  return data as unknown as DialerList;
}

// -----------------------------------------------------------
// Get the next contact to call (respecting DNC, cooldown, etc.)
// Returns null when list is exhausted.
// -----------------------------------------------------------
export async function getNextContact(
  listId: string,
  currentPosition: number,
  settings: DialerListSettings
): Promise<DialerListContact | null> {
  // Get contacts from current position onwards that are still pending or callback-eligible
  const { data: contacts, error } = await supabase()
    .from("dialer_list_contacts")
    .select(
      `
      *,
      contact:crm_contacts(
        id, first_name, last_name, phone, email, company_name,
        source, notes, dnc, last_contacted_at, lifecycle_stage,
        city, state
      )
    `
    )
    .eq("list_id", listId)
    .gte("position", currentPosition)
    .in("status", ["pending", "callback", "no_answer", "busy"])
    .order("position", { ascending: true })
    .limit(20); // look ahead batch

  if (error || !contacts || contacts.length === 0) return null;

  for (const lc of contacts) {
    const contact = lc.contact as DialerListContact["contact"];
    if (!contact) continue;

    // DNC check
    if (contact.dnc) {
      await supabase()
        .from("dialer_list_contacts")
        .update({ status: "dnc_skipped" })
        .eq("id", lc.id);
      continue;
    }

    // Valid phone check
    if (!contact.phone || contact.phone.trim().length < 7) {
      await supabase()
        .from("dialer_list_contacts")
        .update({ status: "skipped" })
        .eq("id", lc.id);
      continue;
    }

    // Max attempts check
    if ((lc.attempts ?? 0) >= settings.max_attempts) {
      continue;
    }

    // Redial cooldown check
    if (lc.last_attempted_at) {
      const lastAttempted = new Date(lc.last_attempted_at).getTime();
      const cooldownMs = settings.redial_cooldown_minutes * 60 * 1000;
      if (Date.now() - lastAttempted < cooldownMs) {
        continue; // Skip, keep as pending for later
      }
    }

    // Also check global redial cooldown via dialer_calls
    const cooldownCheck = await supabase()
      .from("dialer_calls")
      .select("called_at")
      .eq("contact_id", contact.id)
      .gte(
        "called_at",
        new Date(
          Date.now() - settings.redial_cooldown_minutes * 60 * 1000
        ).toISOString()
      )
      .limit(1);

    if (cooldownCheck.data && cooldownCheck.data.length > 0) {
      continue; // Recently called, skip
    }

    return lc as unknown as DialerListContact;
  }

  // Check if there are any remaining contacts beyond our batch
  const { count } = await supabase()
    .from("dialer_list_contacts")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId)
    .in("status", ["pending", "callback"]);

  if (count && count > 0) {
    // There are more contacts but they're all in cooldown - return null to signal wait
    return null;
  }

  return null;
}

// -----------------------------------------------------------
// Create a dialer_calls record for a new call attempt
// -----------------------------------------------------------
export async function createDialerCallRecord(params: {
  contactId: string;
  performedBy: string;
  direction?: "inbound" | "outbound";
}): Promise<string | null> {
  const { data, error } = await supabase()
    .from("dialer_calls")
    .insert({
      contact_id: params.contactId,
      performed_by: params.performedBy,
      direction: params.direction || "outbound",
      status: "initiated",
      called_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Dialer] Failed to create call record:", error);
    return null;
  }
  return data.id;
}

// -----------------------------------------------------------
// Update a dialer_calls record with outcome
// -----------------------------------------------------------
export async function updateDialerCallRecord(
  callId: string,
  updates: {
    status?: string;
    duration_seconds?: number;
    notes?: string;
    twilio_call_sid?: string;
    recording_url?: string;
    ended_at?: string;
  }
) {
  const { error } = await supabase()
    .from("dialer_calls")
    .update(updates as Record<string, unknown>)
    .eq("id", callId);

  if (error) {
    console.error("[Dialer] Failed to update call record:", error);
  }
}

// -----------------------------------------------------------
// Submit disposition for the current contact
// -----------------------------------------------------------
export async function submitDisposition(params: {
  listContactId: string;
  listId: string;
  contactId: string;
  callId: string | null;
  disposition: string;
  notes?: string;
  scheduledCallback?: string;
  performedBy: string;
}) {
  const statusMap: Record<string, string> = {
    "Answering Machine": "answering_machine",
    Busy: "busy",
    "No Answer": "no_answer",
    Failed: "failed",
    "DNC Do Not Call": "called",
    "Contacted - Not Interested": "called",
    "No Contact": "called",
    Nurturing: "called",
    Unqualified: "called",
  };

  const contactStatus =
    params.scheduledCallback
      ? "callback"
      : statusMap[params.disposition] ?? "called";

  // 1. Update dialer_list_contacts
  const updatePayload: Record<string, unknown> = {
    disposition: params.disposition,
    disposition_notes: params.notes || null,
    status: contactStatus,
    last_call_id: params.callId,
    last_attempted_at: new Date().toISOString(),
  };
  if (params.scheduledCallback) {
    updatePayload.scheduled_callback = params.scheduledCallback;
  }

  await supabase()
    .from("dialer_list_contacts")
    .update(updatePayload as Record<string, unknown>)
    .eq("id", params.listContactId);

  // 2. Increment attempts
  const { data: currentRow } = await supabase()
    .from("dialer_list_contacts")
    .select("attempts")
    .eq("id", params.listContactId)
    .single();
  if (currentRow) {
    await supabase()
      .from("dialer_list_contacts")
      .update({ attempts: (currentRow.attempts ?? 0) + 1 })
      .eq("id", params.listContactId);
  }

  // 3. Update dialer_calls record with disposition
  if (params.callId) {
    await supabase()
      .from("dialer_calls")
      .update({
        notes: params.disposition + (params.notes ? ` — ${params.notes}` : ""),
        ended_at: new Date().toISOString(),
        status: (contactStatus === "called" ? "completed" : contactStatus) as "completed" | "no_answer" | "busy" | "failed" | "voicemail",
      })
      .eq("id", params.callId);
  }

  // 4. Create CRM activity
  await supabase()
    .from("crm_activities")
    .insert({
      contact_id: params.contactId,
      activity_type: "call",
      subject: `Power Dialer: ${params.disposition}`,
      description: params.notes || null,
      outcome: params.disposition,
      created_by: params.performedBy,
    });

  // 5. Update crm_contacts.last_contacted_at
  await supabase()
    .from("crm_contacts")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", params.contactId);

  // 6. Handle DNC
  if (params.disposition === "DNC Do Not Call") {
    await supabase()
      .from("crm_contacts")
      .update({
        dnc: true,
        dnc_reason: "Requested DNC during call",
      })
      .eq("id", params.contactId);
  }

  // 7. Update list progress
  await supabase()
    .from("dialer_lists")
    .update({
      completed_contacts: await getCompletedCount(params.listId),
    })
    .eq("id", params.listId);
}

// -----------------------------------------------------------
// Get completed count for a list
// -----------------------------------------------------------
async function getCompletedCount(listId: string): Promise<number> {
  const { count } = await supabase()
    .from("dialer_list_contacts")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId)
    .not("status", "in", '("pending","calling","callback")');

  return count ?? 0;
}

// -----------------------------------------------------------
// Update list status
// -----------------------------------------------------------
export async function updateListStatus(
  listId: string,
  status: string,
  extras?: Record<string, unknown>
) {
  const update: Record<string, unknown> = { status, ...extras };
  await supabase().from("dialer_lists").update(update).eq("id", listId);
}

// -----------------------------------------------------------
// Compute session stats from dialer_list_contacts
// -----------------------------------------------------------
export async function computeSessionStats(
  listId: string
): Promise<SessionStats> {
  const { data: contacts } = await supabase()
    .from("dialer_list_contacts")
    .select("status, disposition")
    .eq("list_id", listId);

  if (!contacts) {
    return {
      totalContacts: 0,
      completedContacts: 0,
      callsMade: 0,
      connected: 0,
      noAnswer: 0,
      answeringMachine: 0,
      busy: 0,
      skipped: 0,
      dncFlagged: 0,
      callbacks: 0,
      failed: 0,
    };
  }

  const stats: SessionStats = {
    totalContacts: contacts.length,
    completedContacts: 0,
    callsMade: 0,
    connected: 0,
    noAnswer: 0,
    answeringMachine: 0,
    busy: 0,
    skipped: 0,
    dncFlagged: 0,
    callbacks: 0,
    failed: 0,
  };

  for (const c of contacts) {
    if (c.status !== "pending" && c.status !== "calling") {
      stats.completedContacts++;
    }
    if (
      ["called", "no_answer", "busy", "answering_machine", "failed"].includes(
        c.status
      )
    ) {
      stats.callsMade++;
    }
    switch (c.status) {
      case "called":
        stats.connected++;
        break;
      case "no_answer":
        stats.noAnswer++;
        break;
      case "answering_machine":
        stats.answeringMachine++;
        break;
      case "busy":
        stats.busy++;
        break;
      case "skipped":
        stats.skipped++;
        break;
      case "dnc_skipped":
        stats.dncFlagged++;
        break;
      case "callback":
        stats.callbacks++;
        break;
      case "failed":
        stats.failed++;
        break;
    }
  }

  return stats;
}
