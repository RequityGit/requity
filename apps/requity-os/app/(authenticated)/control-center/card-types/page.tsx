import { createAdminClient } from "@/lib/supabase/admin";
import type { UnifiedCardType } from "@/components/pipeline-v2/pipeline-types";
import { CardTypeManagerView } from "./CardTypeManagerView";

export const dynamic = "force-dynamic";

export default async function CardTypesPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("unified_card_types" as never)
    .select("*" as never)
    .order("sort_order" as never);

  const cardTypes = (data ?? []) as unknown as UnifiedCardType[];

  return <CardTypeManagerView initialCardTypes={cardTypes} />;
}
