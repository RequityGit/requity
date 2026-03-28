const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const SUPABASE_URL: string = supabaseUrl;
export const SUPABASE_ANON_KEY: string = supabaseAnonKey;

/** Base URL for Supabase Storage public assets. Use this instead of hardcoding the project URL. */
export const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

/** Cookie name used by @supabase/ssr for auth token (used to skip Supabase calls when no session). */
export const SUPABASE_AUTH_COOKIE_NAME = (() => {
  const hostname = new URL(SUPABASE_URL).hostname;
  const projectRef = hostname.split(".")[0];
  if (!projectRef) {
    throw new Error("Unable to derive Supabase auth cookie name from NEXT_PUBLIC_SUPABASE_URL.");
  }

  return `sb-${projectRef}-auth-token`;
})();
