export type DialerState =
  | "idle"
  | "ready"
  | "dialing"
  | "on_call"
  | "dispositioning"
  | "paused"
  | "completed";

export type DialerListStatus = "draft" | "active" | "paused" | "completed";

export type ListContactStatus =
  | "pending"
  | "called"
  | "dnc_skipped"
  | "skipped"
  | "callback_scheduled";

export type ManualDisposition =
  | "contacted_not_interested"
  | "no_contact"
  | "nurturing"
  | "unqualified"
  | "dnc";

export type SystemDisposition =
  | "answering_machine"
  | "busy"
  | "no_answer"
  | "failed";

export type Disposition = ManualDisposition | SystemDisposition;

export const MANUAL_DISPOSITIONS: { value: ManualDisposition; label: string }[] = [
  { value: "contacted_not_interested", label: "Contacted - Not Interested" },
  { value: "no_contact", label: "No Contact" },
  { value: "nurturing", label: "Nurturing" },
  { value: "unqualified", label: "Unqualified" },
  { value: "dnc", label: "DNC Do Not Call" },
];

export const SYSTEM_DISPOSITIONS: { value: SystemDisposition; label: string }[] = [
  { value: "answering_machine", label: "Answering Machine" },
  { value: "busy", label: "Busy" },
  { value: "no_answer", label: "No Answer" },
  { value: "failed", label: "Failed" },
];

export interface PhoneNumber {
  number: string;
  type: string;
  isPrimary: boolean;
}

export interface DialerListSettings {
  auto_advance: boolean;
  pause_between_calls: number;
  max_attempts: number;
  amd_enabled: boolean;
  amd_action: "drop";
  redial_cooldown_minutes: number;
}

export const DEFAULT_DIALER_SETTINGS: DialerListSettings = {
  auto_advance: true,
  pause_between_calls: 3,
  max_attempts: 3,
  amd_enabled: true,
  amd_action: "drop",
  redial_cooldown_minutes: 12,
};

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
}

export interface DialerListContact {
  id: string;
  list_id: string;
  contact_id: string;
  position: number;
  status: ListContactStatus;
  attempts: number;
  last_call_id: string | null;
  disposition: string | null;
  disposition_notes: string | null;
  scheduled_callback: string | null;
  last_attempted_at: string | null;
  phone_numbers: PhoneNumber[];
  current_number_index: number;
  created_at: string;
}

export interface CallGroupCall {
  contactId: string;
  listContactId: string;
  phone: string;
  callSid: string | null;
  status: "initiating" | "ringing" | "answered" | "completed" | "failed" | "amd_detected" | "no_answer" | "busy";
  amdResult: string | null;
}

export interface DialerCallGroup {
  id: string;
  list_id: string;
  calls: CallGroupCall[];
  connected_contact_id: string | null;
  resolved: boolean;
  created_at: string;
}

export interface DialerSessionProgress {
  total: number;
  processed: number;
  connected: number;
  noAnswer: number;
  answeringMachine: number;
  busy: number;
  skipped: number;
  dncSkipped: number;
  failed: number;
  callbacks: number;
  abandoned: number;
}

export interface DialerSessionState {
  state: DialerState;
  listId: string | null;
  listName: string | null;
  currentGroupId: string | null;
  connectedContactId: string | null;
  connectedContactName: string | null;
  isAlfonsoOnCall: boolean;
  activeCallSid: string | null;
  progress: DialerSessionProgress;
  sessionStartedAt: Date | null;
  totalDials: number;
  settings: DialerListSettings;
}

export const INITIAL_SESSION_STATE: DialerSessionState = {
  state: "idle",
  listId: null,
  listName: null,
  currentGroupId: null,
  connectedContactId: null,
  connectedContactName: null,
  isAlfonsoOnCall: false,
  activeCallSid: null,
  progress: {
    total: 0,
    processed: 0,
    connected: 0,
    noAnswer: 0,
    answeringMachine: 0,
    busy: 0,
    skipped: 0,
    dncSkipped: 0,
    failed: 0,
    callbacks: 0,
    abandoned: 0,
  },
  sessionStartedAt: null,
  totalDials: 0,
  settings: DEFAULT_DIALER_SETTINGS,
};

export interface ContactForDialer {
  id: string;
  contact_id: string;
  position: number;
  phone_numbers: PhoneNumber[];
  current_number_index: number;
  status: string;
  attempts: number;
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    company_name: string | null;
    source: string | null;
    dnc: boolean | null;
    last_contacted_at: string | null;
    notes: string | null;
  };
}

export interface FireGroupPayload {
  contacts: {
    contactId: string;
    listContactId: string;
    phone: string;
  }[];
  listId: string;
  groupId: string;
}

export interface DispositionPayload {
  listContactId: string;
  contactId: string;
  disposition: Disposition;
  notes?: string;
  scheduledCallback?: string;
  callGroupId: string;
  listId: string;
}
