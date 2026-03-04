"use client";

import { SoftphoneProvider } from "@/lib/twilio/softphone-context";
import { SoftphoneWidget } from "./SoftphoneWidget";

export function SoftphoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SoftphoneProvider>
      {children}
      <SoftphoneWidget />
    </SoftphoneProvider>
  );
}
