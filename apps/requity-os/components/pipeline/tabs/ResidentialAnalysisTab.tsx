"use client";

import { useState, useMemo } from "react";
import { PillNav } from "@/components/pipeline/tabs/financials/shared";
import { DealAnalysisSection } from "./residential/DealAnalysisSection";
import { BorrowerEligibilitySection } from "./residential/BorrowerEligibilitySection";
import { CostsReturnsSection } from "./residential/CostsReturnsSection";
import { CompAnalysisSection } from "./residential/CompAnalysisSection";
import {
  BarChart3,
  DollarSign,
  Users,
  Building2,
} from "lucide-react";
import type { DealType, ResidentialDealInputs } from "@/lib/residential-uw/types";

type SubTabKey = "deal_analysis" | "borrower" | "costs" | "comps";

const SUB_TABS = [
  { key: "deal_analysis" as const, label: "Deal Analysis", icon: BarChart3 },
  { key: "borrower" as const, label: "Borrower & Eligibility", icon: Users },
  { key: "costs" as const, label: "Costs & Returns", icon: DollarSign },
  { key: "comps" as const, label: "Comp Analysis", icon: Building2 },
] as const;

interface ResidentialAnalysisTabProps {
  dealId: string;
  uwData: Record<string, unknown>;
}

export function ResidentialAnalysisTab({
  dealId,
  uwData,
}: ResidentialAnalysisTabProps) {
  const [activeTab, setActiveTab] = useState<SubTabKey>("deal_analysis");
  const [dealType, setDealType] = useState<DealType>("rtl");

  // Parse uw_data into ResidentialDealInputs
  const dealInputs = useMemo((): ResidentialDealInputs => {
    return {
      purchase_price: Number(uwData.purchase_price) || 0,
      after_repair_value: Number(uwData.after_repair_value) || 0,
      appraised_value: Number(uwData.appraised_value),
      rehab_budget: Number(uwData.rehab_budget) || 0,
      loan_amount: Number(uwData.loan_amount) || 0,
      loan_term_months: Number(uwData.loan_term_months) || 360,
      interest_rate: Number(uwData.interest_rate),
      origination_pts: Number(uwData.origination_pts),
      holding_period_months: Number(uwData.holding_period_months) || 6,
      projected_sale_price: Number(uwData.projected_sale_price),
      sales_disposition_pct: Number(uwData.sales_disposition_pct),
      monthly_rent: Number(uwData.monthly_rent) || 0,
      annual_property_tax: Number(uwData.annual_property_tax) || 0,
      annual_insurance: Number(uwData.annual_insurance) || 0,
      monthly_hoa: Number(uwData.monthly_hoa),
      monthly_utilities: Number(uwData.monthly_utilities),
      operating_expenses: Number(uwData.operating_expenses),
      fico_score: Number(uwData.fico_score),
      net_worth: Number(uwData.net_worth),
      liquid_reserves: Number(uwData.liquid_reserves),
      real_estate_experience_years: Number(uwData.real_estate_experience_years),
      is_us_citizen: uwData.is_us_citizen === true,
    };
  }, [uwData]);

  return (
    <div className="space-y-5">
      {/* Sub-tab Navigation */}
      <PillNav<SubTabKey>
        tabs={SUB_TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "deal_analysis" && (
        <DealAnalysisSection
          dealInputs={dealInputs}
          dealType={dealType}
          onDealTypeChange={setDealType}
        />
      )}

      {activeTab === "borrower" && <BorrowerEligibilitySection />}

      {activeTab === "costs" && <CostsReturnsSection />}

      {activeTab === "comps" && <CompAnalysisSection />}
    </div>
  );
}
