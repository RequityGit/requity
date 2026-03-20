import { createClient } from "@/lib/supabase/server";
import { sopServerClient } from "@/lib/sops/server";
import { redirect } from "next/navigation";
import { SOPEditor } from "@/components/sops/SOPEditor";

export default async function NewSOPPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Admin-only
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/sops");
  }

  const sop_db = sopServerClient();

  // Fetch categories
  const { data: categories } = await sop_db
    .from("sop_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <SOPEditor
      categories={categories ?? []}
      userId={user.id}
    />
  );
}
