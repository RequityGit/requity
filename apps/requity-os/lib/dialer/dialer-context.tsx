"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { pickNextContacts, getRetryAction } from "./dialer-engine";
import { fireCallGroup, submitDisposition } from "./dialer-api";
import type {
  DialerState,
  DialerSessionState,
  DialerSessionProgress,
  DialerListSettings,
  ContactForDialer,
  CallGroupCall,
  Disposition,
  DEFAULT_DIALER_SETTINGS,
  INITIAL_SESSION_STATE,
} from "./types";

// Re-export for convenience
export { INITIAL_SESSION_STATE } from "./types";

type DialerAction =
  | { type: "START_SESSION"; listId: string; listName: string; settings: DialerListSettings; total: number }
  | { type: "SET_STATE"; state: DialerState }
  | { type: "SET_DIALING"; groupId: string }
  | { type: "SET_CONNECTED"; contactId: string; contactName: string; callSid: string }
  | { type: "SET_DISPOSITIONING" }
  | { type: "UPDATE_PROGRESS"; updates: Partial<DialerSessionProgress> }
  | { type: "INCREMENT_DIALS"; count: number }
  | { type: "END_SESSION" }
  | { type: "RESET" };

function dialerReducer(state: DialerSessionState, action: DialerAction): DialerSessionState {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...state,
        state: "ready",
        listId: action.listId,
        listName: action.listName,
        settings: action.settings,
        sessionStartedAt: new Date(),
        progress: { ...state.progress, total: action.total },
      };
    case "SET_STATE":
      return { ...state, state: action.state };
    case "SET_DIALING":
      return {
        ...state,
        state: "dialing",
        currentGroupId: action.groupId,
        connectedContactId: null,
        connectedContactName: null,
      };
    case "SET_CONNECTED":
      return {
        ...state,
        state: "on_call",
        connectedContactId: action.contactId,
        connectedContactName: action.contactName,
        isAlfonsoOnCall: true,
        activeCallSid: action.callSid,
      };
    case "SET_DISPOSITIONING":
      return {
        ...state,
        state: "dispositioning",
        isAlfonsoOnCall: false,
        activeCallSid: null,
      };
    case "UPDATE_PROGRESS":
      return {
        ...state,
        progress: { ...state.progress, ...action.updates },
      };
    case "INCREMENT_DIALS":
      return { ...state, totalDials: state.totalDials + action.count };
    case "END_SESSION":
      return { ...state, state: "completed" };
    case "RESET":
      return {
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
        settings: {
          auto_advance: true,
          pause_between_calls: 3,
          max_attempts: 3,
          amd_enabled: true,
          amd_action: "drop",
          redial_cooldown_minutes: 12,
        },
      };
    default:
      return state;
  }
}

