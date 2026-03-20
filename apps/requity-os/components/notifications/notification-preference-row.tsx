"use client";

import { Switch } from "@/components/ui/switch";
import type { NotificationTypeWithPreference } from "@/lib/notifications";

interface NotificationPreferenceRowProps {
  type: NotificationTypeWithPreference;
  onToggle: (
    typeId: string,
    field: "email_enabled" | "in_app_enabled",
    value: boolean
  ) => void;
}

export function NotificationPreferenceRow({
  type,
  onToggle,
}: NotificationPreferenceRowProps) {
  const pref = type.notification_preferences?.[0];
  const emailEnabled = pref?.email_enabled ?? type.default_email_enabled;
  const inAppEnabled = pref?.in_app_enabled ?? type.default_in_app_enabled;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md px-4 py-3 hover:bg-muted transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {type.display_name}
        </p>
        {type.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
        )}
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12 text-right">In-App</span>
          <Switch
            checked={inAppEnabled}
            onCheckedChange={(value) => onToggle(type.id, "in_app_enabled", value)}
            aria-label={`${type.display_name} in-app notifications`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">Email</span>
          <Switch
            checked={emailEnabled}
            onCheckedChange={(value) => onToggle(type.id, "email_enabled", value)}
            aria-label={`${type.display_name} email notifications`}
          />
        </div>
      </div>
    </div>
  );
}
