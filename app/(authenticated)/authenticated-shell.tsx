"use client";

import { SupabaseProvider } from "@/providers/supabase-provider";
import { RoleProvider } from "@/providers/role-provider";
import { PortalShell } from "@/components/layout/portal-shell";

interface AuthenticatedShellProps {
  children: React.ReactNode;
  userName: string;
  email: string;
}

export function AuthenticatedShell({
  children,
  userName,
  email,
}: AuthenticatedShellProps) {
  return (
    <SupabaseProvider>
      <RoleProvider>
        <PortalShell userName={userName} email={email}>
          {children}
        </PortalShell>
      </RoleProvider>
    </SupabaseProvider>
  );
}
