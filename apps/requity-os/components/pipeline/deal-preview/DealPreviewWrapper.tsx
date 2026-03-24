"use client";

import { DealPreviewProvider } from "./DealPreviewProvider";
import { DealPreviewModal } from "./DealPreviewModal";

interface DealPreviewWrapperProps {
  currentUserId: string;
  currentUserName: string;
  children: React.ReactNode;
}

export function DealPreviewWrapper({
  currentUserId,
  currentUserName,
  children,
}: DealPreviewWrapperProps) {
  return (
    <DealPreviewProvider>
      {children}
      <DealPreviewModal
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </DealPreviewProvider>
  );
}