interface DialerContextValue {
  session: DialerSessionState;
  currentContacts: ContactForDialer[];
  currentGroupCalls: CallGroupCall[];
  startSession: (listId: string, listName: string, settings: DialerListSettings, total: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  fireNextGroup: () => Promise<void>;
  handleDisposition: (disposition: Disposition, notes?: string, scheduledCallback?: string) => Promise<void>;
  skipCurrent: () => void;
  resetDialer: () => void;
  setAlfonsoOnCall: (onCall: boolean) => void;
  setAlfonsoCallEnded: () => void;
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

export function DialerProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(dialerReducer, {
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
    settings: {
      auto_advance: true,
      pause_between_calls: 3,
      max_attempts: 3,
      amd_enabled: true,
      amd_action: "drop",
      redial_cooldown_minutes: 12,
    },
  });

  const [currentContacts, setCurrentContacts] = React.useState<ContactForDialer[]>([]);
  const [currentGroupCalls, setCurrentGroupCalls] = React.useState<CallGroupCall[]>([]);
  const positionRef = useRef(0);
  const supabaseRef = useRef(createClient());

  // Subscribe to call group changes via Supabase Realtime
  useEffect(() => {
    if (!session.currentGroupId || session.state === "idle" || session.state === "completed") return;

    const channel = supabaseRef.current
      .channel(`call-group-${session.currentGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dialer_call_groups",
          filter: `id=eq.${session.currentGroupId}`,
        },
        (payload) => {
          const updated = payload.new as {
            calls: CallGroupCall[];
            connected_contact_id: string | null;
            resolved: boolean;
          };

          setCurrentGroupCalls(updated.calls || []);

          // Check if a human was connected
          if (updated.connected_contact_id && session.state === "dialing") {
            const connectedCall = (updated.calls || []).find(
              (c: CallGroupCall) => c.contactId === updated.connected_contact_id
            );
            const connectedContact = currentContacts.find(
              (c) => c.contact_id === updated.connected_contact_id
            );
            if (connectedContact) {
              const name = [
                connectedContact.contact.first_name,
                connectedContact.contact.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "Unknown";
              dispatch({
                type: "SET_CONNECTED",
                contactId: updated.connected_contact_id,
                contactName: name,
                callSid: connectedCall?.callSid || "",
              });
              dispatch({
                type: "UPDATE_PROGRESS",
                updates: { connected: session.progress.connected + 1 },
              });
            }
          }

          // Check if all calls resolved with no human
          if (updated.resolved && !updated.connected_contact_id && session.state === "dialing") {
            handleGroupResolved(updated.calls || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentGroupId, session.state]);

  const handleGroupResolved = useCallback(
    async (calls: CallGroupCall[]) => {
      // Auto-disposition all calls
      let noAnswer = 0;
      let amd = 0;
      let busy = 0;
      let failed = 0;

      for (const call of calls) {
        switch (call.status) {
          case "no_answer":
            noAnswer++;
            break;
          case "amd_detected":
            amd++;
            break;
          case "busy":
            busy++;
            break;
          case "failed":
            failed++;
            break;
        }

        // Check multi-number retry
        const lc = currentContacts.find((c) => c.contact_id === call.contactId);
        if (lc) {
          const retryAction = getRetryAction(
            {
              phone_numbers: lc.phone_numbers,
              current_number_index: lc.current_number_index,
              attempts: lc.attempts,
            },
            call.status,
            session.settings
          );

          if (retryAction.action === "retry_next_number" && retryAction.nextIndex !== undefined) {
            await supabaseRef.current
              .from("dialer_list_contacts")
              .update({ current_number_index: retryAction.nextIndex })
              .eq("id", lc.id);
          } else if (retryAction.action === "retry_later" && retryAction.nextIndex !== undefined) {
            await supabaseRef.current
              .from("dialer_list_contacts")
              .update({ current_number_index: retryAction.nextIndex })
              .eq("id", lc.id);
          } else if (retryAction.action === "mark_complete") {
            await supabaseRef.current
              .from("dialer_list_contacts")
              .update({
                status: "called",
                disposition: retryAction.finalDisposition,
              })
              .eq("id", lc.id);
          }
        }
      }

      dispatch({
        type: "UPDATE_PROGRESS",
        updates: {
          noAnswer: session.progress.noAnswer + noAnswer,
          answeringMachine: session.progress.answeringMachine + amd,
          busy: session.progress.busy + busy,
          failed: session.progress.failed + failed,
          processed: session.progress.processed + calls.length,
        },
      });

      // Auto-advance to next group
      if (session.settings.auto_advance) {
        setTimeout(() => {
          dispatch({ type: "SET_STATE", state: "ready" });
        }, session.settings.pause_between_calls * 1000);
      } else {
        dispatch({ type: "SET_STATE", state: "ready" });
      }
    },
    [currentContacts, session.settings, session.progress]
  );

  const startSession = useCallback(
    (listId: string, listName: string, settings: DialerListSettings, total: number) => {
      positionRef.current = 0;
      dispatch({ type: "START_SESSION", listId, listName, settings, total });
    },
    []
  );

  const fireNextGroup = useCallback(async () => {
    if (session.isAlfonsoOnCall) return;
    if (session.state !== "ready" || !session.listId) return;

    const contacts = await pickNextContacts(
      session.listId,
      positionRef.current,
      3,
      session.settings
    );

    if (contacts.length === 0) {
      dispatch({ type: "END_SESSION" });
      return;
    }

    // Update position
    const maxPos = Math.max(...contacts.map((c) => c.position));
    positionRef.current = maxPos;

    // Update list current_position
    await supabaseRef.current
      .from("dialer_lists")
      .update({ current_position: maxPos })
      .eq("id", session.listId);

    setCurrentContacts(contacts);

    const groupId = crypto.randomUUID();
    dispatch({ type: "SET_DIALING", groupId });
    dispatch({ type: "INCREMENT_DIALS", count: contacts.length });

    const payload = {
      contacts: contacts.map((c) => ({
        contactId: c.contact_id,
        listContactId: c.id,
        phone: c.phone_numbers[c.current_number_index]?.number || c.contact.phone || "",
      })),
      listId: session.listId,
      groupId,
    };

    try {
      await fireCallGroup(payload);
      setCurrentGroupCalls(
        contacts.map((c) => ({
          contactId: c.contact_id,
          listContactId: c.id,
          phone: c.phone_numbers[c.current_number_index]?.number || "",
          callSid: null,
          status: "ringing" as const,
          amdResult: null,
        }))
      );
    } catch (err) {
      console.error("[Dialer] Failed to fire group:", err);
      dispatch({ type: "SET_STATE", state: "ready" });
    }
  }, [session]);

  // Auto-fire when state becomes "ready" during an active session
  useEffect(() => {
    if (session.state === "ready" && session.listId && session.settings.auto_advance) {
      const timer = setTimeout(() => {
        fireNextGroup();
      }, session.settings.pause_between_calls * 1000);
      return () => clearTimeout(timer);
    }
  }, [session.state, session.listId, session.settings.auto_advance, session.settings.pause_between_calls, fireNextGroup]);

  const handleDisposition = useCallback(
    async (disposition: Disposition, notes?: string, scheduledCallback?: string) => {
      if (!session.connectedContactId || !session.currentGroupId || !session.listId) return;

      const lc = currentContacts.find(
        (c) => c.contact_id === session.connectedContactId
      );
      if (!lc) return;

      await submitDisposition({
        listContactId: lc.id,
        contactId: session.connectedContactId,
        disposition,
        notes,
        scheduledCallback,
        callGroupId: session.currentGroupId,
        listId: session.listId,
      });

      dispatch({
        type: "UPDATE_PROGRESS",
        updates: {
          processed: session.progress.processed + 1,
          callbacks: scheduledCallback
            ? session.progress.callbacks + 1
            : session.progress.callbacks,
          dncSkipped: disposition === "dnc"
            ? session.progress.dncSkipped + 1
            : session.progress.dncSkipped,
        },
      });

      dispatch({ type: "SET_STATE", state: "ready" });
    },
    [session, currentContacts]
  );

  const pauseSession = useCallback(() => {
    dispatch({ type: "SET_STATE", state: "paused" });
    if (session.listId) {
      supabaseRef.current
        .from("dialer_lists")
        .update({ status: "paused" })
        .eq("id", session.listId);
    }
  }, [session.listId]);

  const resumeSession = useCallback(() => {
    dispatch({ type: "SET_STATE", state: "ready" });
    if (session.listId) {
      supabaseRef.current
        .from("dialer_lists")
        .update({ status: "active" })
        .eq("id", session.listId);
    }
  }, [session.listId]);

  const endSession = useCallback(() => {
    dispatch({ type: "END_SESSION" });
    if (session.listId) {
      supabaseRef.current
        .from("dialer_lists")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", session.listId);
    }
  }, [session.listId]);

  const skipCurrent = useCallback(() => {
    dispatch({ type: "SET_STATE", state: "ready" });
  }, []);

  const resetDialer = useCallback(() => {
    dispatch({ type: "RESET" });
    setCurrentContacts([]);
    setCurrentGroupCalls([]);
    positionRef.current = 0;
  }, []);

  const setAlfonsoOnCall = useCallback((onCall: boolean) => {
    if (onCall) {
      // External call detected — don't change dialer state machine,
      // just set the flag so concurrency gating blocks the next fire
    }
  }, []);

  const setAlfonsoCallEnded = useCallback(() => {
    if (session.state === "on_call") {
      dispatch({ type: "SET_DISPOSITIONING" });
    }
  }, [session.state]);

  const value: DialerContextValue = {
    session,
    currentContacts,
    currentGroupCalls,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    fireNextGroup,
    handleDisposition,
    skipCurrent,
    resetDialer,
    setAlfonsoOnCall,
    setAlfonsoCallEnded,
  };

  return (
    <DialerContext.Provider value={value}>{children}</DialerContext.Provider>
  );
}
