import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Revalidate only the deal detail page (UUID and deal_number slugs).
 * Does NOT revalidate /pipeline (the kanban). Use this for structural
 * changes on a deal (add/remove contacts, documents, etc.).
 *
 * For kanban-level changes (new deal, delete deal, stage move), use
 * revalidatePipeline() in pipeline/actions.ts instead.
 *
 * For inline field saves, do NOT call any revalidation. Rely on
 * optimistic local state updates only.
 */
export async function revalidateDealPaths(dealId: string) {
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
    // Non-critical -- UUID-based revalidation already ran
  }
}
