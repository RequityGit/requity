import { createClient } from "@/lib/supabase/server";
import { sopServerClient } from "@/lib/sops/server";
import { redirect } from "next/navigation";
import { SOPAdminClient } from "./sop-admin-client";

export default async function SOPAdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/sops");
  }

  const sop_db = sopServerClient();

  // Metrics
  const { count: totalPublished } = await sop_db
    .from("sops")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { count: questionsAsked } = await sop_db
    .from("sop_questions_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo);

  const { count: unansweredQuestions } = await sop_db
    .from("sop_questions_log")
    .select("*", { count: "exact", head: true })
    .or("matched_sop_ids.is.null,matched_sop_ids.eq.{}");

  const { count: openFlags } = await sop_db
    .from("sop_staleness_flags")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  // Staleness flags with SOP titles
  const { data: flags } = await sop_db
    .from("sop_staleness_flags")
    .select("*, sops(title, slug)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  // Questions without SOP coverage
  const { data: uncoveredQuestions } = await sop_db
    .from("sop_questions_log")
    .select("*")
    .or("matched_sop_ids.is.null,matched_sop_ids.eq.{}")
    .order("created_at", { ascending: false })
    .limit(50);

  // Most viewed SOPs (from activity log)
  const { data: activityViews } = await sop_db
    .from("portal_activity_log")
    .select("page_path, metadata")
    .eq("action_type", "page_view")
    .like("page_path", "/sops/%")
    .limit(500);

  // Count views per SOP path
  const viewCounts: Record<string, number> = {};
  activityViews?.forEach((a: { page_path: string; metadata: unknown }) => {
    const path = a.page_path;
    if (path && path !== "/sops" && path !== "/sops/admin" && path !== "/sops/new") {
      viewCounts[path] = (viewCounts[path] || 0) + 1;
    }
  });
  const topViewed = Object.entries(viewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({
      path,
      slug: path.replace("/sops/", "").split("/")[0],
      count,
    }));

  return (
    <SOPAdminClient
      totalPublished={totalPublished ?? 0}
      questionsAsked={questionsAsked ?? 0}
      unansweredQuestions={unansweredQuestions ?? 0}
      openFlagCount={openFlags ?? 0}
      flags={flags ?? []}
      uncoveredQuestions={uncoveredQuestions ?? []}
      topViewed={topViewed}
    />
  );
}
