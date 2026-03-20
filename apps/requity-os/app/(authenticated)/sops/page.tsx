import { createClient } from "@/lib/supabase/server";
import { sopServerClient } from "@/lib/sops/server";
import { redirect } from "next/navigation";
import { SOPsLandingClient } from "./sops-landing-client";

export default async function SOPsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user profile for role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, allowed_roles")
    .eq("id", user.id)
    .single();

  const isAdmin =
    profile?.role === "admin" || profile?.role === "super_admin";

  const sop = sopServerClient();

  // Fetch categories
  const { data: categories } = await sop
    .from("sop_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  // Fetch published SOPs (for counts and recent list)
  const { data: sops } = await sop
    .from("sops")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  // Admin-only counts
  let openFlagCount = 0;
  let uncoveredQuestionCount = 0;
  if (isAdmin) {
    const { count: flagCount } = await sop
      .from("sop_staleness_flags")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    openFlagCount = flagCount ?? 0;

    const { count: qCount } = await sop
      .from("sop_questions_log")
      .select("*", { count: "exact", head: true })
      .or("matched_sop_ids.is.null,matched_sop_ids.eq.{}");
    uncoveredQuestionCount = qCount ?? 0;
  }

  return (
    <SOPsLandingClient
      categories={categories ?? []}
      sops={sops ?? []}
      isAdmin={isAdmin}
      openFlagCount={openFlagCount}
      uncoveredQuestionCount={uncoveredQuestionCount}
    />
  );
}
