/**
 * Server-side helper to get a Supabase query builder for SOP-related tables
 * that aren't yet in the generated TypeScript types.
 *
 * Only import this in server components / server actions.
 */

import { createClient as createServerSupabase } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = any;

/** Server-side Supabase client that can query SOP tables */
export function sopServerClient(): UntypedClient {
  return createServerSupabase();
}
