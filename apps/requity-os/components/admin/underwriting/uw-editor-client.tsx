"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Copy,
  CheckCircle2,
  Clock,
  Building2,
  Home,
  TrendingUp,
  Loader2,
  Eye,
  Lock,
  FlaskConical,
  HardHat,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { RTLDSCRForm } from "./rtl-dscr-form";
import { CommercialTabs } from "./commercial-tabs";
import { ModelHealthPanel } from "./model-health-panel";
import { computeOutputs } from "@/lib/underwriting/calculator";
import { computeUW } from "@/components/commercial-uw/use-calcs";
import { useCommercialUWStore, getDefaultState } from "@/components/commercial-uw/store";
import type { UnderwritingInputs } from "@/lib/underwriting/types";
import { DEFAULT_INPUTS } from "@/lib/underwriting/types";
import type { CommercialUWState } from "@/components/commercial-uw/types";
import type { UWModelType } from "@/lib/constants/uw-model-types";
import { UW_MODEL_LABELS } from "@/lib/constants/uw-model-types";

export interface UWVersionData {
  id: string;
  loan_id: string;
  version_number: number;
  is_active: boolean;
  created_by: string;
  label: string | null;
  notes: string | null;
  model_type: UWModelType;
  calculator_inputs: Record<string, unknown>;
  calculator_outputs: Record<string, unknown>;
  status: string;
  created_at: string;
  _author_name?: string | null;
}

interface UWEditorClientProps {
  dealId: string;
  dealName: string;
  modelType: UWModelType;
  versions: UWVersionData[];
  activeVersionId: string | null;
  currentUserId: string;
  currentUserName: string;
  saveVersionAction: (
    versionId: string,
    loanId: string,
    inputs: Record<string, unknown>,
    outputs: Record<string, unknown>,
    markActive: boolean,
    userId: string,
    userName: string,
    versionNumber: number,
    isOpportunity: boolean
  ) => Promise<{ success?: boolean; error?: string }>;
  cloneVersionAction: (
    loanId: string,
    sourceVersionId: string,
    userId: string,
    modelType: string,
    isOpportunity: boolean
  ) => Promise<{ success?: boolean; error?: string; version?: UWVersionData }>;
  createVersionAction: (
    loanId: string,
    userId: string,
    modelType: string,
    isOpportunity: boolean
  ) => Promise<{ success?: boolean; error?: string; version?: UWVersionData }>;
  isOpportunity?: boolean;
  isSandbox?: boolean;
  /** When provided as null, the scenario is not yet linked to a deal (shows warning instead of navigating). When undefined, falls back to dealId-based navigation. */
  linkedDealId?: string | null;
  linkedDealType?: "opportunity" | "loan" | null;
}

const MODEL_ICONS: Record<UWModelType, typeof Building2> = {
  commercial: Building2,
  rtl: Home,
  dscr: TrendingUp,
  guc: HardHat,
  equity: Landmark,
};

