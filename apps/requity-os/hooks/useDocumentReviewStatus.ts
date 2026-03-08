import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useDocumentReviewStatus(dealId: string) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!dealId) return;

    const channel = supabase
      .channel(`doc-review-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "document_reviews",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          // When any review status changes for this deal, refresh the page data
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase, router]);
}
