// Email lookup: checks crm_contacts on email blur for external pre-fill

import { createClient } from "@/lib/supabase/client";
import type { ContactLookupResult } from "./types";

export async function lookupContactByEmail(
  email: string
): Promise<ContactLookupResult> {
  if (!email || !email.includes("@")) {
    return { found: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const { data, error } = await supabase.rpc("lookup_contact_by_email", {
    p_email: email,
  });

  if (error) {
    console.error("Email lookup failed:", error.message);
    return { found: false };
  }

  return (data as ContactLookupResult) ?? { found: false };
}
