import { ControlCenterLanding } from "./_components/control-center-landing";

// ---------------------------------------------------------------------------
// KPI stat fetches preserved (commented out) — may be needed elsewhere later.
//
// import { createClient } from "@/lib/supabase/server";
// import { createAdminClient } from "@/lib/supabase/admin";
//
// const admin = createAdminClient();
// const [profilesResult, profilesByStatusResult, rolesResult, loansResult, templatesResult] =
//   await Promise.all([
//     admin.from("profiles").select("*", { count: "exact", head: true }),
//     admin.from("profiles").select("activation_status"),
//     admin.from("user_roles").select("role").eq("is_active", true),
//     admin.from("loans").select("*", { count: "exact", head: true }).is("deleted_at", null),
//     admin.from("loan_condition_templates").select("category").eq("is_active", true),
//   ]);
// ---------------------------------------------------------------------------

export default function ControlCenterOverview() {
  return <ControlCenterLanding />;
}
