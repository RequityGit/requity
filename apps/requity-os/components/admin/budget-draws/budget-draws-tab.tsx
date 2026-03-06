"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardHat, Hammer, FileText, ScrollText } from "lucide-react";
import { BudgetSubTab } from "./budget-sub-tab";
import { DrawsSubTab } from "./draws-sub-tab";
import { ChangeOrdersSubTab } from "./change-orders-sub-tab";
import { AuditLogSubTab } from "./audit-log-sub-tab";
import type {
  ConstructionBudget,
  BudgetLineItem,
  DrawRequest,
  DrawRequestLineItem,
  BudgetChangeRequest,
  BudgetChangeRequestLineItem,
  BudgetLineItemHistory,
} from "./types";

interface BudgetDrawsTabProps {
  loanId: string;
  budget: ConstructionBudget | null;
  budgetLineItems: BudgetLineItem[];
  drawRequests: DrawRequest[];
  drawRequestLineItems: DrawRequestLineItem[];
  changeRequests: BudgetChangeRequest[];
  changeRequestLineItems: BudgetChangeRequestLineItem[];
  auditLog: BudgetLineItemHistory[];
  currentUserId: string;
  totalUnits?: number;
}

export function BudgetDrawsTab({
  loanId,
  budget,
  budgetLineItems,
  drawRequests,
  drawRequestLineItems,
  changeRequests,
  changeRequestLineItems,
  auditLog,
  currentUserId,
  totalUnits = 1,
}: BudgetDrawsTabProps) {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState("budget");

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const pendingDraws = drawRequests.filter(
    (d) => d.status === "submitted" || d.status === "under_review"
  ).length;
  const pendingCOs = changeRequests.filter((c) => c.status === "pending").length;

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="budget" className="gap-1.5">
          <HardHat className="h-3.5 w-3.5" />
          Budget
        </TabsTrigger>
        <TabsTrigger value="draws" className="gap-1.5">
          <Hammer className="h-3.5 w-3.5" />
          Draws
          {pendingDraws > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5">
              {pendingDraws}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="change-orders" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Change Orders
          {pendingCOs > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5">
              {pendingCOs}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="audit-log" className="gap-1.5">
          <ScrollText className="h-3.5 w-3.5" />
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="budget" className="mt-4">
        <BudgetSubTab
          loanId={loanId}
          budget={budget}
          lineItems={budgetLineItems}
          totalUnits={totalUnits}
          currentUserId={currentUserId}
          onRefresh={refresh}
        />
      </TabsContent>

      <TabsContent value="draws" className="mt-4">
        <DrawsSubTab
          loanId={loanId}
          budget={budget}
          budgetLineItems={budgetLineItems}
          drawRequests={drawRequests}
          drawRequestLineItems={drawRequestLineItems}
          currentUserId={currentUserId}
          onRefresh={refresh}
        />
      </TabsContent>

      <TabsContent value="change-orders" className="mt-4">
        <ChangeOrdersSubTab
          loanId={loanId}
          budget={budget}
          budgetLineItems={budgetLineItems}
          changeRequests={changeRequests}
          changeRequestLineItems={changeRequestLineItems}
          currentUserId={currentUserId}
          onRefresh={refresh}
        />
      </TabsContent>

      <TabsContent value="audit-log" className="mt-4">
        <AuditLogSubTab
          auditLog={auditLog}
          drawRequests={drawRequests}
        />
      </TabsContent>
    </Tabs>
  );
}
