import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { InvestorDashboardClient } from "./client";

type CommitmentWithFund = {
  id: string;
  commitment_amount: number;
  funded_amount: number;
  unfunded_amount: number;
  status: string;
  funds: { name: string } | null;
};

type DistributionRow = {
  id: string;
  amount: number;
  distribution_date: string;
  distribution_type: string | null;
  status: string;
  funds: { name: string } | null;
};

export default async function InvestorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const [commitmentsResult, distributionsResult, ytdResult] = await Promise.all([
    supabase
      .from("investor_commitments")
      .select("*, funds(name)")
      .eq("investor_id", user.id),
    supabase
      .from("distributions")
      .select("*, funds(name)")
      .eq("investor_id", user.id)
      .order("distribution_date", { ascending: false })
      .limit(10),
    supabase
      .from("distributions")
      .select("amount")
      .eq("investor_id", user.id)
      .gte("distribution_date", `${new Date().getFullYear()}-01-01`),
  ]);

  const commitments = (commitmentsResult.data as unknown as CommitmentWithFund[]) ?? [];
  const distributions = (distributionsResult.data as unknown as DistributionRow[]) ?? [];

  const totalCommitted = commitments.reduce(
    (sum, c) => sum + (c.commitment_amount ?? 0), 0
  );
  const totalFunded = commitments.reduce(
    (sum, c) => sum + (c.funded_amount ?? 0), 0
  );
  const ytdTotal = ((ytdResult.data as unknown as Array<{ amount: number }>) ?? []).reduce(
    (sum, d) => sum + (d.amount ?? 0), 0
  );

  const firstName = profile?.full_name?.split(" ")[0] ?? "Investor";

  return (
    <InvestorDashboardClient
      firstName={firstName}
      totalCommitted={formatCurrency(totalCommitted)}
      totalFunded={formatCurrency(totalFunded)}
      ytdDistributions={formatCurrency(ytdTotal)}
      commitmentCount={commitments.length}
      commitments={commitments.map((c) => ({
        id: c.id,
        fundName: c.funds?.name ?? "Investment",
        committed: c.commitment_amount,
        funded: c.funded_amount,
        status: c.status,
      }))}
      recentDistributions={distributions.map((d) => ({
        id: d.id,
        amount: d.amount,
        date: d.distribution_date,
        type: d.distribution_type ?? "income",
        fundName: d.funds?.name ?? "Investment",
        status: d.status,
      }))}
    />
  );
}
