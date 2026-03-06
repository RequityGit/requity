"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NotificationTypeWithPreference } from "@/lib/notifications";
import { nq } from "@/lib/notifications";

export function useNotificationPreferences(userId: string | undefined) {
  const [types, setTypes] = useState<NotificationTypeWithPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const q = nq(supabase);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await q
      .notificationTypes()
      .select("*, notification_preferences!left(email_enabled, in_app_enabled)")
      .eq("notification_preferences.user_id", userId)
      .eq("is_active", true)
      .order("category")
      .order("sort_order");

    if (!error && data) {
      setTypes(data as NotificationTypeWithPreference[]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(
    async (
      notificationTypeId: string,
      field: "email_enabled" | "in_app_enabled",
      value: boolean
    ) => {
      if (!userId) return;

      // Optimistic update
      setTypes((prev) =>
        prev.map((t) => {
          if (t.id !== notificationTypeId) return t;
          const existing = t.notification_preferences?.[0];
          const updated = {
            email_enabled: existing?.email_enabled ?? t.default_email_enabled,
            in_app_enabled: existing?.in_app_enabled ?? t.default_in_app_enabled,
            [field]: value,
          };
          return {
            ...t,
            notification_preferences: [updated],
          };
        })
      );

      // Debounce the actual save
      const key = `${notificationTypeId}-${field}`;
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        setSaving(true);
        // Get current state for this type
        const currentType = types.find((t) => t.id === notificationTypeId);
        const currentPref = currentType?.notification_preferences?.[0];

        const upsertData = {
          user_id: userId,
          notification_type_id: notificationTypeId,
          email_enabled:
            field === "email_enabled"
              ? value
              : currentPref?.email_enabled ??
                currentType?.default_email_enabled ??
                true,
          in_app_enabled:
            field === "in_app_enabled"
              ? value
              : currentPref?.in_app_enabled ??
                currentType?.default_in_app_enabled ??
                true,
        };

        await q
          .notificationPreferences()
          .upsert(upsertData, { onConflict: "user_id,notification_type_id" });

        setSaving(false);
        debounceTimers.current.delete(key);
      }, 500);

      debounceTimers.current.set(key, timer);
    },
    [userId, types] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const updateCategoryPreferences = useCallback(
    async (
      category: string,
      field: "email_enabled" | "in_app_enabled",
      value: boolean
    ) => {
      const categoryTypes = types.filter((t) => t.category === category);
      for (const t of categoryTypes) {
        await updatePreference(t.id, field, value);
      }
    },
    [types, updatePreference]
  );

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    types,
    loading,
    saving,
    updatePreference,
    updateCategoryPreferences,
    refetch: fetchPreferences,
  };
}
