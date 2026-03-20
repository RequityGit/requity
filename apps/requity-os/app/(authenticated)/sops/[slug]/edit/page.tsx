import { createClient } from "@/lib/supabase/server";
import { sopServerClient } from "@/lib/sops/server";
import { redirect, notFound } from "next/navigation";
import { SOPEditor } from "@/components/sops/SOPEditor";

interface SOPEditPageProps {
  params: { slug: string };
}

export default async function SOPEditPage({ params }: SOPEditPageProps) {
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

  // Fetch the SOP
  const { data: sop, error } = await sop_db
    .from("sops")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !sop) notFound();

  // Fetch categories
  const { data: categories } = await sop_db
    .from("sop_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <SOPEditor
      sop={sop}
      categories={categories ?? []}
      userId={user.id}
    />
  );
}
