// Power Dialer Types
// -----------------------------------------------------------

export type DialerListStatus = "draft" | "active" | "paused" | "completed";

export type DialerListContactStatus =
  | "pending"
  | "calling"
  | "called"
  | "skipped"
  | "no_answer"
  | "busy"
  | "answering_machine"
  | "callback"
  | "dnc_skipped"
  | "failed";

export interface DialerListSettings {
  auto_advance: boolean;
  pause_between_calls: number; // seconds
  max_attempts: number;
  amd_enabled: boolean;
  amd_action: "drop" | "voicemail_drop";
  redial_cooldown_minutes: number;
}

export const DEFAULT_SETTINGS: DialerListSettings = {
  auto_advance: true,
  pause_between_calls: 3,
  max_attempts: 3,
  amd_enabled: true,
  amd_action: "drop",
  redial_cooldown_minutes: 12,
};

// Manual dispositions (user selects)
export const MANUAL_DISPOSITIONS = [
  "Contacted - Not Interested",
  "No Contact",
  "Nurturing",
  "Unqualified",
  "DNC Do Not Call",
] as const;

// System dispositions (auto-assigned)
export const SYSTEM_DISPOSITIONS = [
  "Answering Machine",
  "Busy",
  "No Answer",
  "Failed",
] as const;

export type ManualDisposition = (typeof MANUAL_DISPOSITIONS)[number];
export type SystemDisposition = (typeof SYSTEM_DISPOSITIONS)[number];
export type Disposition = ManualDisposition | SystemDisposition;

export interface DialerList {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  assigned_to: string | null;
  status: DialerListStatus;
  total_contacts: number;
  completed_contacts: number;
  current_position: number;
  settings: DialerListSettings;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_to_name?: string | null;
  created_by_name?: string | null;
}

export interface DialerListContact {
  id: string;
  list_id: string;
  contact_id: string;
  position: number;
  status: DialerListContactStatus;
  attempts: number;
  last_call_id: string | null;
  disposition: string | null;
  disposition_notes: string | null;
  scheduled_callback: string | null;
  last_attempted_at: string | null;
  created_at: string;
  // Joined contact data
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    company_name: string | null;
    source: string | null;
    notes: string | null;
    dnc: boolean | null;
    last_contacted_at: string | null;
    lifecycle_stage: string | null;
    city: string | null;
    state: string | null;
  };
}

export type DialerSessionPhase =
  | "idle"        // Not in a dialing session
  | "loading"     // Loading next contact
  | "pre_call"    // Contact loaded, about to dial
  | "dialing"     // Call initiated, ringing
  | "on_call"     // Connected to a human
  | "disposition" // Call ended, waiting for disposition
  | "advancing"   // Disposition submitted, counting down to next
  | "paused"      // Session paused by user
  | "completed";  // All contacts processed

export interface DialerSessionState {
  phase: DialerSessionPhase;
  listId: string | null;
  list: DialerList | null;
  currentContact: DialerListContact | null;
  sessionStartedAt: string | null;
  callStartedAt: string | null;
  currentCallId: string | null;
  autoDisposition: SystemDisposition | null;
  advanceCountdown: number; // seconds remaining before next call
  stats: SessionStats;
}

export interface SessionStats {
  totalContacts: number;
  completedContacts: number;
  callsMade: number;
  connected: number;
  noAnswer: number;
  answeringMachine: number;
  busy: number;
  skipped: number;
  dncFlagged: number;
  callbacks: number;
  failed: number;
}

export const EMPTY_STATS: SessionStats = {
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
