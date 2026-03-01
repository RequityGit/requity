import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationPreferencesClient } from "@/components/notifications/notification-preferences-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NotificationPreferencesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Notification Preferences"
        description="Choose how you want to be notified about activity on the platform."
        action={
          <Link href="/notifications">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Notifications
            </Button>
          </Link>
        }
      />
      <NotificationPreferencesClient userId={user.id} />
    </div>
  );
}
