"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { MonoValue } from "./shared";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { LoanData, InvestorCommitmentData, RelationshipType } from "./types";
import { RELATIONSHIP_BADGE_COLORS } from "./types";

interface StatItem {
  label: string;
  value: string;
}

function getStatsForRelationship(
  type: string,
  loans: LoanData[],
  commitments: InvestorCommitmentData[]
): StatItem[] {
  switch (type) {
    case "borrower": {
      const totalVolume = loans.reduce(
        (sum, l) => sum + (l.loan_amount || 0),
        0
      );
      const rates = loans
        .map((l) => l.interest_rate)
        .filter((r): r is number => r != null);
      const avgRate =
        rates.length > 0
          ? rates.reduce((a, b) => a + b, 0) / rates.length
          : 0;
      const activeCount = loans.filter(
        (l) =>
          l.stage &&
          !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
      ).length;
      return [
        { label: "Total Volume", value: formatCurrency(totalVolume) },
        { label: "Avg Rate", value: avgRate > 0 ? formatPercent(avgRate) : "—" },
        { label: "Loans", value: String(loans.length) },
        {
          label: "Status",
          value: activeCount > 0 ? `${activeCount} Active` : "No active",
        },
      ];
    }
    case "investor": {
      const totalInvested = commitments.reduce(
        (sum, c) => sum + (c.commitment_amount || 0),
        0
      );
      const totalFunded = commitments.reduce(
        (sum, c) => sum + (c.funded_amount || 0),
        0
      );
      const activeCount = commitments.filter(
        (c) => c.status === "active"
      ).length;
      return [
        { label: "Total Committed", value: formatCurrency(totalInvested) },
        { label: "Total Funded", value: formatCurrency(totalFunded) },
        { label: "Commitments", value: String(commitments.length) },
        {
          label: "Status",
          value: activeCount > 0 ? `${activeCount} Active` : "No active",
        },
      ];
    }
    case "lender": {
      const fundedLoans = loans.filter(
        (l) => l.stage === "funded" || l.stage === "servicing"
      );
      const totalFunded = fundedLoans.reduce(
        (sum, l) => sum + (l.loan_amount || 0),
        0
      );
      const rates = fundedLoans
        .map((l) => l.interest_rate)
        .filter((r): r is number => r != null);
      const avgRate =
        rates.length > 0
          ? rates.reduce((a, b) => a + b, 0) / rates.length
          : 0;
      return [
        { label: "Total Funded", value: formatCurrency(totalFunded) },
        { label: "Active Loans", value: String(fundedLoans.length) },
        { label: "Avg Rate", value: avgRate > 0 ? formatPercent(avgRate) : "—" },
        { label: "Status", value: fundedLoans.length > 0 ? "Active" : "Inactive" },
      ];
    }
    case "broker": {
      return [
        { label: "Total Referred", value: String(loans.length) },
        { label: "Conversion Rate", value: "—" },
        { label: "Deals", value: String(loans.length) },
        { label: "Status", value: loans.length > 0 ? "Active" : "Inactive" },
      ];
    }
    default:
      return [];
  }
}

interface RelationshipStatsProps {
  primaryRelationship: string | null;
  activeRelationships: string[];
  loans: LoanData[];
  investorCommitments: InvestorCommitmentData[];
}

export function RelationshipStats({
  primaryRelationship,
  activeRelationships,
  loans,
  investorCommitments,
}: RelationshipStatsProps) {
  const [selectedRel, setSelectedRel] = useState(
    primaryRelationship || activeRelationships[0]
  );
  const [showDropdown, setShowDropdown] = useState(false);

  const stats = useMemo(
    () => getStatsForRelationship(selectedRel, loans, investorCommitments),
    [selectedRel, loans, investorCommitments]
  );

  if (!selectedRel || stats.length === 0) return null;

  const hasMultiple =
    activeRelationships.filter((r) =>
      ["borrower", "investor", "lender", "broker"].includes(r)
    ).length > 1;

  const colors = RELATIONSHIP_BADGE_COLORS[selectedRel];

  return (
    <div className="space-y-2">
      {hasMultiple && (
        <div className="flex items-center gap-2 relative">
          <span className="text-xs text-muted-foreground font-medium">
            Showing stats for:
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs rounded-lg border-border h-7"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: colors?.dot || "#9A9A9A" }}
            />
            {selectedRel.charAt(0).toUpperCase() + selectedRel.slice(1)}
            <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
          </Button>
          {showDropdown && (
            <div className="absolute top-full left-24 mt-1 z-10 bg-card border border-border rounded-lg shadow-sm py-1">
              {activeRelationships
                .filter((r) =>
                  ["borrower", "investor", "lender", "broker"].includes(r)
                )
                .map((rel) => {
                  const relColors = RELATIONSHIP_BADGE_COLORS[rel];
                  return (
                    <button
                      key={rel}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted w-full text-left"
                      onClick={() => {
                        setSelectedRel(rel);
                        setShowDropdown(false);
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: relColors?.dot || "#9A9A9A",
                        }}
                      />
                      {rel.charAt(0).toUpperCase() + rel.slice(1)}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="rounded-xl border-border bg-card"
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {stat.label}
              </p>
              <MonoValue className="text-lg font-semibold text-foreground">
                {stat.value}
              </MonoValue>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
