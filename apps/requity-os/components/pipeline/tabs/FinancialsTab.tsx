"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  Check,
  Loader2,
  FileSpreadsheet,
  Building2,
  Settings,
  Receipt,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createNewVersion,
  activateVersion,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { PillNav } from "./financials/shared";
import { RentRollSubTab } from "./financials/RentRollSubTab";
import { T12SubTab } from "./financials/T12SubTab";
import { AssumptionsSubTab } from "./financials/AssumptionsSubTab";
import { ClosingCostsSubTab } from "./financials/ClosingCostsSubTab";
import { ScopeOfWorkSubTab } from "./financials/ScopeOfWorkSubTab";

// ── Types ──

export interface CommercialUWData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeOfWork: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesUses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debt: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  waterfall: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allVersions: any[];
}

interface FinancialsTabProps {
  data: CommercialUWData;
  dealId: string;
  currentUserId: string;
}

const SUB_TABS = [
  { key: "rent-roll" as const, label: "Rent Roll", icon: Building2 },
  { key: "t12" as const, label: "T12 / Historical", icon: FileSpreadsheet },
  { key: "assumptions" as const, label: "Assumptions", icon: Settings },
  { key: "closing-costs" as const, label: "Closing Costs", icon: Receipt },
  { key: "scope" as const, label: "Scope of Work", icon: Hammer },
];

type SubTabKey = (typeof SUB_TABS)[number]["key"];

// ── Main Component ──

export function FinancialsTab({
  data,
  dealId,
  currentUserId,
}: FinancialsTabProps) {
  const { uw, income, expenses, rentRoll, sourcesUses, scopeOfWork, allVersions } = data;
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>("rent-roll");
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const handleNewVersion = useCallback(async () => {
    setCreatingVersion(true);
    try {
      const result = await createNewVersion(dealId, currentUserId);
      if (result.error) {
        toast.error(`Failed to create version: ${result.error}`);
      } else {
        toast.success(`Version ${result.data?.version} created`);
        router.refresh();
      }
    } finally {
      setCreatingVersion(false);
    }
  }, [dealId, currentUserId, router]);

  const handleActivate = useCallback(
    async (versionId: string) => {
      setActivatingId(versionId);
      try {
        const result = await activateVersion(versionId, dealId);
        if (result.error) {
          toast.error(`Failed to activate: ${result.error}`);
        } else {
          toast.success("Version activated");
          router.refresh();
        }
      } finally {
        setActivatingId(null);
      }
    },
    [dealId, router]
  );

  const uwId = uw?.id ?? null;
  const propertyType = (uw?.property_type as string) ?? "";
  const purchasePrice = Number(uw?.purchase_price) || 0;
  const numUnits = Number(uw?.num_units) || 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Version History */}
      <VersionHistoryCard
        allVersions={allVersions}
        currentUwId={uwId}
        creatingVersion={creatingVersion}
        activatingId={activatingId}
        onNewVersion={handleNewVersion}
        onActivate={handleActivate}
      />

      {/* Sub-tab Navigation */}
      <PillNav tabs={SUB_TABS} active={activeSubTab} onChange={setActiveSubTab} />

      {/* Sub-tab Content */}
      {activeSubTab === "rent-roll" && (
        <RentRollSubTab rentRoll={rentRoll} uwId={uwId} />
      )}
      {activeSubTab === "t12" && (
        <T12SubTab
          income={income}
          expenses={expenses}
          uwId={uwId}
          purchasePrice={purchasePrice}
          numUnits={numUnits}
        />
      )}
      {activeSubTab === "assumptions" && (
        <AssumptionsSubTab
          uw={uw}
          uwId={uwId}
          propertyType={propertyType}
        />
      )}
      {activeSubTab === "closing-costs" && (
        <ClosingCostsSubTab
          sourcesUses={sourcesUses}
          uwId={uwId}
          loanAmount={Number(uw?.loan_amount) || 0}
          purchasePrice={purchasePrice}
        />
      )}
      {activeSubTab === "scope" && (
        <ScopeOfWorkSubTab
          scopeOfWork={scopeOfWork}
          uwId={uwId}
          numUnits={numUnits}
        />
      )}
    </div>
  );
}

// ── Version History Card ──

function VersionHistoryCard({
  allVersions,
  currentUwId,
  creatingVersion,
  activatingId,
  onNewVersion,
  onActivate,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allVersions: any[];
  currentUwId: string | undefined;
  creatingVersion: boolean;
  activatingId: string | null;
  onNewVersion: () => void;
  onActivate: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm font-semibold">Version History</span>
          <span className="text-[11px] num ml-1 text-muted-foreground">
            {allVersions.length} version{allVersions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onNewVersion}
          disabled={creatingVersion}
        >
          {creatingVersion ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          New Version
        </Button>
      </div>

      {allVersions.length === 0 ? (
        <div className="px-5 py-4 text-[13px] text-muted-foreground">
          No versions yet. Initialize underwriting to get started.
        </div>
      ) : (
        <div>
          {allVersions.map(
            (v: {
              id: string;
              version: number;
              status: string;
              created_at: string;
            }) => {
              const isCurrent = v.id === currentUwId;
              const isActivating = activatingId === v.id;
              return (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 border-b last:border-b-0",
                    isCurrent && "bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold num border",
                      v.status === "active"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/25"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    v{v.version}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">
                        Version {v.version}
                      </span>
                      {v.status === "active" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-green-500/10 text-green-500 border-green-500/25"
                        >
                          Active
                        </Badge>
                      )}
                      {v.status === "draft" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/25"
                        >
                          Draft
                        </Badge>
                      )}
                      {v.status === "archived" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          Archived
                        </Badge>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] text-muted-foreground">
                          · viewing
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] num text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.status === "active" && (
                      <Check
                        className="h-3.5 w-3.5 text-blue-500"
                        strokeWidth={2}
                      />
                    )}
                    {v.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 text-[11px] text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        onClick={() => onActivate(v.id)}
                        disabled={isActivating}
                      >
                        {isActivating && (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        )}
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
