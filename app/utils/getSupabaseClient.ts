import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient(accessToken?: string) {
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    ...(accessToken
      ? {
          global: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        }
      : {}),
  });
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
