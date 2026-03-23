"use client";

import { NotificationCenterProvider } from "@/hooks/use-notification-center";
import { NotificationCenter } from "./notification-center";

interface NotificationCenterWrapperProps {
  userId: string;
  activeRole: string;
  currentUserName: string;
  children: React.ReactNode;
}

export function NotificationCenterWrapper({
  userId,
  activeRole,
  currentUserName,
  children,
}: NotificationCenterWrapperProps) {
  return (
    <NotificationCenterProvider userId={userId}>
      {children}
      <NotificationCenter
        userId={userId}
        activeRole={activeRole}
        currentUserName={currentUserName}
      />
    </NotificationCenterProvider>
  );
}
