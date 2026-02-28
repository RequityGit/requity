import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalHubPage } from "./portal-hub";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <PortalHubPage
      userName={profile?.full_name || ""}
      email={profile?.email || user.email || ""}
    />
  );
}
