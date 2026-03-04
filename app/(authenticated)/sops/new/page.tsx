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
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!adminRole) {
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
