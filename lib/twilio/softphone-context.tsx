"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Device, Call } from "@twilio/voice-sdk";
import type { SoftphoneContextValue, SoftphoneStatus } from "./types";

const TOKEN_URL = "https://requity-ivr-6327.twil.io/token";
const IDENTITY = "alfonso";

const SoftphoneContext = createContext<SoftphoneContextValue | null>(null);

export function useSoftphone() {
  const ctx = useContext(SoftphoneContext);
  if (!ctx) {
    throw new Error("useSoftphone must be used within a SoftphoneProvider");
  }
  return ctx;
}

export function useSoftphoneMaybe() {
  return useContext(SoftphoneContext);
}

async function fetchToken(): Promise<string> {
  const res = await fetch(`${TOKEN_URL}?identity=${IDENTITY}`);
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

export function SoftphoneProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SoftphoneStatus>("offline");
  const [incomingCallerNumber, setIncomingCallerNumber] = useState<
    string | null
  >(null);
  const [dialedNumber, setDialedNumber] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCallConnectedRef = useRef<((callSid: string) => void) | undefined>();
  const onCallDisconnectedRef = useRef<(() => void) | undefined>();

  const setOnCallConnected = useCallback((cb: ((callSid: string) => void) | undefined) => {
    onCallConnectedRef.current = cb;
  }, []);

  const setOnCallDisconnected = useCallback((cb: (() => void) | undefined) => {
    onCallDisconnectedRef.current = cb;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetCallState = useCallback(() => {
    callRef.current = null;
    setIncomingCallerNumber(null);
    setDialedNumber(null);
    setCallDuration(0);
    setIsMuted(false);
    clearTimer();
    onCallDisconnectedRef.current?.();
    if (deviceRef.current?.state === "registered") {
      setStatus("ready");
    } else {
      setStatus("offline");
    }
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, [clearTimer]);

  const initDevice = useCallback(async () => {
    try {
      setError(null);
      const token = await fetchToken();
      const device = new Device(token, {
        edge: "ashburn",
        closeProtection: true,
      });

      device.on("registered", () => {
        setStatus("ready");
        setError(null);
      });

      device.on("unregistered", () => {
        setStatus("offline");
      });

      device.on("error", (err) => {
        console.error("[Softphone] Device error:", err);
        setError(err.message || "Device error");
      });

      device.on("tokenWillExpire", async () => {
        try {
          const newToken = await fetchToken();
          device.updateToken(newToken);
        } catch (e) {
          console.error("[Softphone] Token refresh failed:", e);
          setError("Token refresh failed");
        }
      });

      device.on("incoming", (call: Call) => {
        setStatus("incoming");
        setIncomingCallerNumber(call.parameters.From || "Unknown");
        callRef.current = call;

        call.on("cancel", () => resetCallState());
        call.on("disconnect", () => resetCallState());
        call.on("error", (err) => {
          console.error("[Softphone] Incoming call error:", err);
          resetCallState();
        });
      });

      await device.register();
      deviceRef.current = device;
    } catch (e) {
      console.error("[Softphone] Init failed:", e);
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone access is required for calls. Please allow microphone access and retry."
          : e instanceof Error
            ? e.message
            : "Failed to initialize softphone";
      setError(msg);
      setStatus("offline");
    }
  }, [resetCallState]);

  useEffect(() => {
    initDevice();
    return () => {
      clearTimer();
      if (deviceRef.current) {
        deviceRef.current.unregister();
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptCall = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    call.accept();
    setStatus("on-call");
    startTimer();
    onCallConnectedRef.current?.(call.parameters.CallSid || "");
  }, [startTimer]);

  const rejectCall = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    call.reject();
    resetCallState();
  }, [resetCallState]);

  const makeOutboundCall = useCallback(
    async (phoneNumber: string) => {
      const device = deviceRef.current;
      if (!device || status === "on-call" || status === "connecting") return;

      try {
        setError(null);
        setStatus("connecting");
        setDialedNumber(phoneNumber);

        const call = await device.connect({
          params: { To: phoneNumber },
        });
        callRef.current = call;

        call.on("accept", () => {
          setStatus("on-call");
          startTimer();
          onCallConnectedRef.current?.(call.parameters?.CallSid || "");
        });

        call.on("disconnect", () => resetCallState());
        call.on("error", (err) => {
          console.error("[Softphone] Outbound call error:", err);
          setError(err.message || "Call failed");
          resetCallState();
        });
      } catch (e) {
        console.error("[Softphone] Connect failed:", e);
        setError(e instanceof Error ? e.message : "Failed to connect call");
        resetCallState();
      }
    },
    [status, startTimer, resetCallState]
  );

  const hangUp = useCallback(() => {
    callRef.current?.disconnect();
    resetCallState();
  }, [resetCallState]);

  const toggleMute = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const newMuted = !isMuted;
    call.mute(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const sendDigit = useCallback((digit: string) => {
    callRef.current?.sendDigits(digit);
  }, []);

  const retry = useCallback(() => {
    if (deviceRef.current) {
      deviceRef.current.unregister();
      deviceRef.current.destroy();
      deviceRef.current = null;
    }
    initDevice();
  }, [initDevice]);

  const value: SoftphoneContextValue = {
    status,
    incomingCallerNumber,
    dialedNumber,
    callDuration,
    isMuted,
    error,
    makeOutboundCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    sendDigit,
    retry,
    setOnCallConnected,
    setOnCallDisconnected,
  };

  return (
    <SoftphoneContext.Provider value={value}>
      {children}
    </SoftphoneContext.Provider>
  );
}
