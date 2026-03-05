export type SoftphoneStatus =
  | "offline"
  | "ready"
  | "incoming"
  | "on-call"
  | "connecting";

export interface SoftphoneState {
  status: SoftphoneStatus;
  incomingCallerNumber: string | null;
  callDuration: number;
  isMuted: boolean;
  error: string | null;
  dialedNumber: string | null;
}

export interface SoftphoneContextValue extends SoftphoneState {
  makeOutboundCall: (phoneNumber: string) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  sendDigit: (digit: string) => void;
  retry: () => void;
  onCallConnected?: (callSid: string) => void;
  onCallDisconnected?: () => void;
  setOnCallConnected: (cb: ((callSid: string) => void) | undefined) => void;
  setOnCallDisconnected: (cb: (() => void) | undefined) => void;
}
