import { createAdminClient } from "@/lib/supabase/admin";
import { FieldManagerView } from "./FieldManagerView";

export const dynamic = "force-dynamic";

export default async function FieldManagerPage() {
  const admin = createAdminClient();

  const { data: fieldConfigs } = await admin
    .from("field_configurations")
    .select("*")
    .order("module")
    .order("field_label", { ascending: true });

  return <FieldManagerView initialConfigs={fieldConfigs ?? []} />;
}
