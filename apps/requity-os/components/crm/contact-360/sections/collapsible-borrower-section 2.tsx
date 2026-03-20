"use client";

import { useMemo } from "react";
import { Landmark } from "lucide-react";
import { CollapsibleSectionCard } from "./collapsible-section-card";
import { DetailBorrowerTab } from "../tabs/detail-borrower-tab";
import { formatCurrency } from "@repo/lib";
import type {
  ContactData,
  BorrowerData,
  LoanData,
  EntityData,
  SectionLayout,
  FieldLayout,
} from "../types";

interface Props {
  contact: ContactData;
  borrower: BorrowerData;
  loans: LoanData[];
  entities: EntityData[];
  isSuperAdmin: boolean;
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  primaryBorrowerEntity: Record<string, unknown> | null;
}

export function CollapsibleBorrowerSection(props: Props) {
  const { borrower, loans } = props;

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (borrower.credit_score) parts.push(`FICO ${borrower.credit_score}`);
    const activeLoans = loans.filter((l) => l.stage !== "closed" && l.stage !== "dead");
    if (activeLoans.length > 0) {
      parts.push(`${activeLoans.length} Active Loan${activeLoans.length !== 1 ? "s" : ""}`);
    }
    const volume = loans.reduce((sum, l) => sum + (l.loan_amount ?? 0), 0);
    if (volume > 0) parts.push(formatCurrency(volume));
    if (borrower.experience_count) parts.push(`${borrower.experience_count} Deals Exp`);
    return parts.join("  ·  ");
  }, [borrower, loans]);

  return (
    <CollapsibleSectionCard
      icon={Landmark}
      title="Borrower"
      summary={summary || undefined}
      count={loans.length || undefined}
    >
      <DetailBorrowerTab {...props} />
    </CollapsibleSectionCard>
  );
}
