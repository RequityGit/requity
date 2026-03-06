"use client";

import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationPreferencesClient } from "@/components/notifications/notification-preferences-client";
import { GmailIntegration } from "@/components/shared/gmail-integration";
import { User, Bell, Plug } from "lucide-react";

interface AccountSettingsTabsProps {
  userId: string;
  children: ReactNode;
  description?: string;
}

export function AccountSettingsTabs({
  userId,
  children,
  description = "Manage your profile information",
}: AccountSettingsTabsProps) {
  return (
    <div>
      <PageHeader title="Account Settings" description={description} />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          {children}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="max-w-4xl">
            <NotificationPreferencesClient userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="max-w-4xl">
            <GmailIntegration />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
