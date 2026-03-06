"use client";

import { useState } from "react";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { NotificationPreferenceRow } from "./notification-preference-row";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { NotificationCategory } from "@/lib/notifications";
import { categoryDisplayNames } from "@/lib/notifications";

interface NotificationPreferencesClientProps {
  userId: string;
}

function CategoryToggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={`${label} all`}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        enabled ? "bg-blue-600" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-3" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function NotificationPreferencesClient({
  userId,
}: NotificationPreferencesClientProps) {
  const { types, loading, saving, updatePreference, updateCategoryPreferences } =
    useNotificationPreferences(userId);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();

  // Group types by category
  const grouped = types.reduce(
    (acc, type) => {
      const cat = type.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(type);
      return acc;
    },
    {} as Record<string, typeof types>
  );

  const orderedCategories: NotificationCategory[] = [
    "lending",
    "investments",
    "crm",
    "operations",
    "system",
  ];

  function toggleCategory(category: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function handleToggle(
    typeId: string,
    field: "email_enabled" | "in_app_enabled",
    value: boolean
  ) {
    updatePreference(typeId, field, value);
    toast({
      title: "Preference updated",
      description: "Your notification preference has been saved.",
    });
  }

  function handleCategoryToggle(
    category: string,
    field: "email_enabled" | "in_app_enabled",
    value: boolean
  ) {
    updateCategoryPreferences(category, field, value);
    toast({
      title: "Preferences updated",
      description: `All ${categoryDisplayNames[category as NotificationCategory]} ${field === "email_enabled" ? "email" : "in-app"} notifications ${value ? "enabled" : "disabled"}.`,
    });
  }

  function isCategoryAllEnabled(
    category: string,
    field: "email_enabled" | "in_app_enabled"
  ): boolean {
    const categoryTypes = grouped[category];
    if (!categoryTypes?.length) return false;
    return categoryTypes.every((t) => {
      const pref = t.notification_preferences?.[0];
      if (field === "email_enabled") {
        return pref?.email_enabled ?? t.default_email_enabled;
      }
      return pref?.in_app_enabled ?? t.default_in_app_enabled;
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card">
            <div className="border-b border-gray-100 px-4 py-3">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between px-4 py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <div className="flex gap-6">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {saving && (
        <div className="text-xs text-blue-600 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
          Saving...
        </div>
      )}

      {orderedCategories
        .filter((cat) => grouped[cat]?.length)
        .map((category) => {
          const isCollapsed = collapsedCategories.has(category);
          const categoryTypes = grouped[category];
          const allInApp = isCategoryAllEnabled(category, "in_app_enabled");
          const allEmail = isCategoryAllEnabled(category, "email_enabled");

          return (
            <div
              key={category}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* Category header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                  {categoryDisplayNames[category]}
                  <span className="text-xs font-normal text-gray-400">
                    ({categoryTypes.length})
                  </span>
                </button>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">All In-App</span>
                    <CategoryToggle
                      label={`${categoryDisplayNames[category]} in-app`}
                      enabled={allInApp}
                      onChange={(v) =>
                        handleCategoryToggle(category, "in_app_enabled", v)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">All Email</span>
                    <CategoryToggle
                      label={`${categoryDisplayNames[category]} email`}
                      enabled={allEmail}
                      onChange={(v) =>
                        handleCategoryToggle(category, "email_enabled", v)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notification type rows */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-50">
                  {categoryTypes.map((type) => (
                    <NotificationPreferenceRow
                      key={type.id}
                      type={type}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
