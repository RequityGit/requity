/**
 * Client-side helper to get a Supabase query builder for SOP-related tables
 * that aren't yet in the generated TypeScript types.
 */

import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = any;

/** Client-side Supabase client that can query SOP tables */
export function sopClient(): UntypedClient {
  return createBrowserSupabase();
}
