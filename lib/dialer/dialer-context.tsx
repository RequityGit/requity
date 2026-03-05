"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  loadDialerList,
  getNextContact,
  createDialerCallRecord,
  updateDialerCallRecord,
  submitDisposition,
  updateListStatus,
  computeSessionStats,
} from "./dialer-engine";
import { useSoftphoneMaybe } from "@/lib/twilio/softphone-context";
import type {
  DialerSessionState,
  DialerSessionPhase,
  DialerList,
  DialerListContact,
  SessionStats,
  Disposition,
  DialerListSettings,
} from "./types";
import { EMPTY_STATS, DEFAULT_SETTINGS } from "./types";
import { createClient } from "@/lib/supabase/client";

// -----------------------------------------------------------
// State + Actions
// -----------------------------------------------------------

type Action =
  | { type: "SET_PHASE"; phase: DialerSessionPhase }
  | { type: "SET_LIST"; list: DialerList }
  | { type: "SET_CURRENT_CONTACT"; contact: DialerListContact | null }
  | { type: "SET_CALL_ID"; callId: string | null }
  | { type: "SET_AUTO_DISPOSITION"; disposition: string | null }
  | { type: "SET_ADVANCE_COUNTDOWN"; seconds: number }
  | { type: "SET_STATS"; stats: SessionStats }
  | { type: "START_SESSION"; listId: string; list: DialerList }
  | { type: "RESET" };

const initialState: DialerSessionState = {
  phase: "idle",
  listId: null,
  list: null,
  currentContact: null,
  sessionStartedAt: null,
  callStartedAt: null,
  currentCallId: null,
  autoDisposition: null,
  advanceCountdown: 0,
  stats: EMPTY_STATS,
};

