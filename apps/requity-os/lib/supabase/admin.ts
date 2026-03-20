import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { SUPABASE_URL } from "@/lib/supabase/constants";

export function createAdminClient() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }

  return createClient<Database>(SUPABASE_URL, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
