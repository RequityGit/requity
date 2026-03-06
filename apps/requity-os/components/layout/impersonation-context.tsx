"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface ImpersonationContextValue {
  isImpersonating: boolean;
  targetUserId: string | null;
  targetRole: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  isImpersonating: false,
  targetUserId: null,
  targetRole: null,
  targetUserName: null,
  targetUserEmail: null,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
});

export function useImpersonation() {
  return useContext(ImpersonationContext);
}

interface ImpersonationProviderProps {
  children: React.ReactNode;
  initialState: {
    isImpersonating: boolean;
    targetUserId: string | null;
    targetRole: string | null;
    targetUserName: string | null;
    targetUserEmail: string | null;
  };
  isSuperAdmin: boolean;
}

export function ImpersonationProvider({
  children,
  initialState,
  isSuperAdmin,
}: ImpersonationProviderProps) {
  const router = useRouter();

  const startImpersonation = useCallback(
    async (userId: string) => {
      if (!isSuperAdmin) return;

      try {
        const res = await fetch("/api/admin/impersonate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: userId }),
        });

        if (res.ok) {
          const data = await res.json();
          // Redirect to the impersonated user's dashboard
          const roleDashboard =
            data.role === "investor"
              ? "/investor/dashboard"
              : data.role === "borrower"
                ? "/borrower/dashboard"
                : "/admin/dashboard";
          router.push(roleDashboard);
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to start impersonation:", err);
      }
    },
    [isSuperAdmin, router]
  );

  const stopImpersonation = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to stop impersonation:", err);
    }
  }, [router]);

  return (
    <ImpersonationContext.Provider
      value={{
        ...initialState,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}
