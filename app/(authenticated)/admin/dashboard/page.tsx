import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchCEODashboardData } from "@/lib/dashboard-ceo.server";
import { CEODashboard } from "@/components/admin/dashboard/ceo-dashboard";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the user's profile for greeting
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || "there";

  // Fetch all dashboard data from Supabase
  const data = await fetchCEODashboardData();

  return <CEODashboard data={data} userName={userName} />;
}
