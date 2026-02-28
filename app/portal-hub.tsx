"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SupabaseProvider } from "@/providers/supabase-provider";
import { RoleProvider, useRoles } from "@/providers/role-provider";
import { RoleHub } from "@/components/dashboard/role-hub";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

function PortalHubContent({ userName }: { userName: string }) {
  const { roles, activeRole, isLoading } = useRoles();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // If user has exactly 1 role, redirect to that role's dashboard
    if (roles.length === 1) {
      const role = roles[0].role;
      if (role === "super_admin" || role === "admin") {
        router.replace("/admin");
      } else if (role === "borrower") {
        router.replace("/borrower");
      } else if (role === "investor") {
        router.replace("/investor");
      }
      return;
    }

    // If activeRole is set, redirect to that role's dashboard
    if (activeRole) {
      if (activeRole === "super_admin" || activeRole === "admin") {
        router.replace("/admin");
      } else if (activeRole === "borrower") {
        router.replace("/borrower");
      } else if (activeRole === "investor") {
        router.replace("/investor");
      }
    }
    // Otherwise, show the role hub
  }, [roles, activeRole, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-deep">
        <LoadingSkeleton message="Loading your portal..." rows={0} />
      </div>
    );
  }

  // Show role hub for multi-role users without a selected role
  if (roles.length > 1 && !activeRole) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <RoleHub userName={userName} />
      </div>
    );
  }

  // Loading / redirecting state
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-deep">
      <LoadingSkeleton message="Redirecting to your dashboard..." rows={0} />
    </div>
  );
}

export function PortalHubPage({
  userName,
  email,
}: {
  userName: string;
  email: string;
}) {
  return (
    <SupabaseProvider>
      <RoleProvider>
        <PortalHubContent userName={userName} />
      </RoleProvider>
    </SupabaseProvider>
  );
}