export function UWEditorClient({
  dealId,
  dealName,
  modelType,
  versions,
  activeVersionId,
  currentUserId,
  currentUserName,
  saveVersionAction,
  cloneVersionAction,
  createVersionAction,
  isOpportunity = false,
  isSandbox = false,
  linkedDealId,
  linkedDealType,
}: UWEditorClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Find initial version to edit: latest draft or active version
  const latestDraft = versions.find((v) => v.status === "draft");
  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const initialVersion = latestDraft || activeVersion || versions[0] || null;

  const isCommercial = modelType === "commercial";

  const [selectedVersion, setSelectedVersion] = useState<UWVersionData | null>(initialVersion);
  const [inputs, setInputs] = useState<UnderwritingInputs>(
    isCommercial ? { ...DEFAULT_INPUTS } : parseInputs(initialVersion?.calculator_inputs)
  );
  const [commercialState, setCommercialState] = useState<CommercialUWState>(
    isCommercial ? parseCommercialState(initialVersion?.calculator_inputs, dealId, initialVersion?.id || "") : getDefaultState()
  );
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [creating, setCreating] = useState(false);

  // Determine if the selected version is editable (draft versions or sandbox)
  const isEditable = isSandbox || selectedVersion?.status === "draft";

  const handleSelectVersion = useCallback((version: UWVersionData) => {
    setSelectedVersion(version);
    if (isCommercial) {
      setCommercialState(parseCommercialState(version.calculator_inputs, dealId, version.id));
    } else {
      setInputs(parseInputs(version.calculator_inputs));
    }
  }, [isCommercial, dealId]);

  const handleSave = useCallback(async (markActive: boolean) => {
    if (!selectedVersion || !isEditable) return;
    setSaving(true);
    try {
      const storeState = isCommercial ? useCommercialUWStore.getState().state : null;
      const currentInputs = isCommercial ? storeState! : inputs;
      const outputs = isCommercial
        ? computeUW(storeState!)
        : computeOutputs(inputs);
      const result = await saveVersionAction(
        selectedVersion.id,
        dealId,
        currentInputs as unknown as Record<string, unknown>,
        outputs as unknown as Record<string, unknown>,
        markActive,
        currentUserId,
        currentUserName,
        selectedVersion.version_number,
        isOpportunity
      );
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({
          title: markActive ? "Saved & Activated" : "Draft Saved",
          description: `v${selectedVersion.version_number} ${markActive ? "is now the active version" : "saved as draft"}`,
        });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [selectedVersion, isEditable, inputs, isCommercial, dealId, currentUserId, currentUserName, saveVersionAction, isOpportunity, toast, router]);

  const handleClone = useCallback(async (sourceVersion: UWVersionData) => {
    setCloning(true);
    try {
      const result = await cloneVersionAction(
        dealId,
        sourceVersion.id,
        currentUserId,
        modelType,
        isOpportunity
      );
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({
          title: "Version Cloned",
          description: `New draft created from v${sourceVersion.version_number}`,
        });
        router.refresh();
      }
    } finally {
      setCloning(false);
    }
  }, [dealId, currentUserId, modelType, cloneVersionAction, isOpportunity, toast, router]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const result = await createVersionAction(dealId, currentUserId, modelType, isOpportunity);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "New Scenario", description: "Empty draft created" });
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }, [dealId, currentUserId, modelType, createVersionAction, isOpportunity, toast, router]);

  const ModelIcon = MODEL_ICONS[modelType];

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            {isSandbox ? (
              <Link href={`/models/${modelType}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Models
                </Button>
              </Link>
            ) : linkedDealId === null ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  toast({
                    title: "Not linked to a deal",
                    description:
                      'This model is not linked to a deal yet. Use the "Link to Deal" button in the header above to connect it.',
                  })
                }
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Deal
              </Button>
            ) : (
              <Link
                href={
                  linkedDealId !== undefined
                    ? `/pipeline/${linkedDealId}`
                    : `/pipeline/${dealId}`
                }
              >
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Deal
                </Button>
              </Link>
            )}
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ModelIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-foreground">{dealName}</span>
              <Badge variant="outline" className="text-[10px]">
                {UW_MODEL_LABELS[modelType]}
              </Badge>
            </div>
          </div>

          {/* Save actions */}
          {isEditable && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                {isSandbox ? "Save" : "Save Draft"}
              </Button>
              {!isSandbox && (
                <Button
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Save & Activate
                </Button>
              )}
            </div>
          )}
          {!isEditable && selectedVersion && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Read-only — {selectedVersion.status}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex">
        {/* Version sidebar */}
        <div className="w-[280px] shrink-0 border-r border-border bg-muted/30">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Versions
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : "+ New"}
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              {versions.map((v) => (
                <VersionCard
                  key={v.id}
                  version={v}
                  isSelected={selectedVersion?.id === v.id}
                  onClick={() => handleSelectVersion(v)}
                  onClone={() => handleClone(v)}
                  cloning={cloning}
                />
              ))}
              {versions.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No versions yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 p-6">
          {selectedVersion ? (
            modelType === "commercial" ? (
              <div className="max-w-[1100px]">
                {isSandbox && (
                  <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Sandbox Mode — Not linked to a deal. Use this to test commercial underwriting inputs and verify pro forma computations.
                    </span>
                  </div>
                )}
                <CommercialTabs initialState={commercialState} />
              </div>
            ) : (
              <div className="max-w-4xl">
                {isSandbox && (
                  <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Sandbox Mode — Not linked to a deal. Use this to test model inputs and verify computations.
                    </span>
                  </div>
                )}
                {!isEditable && !isSandbox && (
                  <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Viewing v{selectedVersion.version_number} (read-only). Clone it to make changes.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto h-7 text-[11px]"
                      onClick={() => handleClone(selectedVersion)}
                      disabled={cloning}
                    >
                      {cloning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Copy className="h-3 w-3 mr-1" />}
                      Clone as New Version
                    </Button>
                  </div>
                )}
                <div className="mb-4">
                  <ModelHealthPanel
                    inputs={inputs}
                    modelType={modelType as "rtl" | "dscr"}
                    isSandbox={isSandbox}
                    dealId={isSandbox ? undefined : dealId}
                  />
                </div>
                <RTLDSCRForm
                  inputs={inputs}
                  onChange={setInputs}
                  readOnly={!isEditable}
                  modelType={modelType as "rtl" | "dscr"}
                />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">
                Create a new scenario to get started.
              </p>
              <Button className="mt-4" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                + New Scenario
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Version Card ── */
function VersionCard({
  version,
  isSelected,
  onClick,
  onClone,
  cloning,
}: {
  version: UWVersionData;
  isSelected: boolean;
  onClick: () => void;
  onClone: () => void;
  cloning: boolean;
}) {
  const ModelIcon = MODEL_ICONS[version.model_type || "rtl"];

  return (
    <div
      onClick={onClick}
      className={`group rounded-lg px-3 py-2.5 cursor-pointer transition-all border ${
        isSelected
          ? "border-primary/30 bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold num text-foreground">
          v{version.version_number}
        </span>
        <Badge
          variant={version.status === "draft" ? "outline" : version.status === "approved" ? "default" : "secondary"}
          className="text-[9px] h-4 px-1.5"
        >
          {version.status}
        </Badge>
        {version.is_active && (
          <Badge className="text-[9px] h-4 px-1.5 bg-green-500/10 text-green-600 border-green-500/20">
            Active
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ModelIcon className="h-3 w-3" strokeWidth={1.5} />
        <span>{version._author_name || "Unknown"}</span>
        <span>·</span>
        <span className="num">{formatDate(version.created_at)}</span>
      </div>

      {/* Clone button on hover */}
      <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClone();
          }}
          disabled={cloning}
          className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Copy className="h-3 w-3" />
          Clone as new version
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function parseInputs(raw: Record<string, unknown> | null | undefined): UnderwritingInputs {
  if (!raw || Object.keys(raw).length === 0) return { ...DEFAULT_INPUTS };
  return { ...DEFAULT_INPUTS, ...raw } as UnderwritingInputs;
}

function parseCommercialState(
  raw: Record<string, unknown> | null | undefined,
  dealId: string,
  versionId: string
): CommercialUWState {
  const defaults = getDefaultState(dealId, versionId);
  if (!raw || Object.keys(raw).length === 0) return defaults;
  return { ...defaults, ...raw, dealId, versionId } as CommercialUWState;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
