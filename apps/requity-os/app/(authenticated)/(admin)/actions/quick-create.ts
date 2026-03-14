"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchQuickCreateData() {
  const admin = createAdminClient();

  const [teamRes, cardTypeRes] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url").order("full_name"),
    admin.from("unified_card_types" as never).select("*").eq("status" as never, "active" as never).order("sort_order" as never),
  ]);

  return {
    teamMembers: (teamRes.data ?? []) as { id: string; full_name: string; avatar_url: string | null }[],
    cardTypes: cardTypeRes.data ?? [],
  };
}
