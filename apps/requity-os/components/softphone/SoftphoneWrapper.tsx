"use client";

import { ErrorBoundary } from "react-error-boundary";
import { SoftphoneProvider } from "@/lib/twilio/softphone-context";
import { SoftphoneWidget } from "./SoftphoneWidget";

export function SoftphoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <SoftphoneProvider>
        {children}
        <SoftphoneWidget />
      </SoftphoneProvider>
    </ErrorBoundary>
  );
}
