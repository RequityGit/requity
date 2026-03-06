import { createClient } from "@/lib/supabase/server";
import { sopServerClient } from "@/lib/sops/server";
import { redirect, notFound } from "next/navigation";
import { SOPDetailClient } from "./sop-detail-client";

interface SOPDetailPageProps {
  params: { slug: string };
}

export default async function SOPDetailPage({ params }: SOPDetailPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, allowed_roles")
    .eq("id", user.id)
    .single();

  const isAdmin =
    profile?.role === "admin" || profile?.role === "super_admin";

  const sop_db = sopServerClient();

  // Fetch the SOP by slug
  const { data: sop, error } = await sop_db
    .from("sops")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !sop) notFound();

  // Non-admins can only see published SOPs
  if (!isAdmin && sop.status !== "published") notFound();

  // Fetch the category
  let categoryName: string | null = null;
  if (sop.category_id) {
    const { data: cat } = await sop_db
      .from("sop_categories")
      .select("name")
      .eq("id", sop.category_id)
      .single();
    categoryName = cat?.name ?? null;
  }

  // Fetch version history
  const { data: versions } = await sop_db
    .from("sop_versions")
    .select("*")
    .eq("sop_id", sop.id)
    .order("version_number", { ascending: false });

  // Fetch related SOPs (same category, excluding current)
  let relatedSops: { id: string; title: string; slug: string }[] = [];
  if (sop.category_id) {
    const { data: related } = await sop_db
      .from("sops")
      .select("id, title, slug")
      .eq("category_id", sop.category_id)
      .eq("status", "published")
      .neq("id", sop.id)
      .limit(5);
    relatedSops = related ?? [];
  }

  return (
    <SOPDetailClient
      sop={sop}
      categoryName={categoryName}
      versions={versions ?? []}
      relatedSops={relatedSops}
      isAdmin={isAdmin}
    />
  );
}
