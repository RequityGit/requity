"use client";

import { createContext, useContext } from "react";
import { useActivityTracker } from "@/hooks/useActivityTracker";

interface ActivityTrackerContextValue {
  trackEvent: (
    actionType: string,
    opts?: {
      component?: string;
      metadata?: Record<string, unknown>;
      durationMs?: number;
    }
  ) => void;
}

const ActivityTrackerContext = createContext<ActivityTrackerContextValue>({
  trackEvent: () => {},
});

export function useActivity() {
  return useContext(ActivityTrackerContext);
}

interface ActivityTrackerProviderProps {
  role?: string;
  department?: string;
  children: React.ReactNode;
}

export function ActivityTrackerProvider({
  role,
  department,
  children,
}: ActivityTrackerProviderProps) {
  const { trackEvent } = useActivityTracker(role, department);

  return (
    <ActivityTrackerContext.Provider value={{ trackEvent }}>
      {children}
    </ActivityTrackerContext.Provider>
  );
}
