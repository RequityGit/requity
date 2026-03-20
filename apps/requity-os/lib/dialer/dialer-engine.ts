import { createClient } from "@/lib/supabase/client";
import type {
  DialerListContact,
  DialerListSettings,
  PhoneNumber,
  ContactForDialer,
} from "./types";

const supabase = createClient();

/**
 * Pick the next N eligible contacts from the list starting from current_position.
 * Skips DNC contacts, recently called contacts (cooldown), and contacts without phones.
 */
export async function pickNextContacts(
  listId: string,
  currentPosition: number,
  count: number,
  settings: DialerListSettings
): Promise<ContactForDialer[]> {
  // Fetch pending contacts sorted by position
  const { data: listContacts, error } = await supabase
    .from("dialer_list_contacts")
    .select("*")
    .eq("list_id", listId)
    .in("status", ["pending", "callback_scheduled"])
    .gt("position", currentPosition)
    .order("position", { ascending: true })
    .limit(count * 3); // fetch extra to handle skips

  if (error || !listContacts) return [];

  const eligible: ContactForDialer[] = [];
  const cooldownMs = settings.redial_cooldown_minutes * 60 * 1000;
  const now = Date.now();

  for (const lc of listContacts) {
    if (eligible.length >= count) break;

    const contactRow = lc as unknown as DialerListContact;
    const phones: PhoneNumber[] = (contactRow.phone_numbers as PhoneNumber[]) || [];
    const currentIdx = contactRow.current_number_index || 0;

    // Skip if no phone numbers
    if (phones.length === 0) continue;

    // Skip if current phone index is exhausted
    if (currentIdx >= phones.length) continue;

    // Check cooldown
    if (contactRow.last_attempted_at) {
      const lastAttempt = new Date(contactRow.last_attempted_at).getTime();
      if (now - lastAttempt < cooldownMs) continue;
    }

    // Check DNC at runtime
    const { data: contact } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, phone, email, company_name, source, dnc, last_contacted_at, notes")
      .eq("id", contactRow.contact_id)
      .single();

    if (!contact) continue;

    if (contact.dnc) {
      // Mark as DNC skipped
      await supabase
        .from("dialer_list_contacts")
        .update({ status: "dnc_skipped" })
        .eq("id", contactRow.id);
      continue;
    }

    eligible.push({
      id: contactRow.id,
      contact_id: contactRow.contact_id,
      position: contactRow.position,
      phone_numbers: phones,
      current_number_index: currentIdx,
      status: contactRow.status,
      attempts: contactRow.attempts,
      contact: {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone,
        email: contact.email,
        company_name: contact.company_name,
        source: contact.source,
        dnc: contact.dnc,
        last_contacted_at: contact.last_contacted_at,
        notes: contact.notes,
      },
    });
  }

  return eligible;
}

/**
 * Determine what to do after a call fails (no answer, busy, AMD, failed).
 */
export function getRetryAction(
  listContact: {
    phone_numbers: PhoneNumber[];
    current_number_index: number;
    attempts: number;
  },
  callOutcome: string,
  settings: DialerListSettings
): {
  action: "retry_next_number" | "retry_later" | "mark_complete";
  nextIndex?: number;
  finalDisposition?: string;
} {
  const phones = listContact.phone_numbers || [];
  const currentIdx = listContact.current_number_index || 0;

  const shouldRetryNextNumber =
    callOutcome === "no_answer" ||
    callOutcome === "busy" ||
    callOutcome === "answering_machine" ||
    callOutcome === "failed";

  if (shouldRetryNextNumber && currentIdx + 1 < phones.length) {
    return {
      action: "retry_next_number",
      nextIndex: currentIdx + 1,
    };
  }

  // All numbers exhausted — check if we should retry the whole sequence
  if (
    (callOutcome === "no_answer" || callOutcome === "busy") &&
    listContact.attempts + 1 < settings.max_attempts
  ) {
    return {
      action: "retry_later",
      nextIndex: 0,
    };
  }

  return {
    action: "mark_complete",
    finalDisposition: callOutcome,
  };
}

/**
 * Calculate abandoned call rate for compliance tracking.
 */
export function calculateAbandonedRate(
  abandoned: number,
  totalHumanAnswered: number
): number {
  if (totalHumanAnswered === 0) return 0;
  return abandoned / totalHumanAnswered;
}

/**
 * Format session duration.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Calculate calls per hour.
 */
export function calculateCallsPerHour(
  totalDials: number,
  sessionDurationSeconds: number
): number {
  if (sessionDurationSeconds < 60) return 0;
  return Math.round((totalDials / sessionDurationSeconds) * 3600);
}
