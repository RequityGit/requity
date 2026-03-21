"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollapsibleSectionCard } from "./collapsible-section-card";
import { DetailInvestorTab } from "../tabs/detail-investor-tab";
import { formatCurrency } from "@repo/lib";
import type {
  ContactData,
  InvestorProfileData,
  InvestorCommitmentData,
  EntityData,
  SectionLayout,
  FieldLayout,
} from "../types";

interface Props {
  contact: ContactData;
  investor: InvestorProfileData;
  commitments: InvestorCommitmentData[];
  entities: EntityData[];
  isSuperAdmin: boolean;
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  loading?: boolean;
  commitmentCount: number;
}

export function CollapsibleInvestorSection(props: Props) {
  const { commitments, loading = false, commitmentCount, ...tabProps } = props;

  const summary = useMemo(() => {
    const parts: string[] = [];
    const totalCommitted = commitments.reduce((s, c) => s + (c.commitment_amount ?? 0), 0);
    const totalFunded = commitments.reduce((s, c) => s + (c.funded_amount ?? 0), 0);
    const activeCount = commitments.filter((c) => c.status === "active").length;
    if (totalCommitted > 0) parts.push(`${formatCurrency(totalCommitted)} Committed`);
    if (totalFunded > 0) parts.push(`${formatCurrency(totalFunded)} Funded`);
    if (activeCount > 0) parts.push(`${activeCount} Active`);
    return parts.join("  ·  ");
  }, [commitments]);

  const countBadge = loading ? commitmentCount : commitments.length;

  return (
    <CollapsibleSectionCard
      icon={TrendingUp}
      title="Investor"
      summary={summary || undefined}
      count={countBadge || undefined}
    >
      {loading && commitments.length === 0 ? (
        <div className="px-5 pb-5 space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : (
        <DetailInvestorTab {...tabProps} commitments={commitments} />
      )}
    </CollapsibleSectionCard>
  );
}
