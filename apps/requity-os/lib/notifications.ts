// Notification system types and helpers

import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationPriority = "urgent" | "high" | "normal" | "low";
export type NotificationCategory =
  | "lending"
  | "investments"
  | "crm"
  | "operations"
  | "system";
export type EntityType =
  | "loan"
  | "borrower"
  | "investor"
  | "fund"
  | "condition"
  | "draw_request"
  | "payment"
  | "task"
  | "project"
  | "contact"
  | "company";

export interface NotificationType {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  category: NotificationCategory;
  default_email_enabled: boolean;
  default_in_app_enabled: boolean;
  default_priority: NotificationPriority;
  applicable_roles: string[] | null;
  is_active: boolean;
  sort_order: number;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  notification_type_id: string | null;
  notification_slug: string;
  title: string;
  body: string | null;
  priority: NotificationPriority;
  entity_type: EntityType | null;
  entity_id: string | null;
  entity_label: string | null;
  action_url: string | null;
  archived_at: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

export interface NotificationTypeWithPreference extends NotificationType {
  notification_preferences: Pick<
    NotificationPreference,
    "email_enabled" | "in_app_enabled"
  >[];
}

/**
 * Helper to query notification tables that exist in Supabase but are not yet
 * included in the generated TypeScript types file (lib/supabase/types.ts).
 *
 * When the types are regenerated to include the notification tables, this
 * helper can be removed and the tables can be accessed directly.
 */

export function nq(supabase: SupabaseClient<any>) {
  return {
    
    notifications: () => supabase.from("notifications" as any),
    
    notificationTypes: () => supabase.from("notification_types" as any),
    
    notificationPreferences: () => supabase.from("notification_preferences" as any),
    rpc: (fn: string, params?: Record<string, unknown>) =>
      
      supabase.rpc(fn as any, params as any),
  };
}

// Priority color helpers
export function getPriorityColor(priority: NotificationPriority) {
  switch (priority) {
    case "urgent":
      return { dot: "bg-red-500", badge: "bg-red-100 text-red-800", border: "border-l-red-500" };
    case "high":
      return { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800", border: "border-l-amber-500" };
    case "normal":
      return { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600", border: "border-l-gray-300" };
    case "low":
      return { dot: "bg-gray-300", badge: "bg-gray-50 text-gray-500", border: "border-l-gray-200" };
  }
}

// Category display name mapping
export const categoryDisplayNames: Record<NotificationCategory, string> = {
  lending: "Lending",
  investments: "Investments",
  crm: "CRM",
  operations: "Operations",
  system: "System",
};

// Role-specific dashboard fallbacks
const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: "/pipeline",
  admin: "/pipeline",
  borrower: "/b/dashboard",
  investor: "/i/dashboard",
};

/**
 * Resolves the correct route for a notification based on entity_type, entity_id,
 * and the user's active role. Falls back to action_url, then to the role dashboard.
 */
export function getNotificationRoute(
  notification: Pick<Notification, "entity_type" | "entity_id" | "action_url">,
  activeRole: string
): string {
  const { entity_type, entity_id, action_url } = notification;
  const isAdmin = activeRole === "admin" || activeRole === "super_admin";

  if (entity_type && entity_id) {
    switch (entity_type) {
      case "loan":
        if (activeRole === "borrower") return `/b/loans/${entity_id}`;
        return `/pipeline/${entity_id}?tab=notes`;

      case "borrower":
        if (isAdmin) return `/borrowers/${entity_id}`;
        return ROLE_DASHBOARDS[activeRole] ?? "/b/dashboard";

      case "investor":
        if (isAdmin) return `/investors/${entity_id}`;
        return ROLE_DASHBOARDS[activeRole] ?? "/i/dashboard";

      case "fund":
        if (activeRole === "investor") return `/i/funds/${entity_id}`;
        return `/funds/${entity_id}`;

      case "condition": {
        // Conditions belong to loans — try to extract loan_id from the stored action_url
        const loanMatch = action_url?.match(/\/loans\/([0-9a-f-]+)/i);
        if (loanMatch) {
          const loanId = loanMatch[1];
          if (activeRole === "borrower") return `/b/loans/${loanId}`;
          return `/pipeline/${loanId}?condition=${entity_id}`;
        }
        if (isAdmin) return "/conditions";
        return ROLE_DASHBOARDS[activeRole] ?? "/pipeline";
      }

      case "draw_request":
        if (activeRole === "borrower") return "/b/draws";
        return "/servicing";

      case "payment":
        if (activeRole === "borrower") return "/b/payments";
        return "/servicing";

      case "contact":
        if (isAdmin) return `/crm/${entity_id}?tab=notes`;
        return ROLE_DASHBOARDS[activeRole] ?? "/pipeline";

      case "company":
        if (isAdmin) return `/crm/companies/${entity_id}?tab=notes`;
        return ROLE_DASHBOARDS[activeRole] ?? "/pipeline";

      case "task":
      case "project":
        if (isAdmin) return "/tasks";
        return ROLE_DASHBOARDS[activeRole] ?? "/pipeline";
    }
  }

  // If action_url exists, try to adapt it to the user's role
  if (action_url) {
    if (isAdmin) return action_url;

    // Convert admin-prefixed routes to role-specific routes where possible
    if (action_url.startsWith("/servicing/") && activeRole === "borrower") {
      return action_url.replace("/servicing/", "/b/loans/").split("?")[0];
    }
    if (action_url.startsWith("/funds/") && activeRole === "investor") {
      return action_url.replace("/funds/", "/i/funds/");
    }

    // If the action_url starts with a role prefix the user can't access, redirect to dashboard
    if (action_url.startsWith("/") && !isAdmin) {
      return ROLE_DASHBOARDS[activeRole] ?? "/b/dashboard";
    }

    return action_url;
  }

  return ROLE_DASHBOARDS[activeRole] ?? "/pipeline";
}

// Relative time formatting
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
