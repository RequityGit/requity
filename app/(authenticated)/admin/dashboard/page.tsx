import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [loansResult, activityResult] = await Promise.all([
    supabase.from("loans").select("loan_amount, stage, updated_at, property_address"),
    supabase
      .from("loan_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const loans = loansResult.data ?? [];
  const activeLoans = loans.filter((l) =>
    ["funded", "servicing"].includes(l.stage)
  );
  const processingLoans = loans.filter((l) =>
    ["processing", "underwriting", "application"].includes(l.stage)
  );
  const totalPipeline = loans.reduce(
    (sum, l) => sum + (l.loan_amount || 0),
    0
  );

  const activities = (activityResult.data ?? []).map((a) => ({
    id: a.id,
    type: a.activity_type,
    description: a.description,
    timestamp: a.created_at,
  }));

  return (
    <AdminDashboardClient
      metrics={{
        activeLoans: activeLoans.length,
        totalPipeline: formatCurrency(totalPipeline),
        processingLoans: processingLoans.length,
        totalLoans: loans.length,
      }}
      activities={activities}
    />
  );
}
