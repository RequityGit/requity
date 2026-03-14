import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Revalidate all cached paths for a deal (both UUID and deal_number slugs).
 * Call this from server actions after mutating deal data.
 */
export async function revalidateDealPaths(dealId: string) {
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${dealId}`);

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("unified_deals")
      .select("deal_number")
      .eq("id", dealId)
      .single();
    if (data?.deal_number) {
      revalidatePath(`/pipeline/${data.deal_number}`);
    }
  } catch {
    // Non-critical — UUID-based revalidation already ran
  }
}
