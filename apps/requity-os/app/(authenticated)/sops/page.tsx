import { createClient } from "@/lib/supabase/server";
import { sopServerClient } from "@/lib/sops/server";
import { redirect } from "next/navigation";
import { SOPsLandingClient } from "./sops-landing-client";

export default async function SOPsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user profile for role check
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, allowed_roles")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Failed to fetch profile:", profileError.message);
    throw new Error("Unable to load SOP profile");
  }

  const isAdmin =
    profile?.role === "admin" || profile?.role === "super_admin";

  const sop = sopServerClient();

  // Fetch categories
  const { data: categories, error: categoriesError } = await sop
    .from("sop_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (categoriesError) {
    console.error("Failed to fetch SOP categories:", categoriesError.message);
    throw new Error("Unable to load SOP categories");
  }

  // Fetch published SOPs (for counts and recent list)
  const { data: sops, error: sopsError } = await sop
    .from("sops")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (sopsError) {
    console.error("Failed to fetch SOPs:", sopsError.message);
    throw new Error("Unable to load SOPs");
  }

  // Admin-only counts
  let openFlagCount = 0;
  let uncoveredQuestionCount = 0;
  if (isAdmin) {
    const { count: flagCount, error: flagCountError } = await sop
      .from("sop_staleness_flags")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    if (flagCountError) {
      console.error("Failed to fetch SOP flag count:", flagCountError.message);
      throw new Error("Unable to load SOP flag count");
    }

    openFlagCount = flagCount ?? 0;

    const { count: qCount, error: qCountError } = await sop
      .from("sop_questions_log")
      .select("*", { count: "exact", head: true })
      .or("matched_sop_ids.is.null,matched_sop_ids.eq.{}");

    if (qCountError) {
      console.error("Failed to fetch uncovered SOP questions:", qCountError.message);
      throw new Error("Unable to load SOP question metrics");
    }

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
