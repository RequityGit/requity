import { PageHeader } from "@/components/shared/page-header";
import { getEffectiveAuth, getInvestorId } from "@/lib/impersonation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Landmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import { InvestmentTabs } from "@/components/investor/investment-tabs";

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
  const { supabase, userId } = await getEffectiveAuth();

  // Resolve auth user ID → investors.id
  const investorId = await getInvestorId(supabase, userId);

  const { data: rawCommitments } = investorId
    ? await supabase
        .from("investor_commitments")
        .select("*, funds(*)")
        .eq("investor_id", investorId)
        .order("commitment_date", { ascending: false })
    : { data: null };

  const commitments =
    (rawCommitments as unknown as CommitmentWithFund[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Investments"
        description="View details on the investments you are invested in."
      />

      <InvestmentTabs />

      {commitments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Landmark className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">
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
                href={`/i/funds/${fund.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full p-2 bg-primary/5">
                          <Landmark className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {fund.name}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {fund.fund_type?.replace(/_/g, " ") ?? "Investment"}
                            {fund.vintage_year
                              ? ` - Vintage ${fund.vintage_year}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={fund.status} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Committed
                        </p>
                        <p className="num font-medium">
                          {formatCurrency(commitment.commitment_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Funded</p>
                        <p className="num font-medium">
                          {formatCurrency(commitment.funded_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Unfunded
                        </p>
                        <p className="num font-medium">
                          {formatCurrency(commitment.unfunded_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Funding Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Funding Progress</span>
                        <span className="num">{pctFunded}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(pctFunded, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {fund.irr_target && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Target IRR: <span className="num">{formatPercent(fund.irr_target)}</span>
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
