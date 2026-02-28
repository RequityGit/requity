import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BorrowerDashboardClient } from "./client";

export default async function BorrowerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [loansResult, paymentsResult] = await Promise.all([
    supabase
      .from("loans")
      .select("*")
      .eq("borrower_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("loan_payments")
      .select("*")
      .eq("borrower_id", user.id)
      .eq("status", "pending")
      .gte("due_date", new Date().toISOString().split("T")[0])
      .order("due_date", { ascending: true })
      .limit(1),
  ]);

  const loans = loansResult.data ?? [];
  const nextPayment = paymentsResult.data?.[0] ?? null;

  return (
    <BorrowerDashboardClient
      loans={loans}
      nextPayment={nextPayment}
    />
  );
}
