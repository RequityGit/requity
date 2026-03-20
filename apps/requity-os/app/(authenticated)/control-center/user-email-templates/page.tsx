import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserEmailTemplateListPage } from "@/components/control-center/user-email-templates/TemplateListPage";
import { fetchUserEmailTemplatesAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ControlCenterUserEmailTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await fetchUserEmailTemplatesAction();
  const templates = "success" in result ? result.templates : [];

  return <UserEmailTemplateListPage initialTemplates={templates} />;
}
