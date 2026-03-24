"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
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
}

export function CollapsibleInvestorSection(props: Props) {
  const { commitments } = props;

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

  return (
    <CollapsibleSectionCard
      icon={TrendingUp}
      title="Investor"
      summary={summary || undefined}
      count={commitments.length || undefined}
    >
      <DetailInvestorTab {...props} />
    </CollapsibleSectionCard>
  );
}
