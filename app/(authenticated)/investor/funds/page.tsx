import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Landmark, ArrowRight } from "lucide-react";
import Link from "next/link";

type CommitmentWithFund = {
  id: string;
  fund_id: string;
  commitment_amount: number;
  funded_amount: number;
  unfunded_amount: number;
  commitment_date: string | null;
  status: string;
  funds: {
    id: string;
    name: string;
    fund_type: string | null;
    status: string;
    vintage_year: number | null;
    irr_target: number | null;
    current_aum: number;
    target_size: number | null;
  } | null;
};

export default async function InvestorFundsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawCommitments } = await supabase
    .from("investor_commitments")
    .select("*, funds(*)")
    .eq("investor_id", user.id)
    .order("commitment_date", { ascending: false });

  const commitments =
    (rawCommitments as unknown as CommitmentWithFund[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Investments"
        description="View details on the investments you are invested in."
      />

      {commitments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-surface-muted">
            <Landmark className="h-12 w-12 mx-auto mb-3 text-surface-muted" />
            <p className="text-lg font-medium text-surface-white">
              No investment commitments found
            </p>
            <p className="text-sm mt-1">
              Contact your administrator for more information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {commitments.map((commitment) => {
            const fund = commitment.funds;
            if (!fund) return null;

            const pctFunded =
              commitment.commitment_amount > 0
                ? Math.round(
                    (commitment.funded_amount / commitment.commitment_amount) *
                      100
                  )
                : 0;

            return (
              <Link
                key={commitment.id}
                href={`/investor/funds/${fund.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full p-2 bg-navy/5">
                          <Landmark className="h-5 w-5 text-surface-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-surface-white">
                            {fund.name}
                          </h3>
                          <p className="text-xs text-surface-muted capitalize">
                            {fund.fund_type?.replace(/_/g, " ") ?? "Investment"}
                            {fund.vintage_year
                              ? ` - Vintage ${fund.vintage_year}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={fund.status} />
                        <ArrowRight className="h-4 w-4 text-surface-muted" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-surface-muted text-xs">
                          Committed
                        </p>
                        <p className="font-medium">
                          {formatCurrency(commitment.commitment_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-surface-muted text-xs">Funded</p>
                        <p className="font-medium">
                          {formatCurrency(commitment.funded_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-surface-muted text-xs">
                          Unfunded
                        </p>
                        <p className="font-medium">
                          {formatCurrency(commitment.unfunded_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Funding Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-surface-muted mb-1">
                        <span>Funding Progress</span>
                        <span>{pctFunded}%</span>
                      </div>
                      <div className="w-full bg-navy-mid rounded-full h-2">
                        <div
                          className="bg-navy h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(pctFunded, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {fund.irr_target && (
                      <p className="text-xs text-surface-muted mt-3">
                        Target IRR: {formatPercent(fund.irr_target)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
