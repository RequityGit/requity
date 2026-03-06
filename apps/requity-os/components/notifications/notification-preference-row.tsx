"use client";

import { cn } from "@/lib/utils";
import type { NotificationTypeWithPreference } from "@/lib/notifications";

interface NotificationPreferenceRowProps {
  type: NotificationTypeWithPreference;
  onToggle: (
    typeId: string,
    field: "email_enabled" | "in_app_enabled",
    value: boolean
  ) => void;
}

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        enabled ? "bg-blue-600" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
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
        <p className="text-sm font-medium text-gray-900">
          {type.display_name}
        </p>
        {type.description && (
          <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
        )}
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-12 text-right">In-App</span>
          <Toggle
            enabled={inAppEnabled}
            onChange={(value) => onToggle(type.id, "in_app_enabled", value)}
            label={`${type.display_name} in-app notifications`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10 text-right">Email</span>
          <Toggle
            enabled={emailEnabled}
            onChange={(value) => onToggle(type.id, "email_enabled", value)}
            label={`${type.display_name} email notifications`}
          />
        </div>
      </div>
    </div>
  );
}
