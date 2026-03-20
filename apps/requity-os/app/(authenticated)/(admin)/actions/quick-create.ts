"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchQuickCreateData() {
  const admin = createAdminClient();

  const teamRes = await admin
    .from("profiles")
    .select("id, full_name, avatar_url")
    .order("full_name");

  return {
    teamMembers: (teamRes.data ?? []) as { id: string; full_name: string; avatar_url: string | null }[],
  };
}
