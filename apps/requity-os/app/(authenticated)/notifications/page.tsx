import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Determine the user's active role for notification routing
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, allowed_roles")
    .eq("id", user.id)
    .single();

  const cookieStore = cookies();
  const activeRoleCookie = cookieStore.get("active_role")?.value;
  const allowedRoles: string[] = profile?.allowed_roles?.length
    ? (profile.allowed_roles.filter(Boolean) as string[])
    : [profile?.role].filter(Boolean) as string[];

  const effectiveRole =
    activeRoleCookie && allowedRoles.includes(activeRoleCookie)
      ? activeRoleCookie
      : (profile?.role ?? "borrower");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with activity across the platform."
        action={
          <Link href="/settings/notifications">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </Button>
          </Link>
        }
      />
      <NotificationsPageClient userId={user.id} activeRole={effectiveRole} />
    </div>
  );
}