function reducer(state: DialerSessionState, action: Action): DialerSessionState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SET_LIST":
      return { ...state, list: action.list };
    case "SET_CURRENT_CONTACT":
      return { ...state, currentContact: action.contact };
    case "SET_CALL_ID":
      return { ...state, currentCallId: action.callId };
    case "SET_AUTO_DISPOSITION":
      return { ...state, autoDisposition: action.disposition as DialerSessionState["autoDisposition"] };
    case "SET_ADVANCE_COUNTDOWN":
      return { ...state, advanceCountdown: action.seconds };
    case "SET_STATS":
      return { ...state, stats: action.stats };
    case "START_SESSION":
      return {
        ...state,
        phase: "loading",
        listId: action.listId,
        list: action.list,
        sessionStartedAt: new Date().toISOString(),
        stats: {
          ...EMPTY_STATS,
          totalContacts: action.list.total_contacts,
        },
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// -----------------------------------------------------------
// Context value
// -----------------------------------------------------------

interface DialerContextValue {
  state: DialerSessionState;
  startSession: (listId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  endSession: () => Promise<void>;
  skipContact: () => Promise<void>;
  submitContactDisposition: (
    disposition: Disposition,
    notes?: string,
    scheduledCallback?: string
  ) => Promise<void>;
  dialCurrentContact: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const DialerContext = createContext<DialerContextValue | null>(null);

export function useDialer() {
  const ctx = useContext(DialerContext);
  if (!ctx) throw new Error("useDialer must be used within DialerProvider");
  return ctx;
}

export function useDialerMaybe() {
  return useContext(DialerContext);
}

// -----------------------------------------------------------
// Provider
// -----------------------------------------------------------

export function DialerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const softphone = useSoftphoneMaybe();
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Fetch current user id on mount
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) userIdRef.current = user.id;
      });
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // -----------------------------------------------------------
  // Load next contact and transition to pre_call
  // -----------------------------------------------------------
  const loadNextContact = useCallback(
    async (list: DialerList) => {
      dispatch({ type: "SET_PHASE", phase: "loading" });
      const settings = (list.settings || DEFAULT_SETTINGS) as DialerListSettings;
      const nextContact = await getNextContact(
        list.id,
        list.current_position ?? 0,
        settings
      );

      if (!nextContact) {
        // List exhausted
        const stats = await computeSessionStats(list.id);
        dispatch({ type: "SET_STATS", stats });
        dispatch({ type: "SET_PHASE", phase: "completed" });
        await updateListStatus(list.id, "completed", {
          completed_at: new Date().toISOString(),
        });
        return;
      }

      // Update list current_position
      await createClient()
        .from("dialer_lists")
        .update({ current_position: nextContact.position })
        .eq("id", list.id);

      dispatch({ type: "SET_CURRENT_CONTACT", contact: nextContact });
      dispatch({ type: "SET_AUTO_DISPOSITION", disposition: null });
      dispatch({ type: "SET_CALL_ID", callId: null });
      dispatch({ type: "SET_PHASE", phase: "pre_call" });
    },
    []
  );

  // -----------------------------------------------------------
  // Start a dialing session
  // -----------------------------------------------------------
  const startSession = useCallback(
    async (listId: string) => {
      const list = await loadDialerList(listId);
      if (!list) return;

      await updateListStatus(listId, "active", {
        started_at: new Date().toISOString(),
      });

      list.status = "active";
      dispatch({ type: "START_SESSION", listId, list });
      await loadNextContact(list);
    },
    [loadNextContact]
  );

  // -----------------------------------------------------------
  // Dial the current contact using softphone
  // -----------------------------------------------------------
  const dialCurrentContact = useCallback(async () => {
    if (!state.currentContact?.contact?.phone || !softphone) return;
    const contact = state.currentContact.contact;
    const phone = contact.phone;

    // Re-check DNC before calling
    const { data: freshContact } = await createClient()
      .from("crm_contacts")
      .select("dnc")
      .eq("id", contact.id)
      .single();

    if (freshContact?.dnc) {
      await createClient()
        .from("dialer_list_contacts")
        .update({ status: "dnc_skipped" })
        .eq("id", state.currentContact.id);

      if (state.list) await loadNextContact(state.list);
      return;
    }

    // Mark as calling
    await createClient()
      .from("dialer_list_contacts")
      .update({ status: "calling" })
      .eq("id", state.currentContact.id);

    // Create call record
    const callId = await createDialerCallRecord({
      contactId: contact.id,
      performedBy: userIdRef.current || "",
    });

    dispatch({ type: "SET_CALL_ID", callId });
    dispatch({ type: "SET_PHASE", phase: "dialing" });

    // Normalize phone number (phone is guaranteed non-null by the guard above)
    const normalized = phone!.startsWith("+")
      ? phone!
      : `+1${phone!.replace(/\D/g, "")}`;

    try {
      await softphone.makeOutboundCall(normalized);
    } catch (err) {
      console.error("[Dialer] Call failed:", err);
      dispatch({ type: "SET_AUTO_DISPOSITION", disposition: "Failed" });
      dispatch({ type: "SET_PHASE", phase: "disposition" });
    }
  }, [state.currentContact, state.list, softphone, loadNextContact]);

  // -----------------------------------------------------------
  // Submit disposition
  // -----------------------------------------------------------
  const submitContactDisposition = useCallback(
    async (
      disposition: Disposition,
      notes?: string,
      scheduledCallback?: string
    ) => {
      if (!state.currentContact || !state.list) return;

      await submitDisposition({
        listContactId: state.currentContact.id,
        listId: state.list.id,
        contactId: state.currentContact.contact_id,
        callId: state.currentCallId,
        disposition,
        notes,
        scheduledCallback,
        performedBy: userIdRef.current || "",
      });

      // Refresh stats
      const stats = await computeSessionStats(state.list.id);
      dispatch({ type: "SET_STATS", stats });

      const settings = (state.list.settings || DEFAULT_SETTINGS) as DialerListSettings;

      // Auto-advance
      if (settings.auto_advance) {
        dispatch({ type: "SET_PHASE", phase: "advancing" });
        const pauseSeconds = settings.pause_between_calls;
        dispatch({
          type: "SET_ADVANCE_COUNTDOWN",
          seconds: pauseSeconds,
        });

        clearCountdown();
        let remaining = pauseSeconds;
        countdownRef.current = setInterval(() => {
          remaining--;
          dispatch({ type: "SET_ADVANCE_COUNTDOWN", seconds: remaining });
          if (remaining <= 0) {
            clearCountdown();
            // Refresh list and advance
            loadDialerList(state.list!.id).then((freshList) => {
              if (freshList) {
                dispatch({ type: "SET_LIST", list: freshList });
                loadNextContact(freshList);
              }
            });
          }
        }, 1000);
      } else {
        // Manual advance — wait in pre_call for next loadNextContact
        const freshList = await loadDialerList(state.list.id);
        if (freshList) {
          dispatch({ type: "SET_LIST", list: freshList });
          await loadNextContact(freshList);
        }
      }
    },
    [state.currentContact, state.currentCallId, state.list, loadNextContact, clearCountdown]
  );

  // -----------------------------------------------------------
  // Skip contact
  // -----------------------------------------------------------
  const skipContact = useCallback(async () => {
    if (!state.currentContact || !state.list) return;

    // If a call is active, hang up first
    if (
      softphone &&
      (softphone.status === "on-call" || softphone.status === "connecting")
    ) {
      softphone.hangUp();
    }

    await createClient()
      .from("dialer_list_contacts")
      .update({ status: "skipped" })
      .eq("id", state.currentContact.id);

    const stats = await computeSessionStats(state.list.id);
    dispatch({ type: "SET_STATS", stats });

    const freshList = await loadDialerList(state.list.id);
    if (freshList) {
      dispatch({ type: "SET_LIST", list: freshList });
      await loadNextContact(freshList);
    }
  }, [state.currentContact, state.list, softphone, loadNextContact]);

  // -----------------------------------------------------------
  // Pause session
  // -----------------------------------------------------------
  const pauseSession = useCallback(async () => {
    if (!state.listId) return;
    clearCountdown();

    if (
      softphone &&
      (softphone.status === "on-call" || softphone.status === "connecting")
    ) {
      softphone.hangUp();
    }

    await updateListStatus(state.listId, "paused");
    dispatch({ type: "SET_PHASE", phase: "paused" });
  }, [state.listId, softphone, clearCountdown]);

  // -----------------------------------------------------------
  // Resume session
  // -----------------------------------------------------------
  const resumeSession = useCallback(async () => {
    if (!state.listId) return;
    const freshList = await loadDialerList(state.listId);
    if (!freshList) return;

    await updateListStatus(freshList.id, "active");
    freshList.status = "active";
    dispatch({ type: "SET_LIST", list: freshList });
    await loadNextContact(freshList);
  }, [state.listId, loadNextContact]);

  // -----------------------------------------------------------
  // End session
  // -----------------------------------------------------------
  const endSession = useCallback(async () => {
    clearCountdown();

    if (
      softphone &&
      (softphone.status === "on-call" || softphone.status === "connecting")
    ) {
      softphone.hangUp();
    }

    if (state.listId) {
      const stats = await computeSessionStats(state.listId);
      dispatch({ type: "SET_STATS", stats });
      await updateListStatus(state.listId, "completed", {
        completed_at: new Date().toISOString(),
      });
    }

    dispatch({ type: "SET_PHASE", phase: "completed" });
  }, [state.listId, softphone, clearCountdown]);

  // -----------------------------------------------------------
  // Refresh stats
  // -----------------------------------------------------------
  const refreshStats = useCallback(async () => {
    if (!state.listId) return;
    const stats = await computeSessionStats(state.listId);
    dispatch({ type: "SET_STATS", stats });
  }, [state.listId]);

  // -----------------------------------------------------------
  // Listen to softphone status changes for auto-disposition
  // -----------------------------------------------------------
  useEffect(() => {
    if (!softphone) return;
    if (state.phase === "dialing" && softphone.status === "on-call") {
      dispatch({ type: "SET_PHASE", phase: "on_call" });
    }
    if (
      (state.phase === "dialing" || state.phase === "on_call") &&
      softphone.status === "ready"
    ) {
      // Call ended
      dispatch({ type: "SET_PHASE", phase: "disposition" });
    }
    // Pause dialer when incoming call arrives
    if (state.phase !== "idle" && state.phase !== "completed" && softphone.status === "incoming") {
      clearCountdown();
      dispatch({ type: "SET_PHASE", phase: "paused" });
    }
  }, [softphone?.status, state.phase, clearCountdown, softphone]);

  const value: DialerContextValue = {
    state,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    skipContact,
    submitContactDisposition,
    dialCurrentContact,
    refreshStats,
  };

  return (
    <DialerContext.Provider value={value}>{children}</DialerContext.Provider>
  );
}
