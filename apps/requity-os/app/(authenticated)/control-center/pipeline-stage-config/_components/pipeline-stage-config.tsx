"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  X,
  Plus,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import type {
  UnifiedStageWithRules,
  UnifiedStageRule,
} from "../actions";
import { upsertStage, addRule, deleteRule } from "../actions";

// ---------------------------------------------------------------------------
// Stage color map (matches pipeline-v2 visual palette)
// ---------------------------------------------------------------------------

const STAGE_COLORS: Record<string, string> = {
  lead: "#9B9BA0",
  analysis: "#3B82F6",
  negotiation: "#D97706",
  execution: "#22A861",
  closed: "#1A1A1A",
};

// Stage display labels
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  analysis: "Analysis",
  negotiation: "Negotiation",
  execution: "Execution",
  closed: "Closed",
};

// ---------------------------------------------------------------------------
// Field options for the rule selector
// ---------------------------------------------------------------------------

const FIELD_OPTIONS: { value: string; label: string }[] = [
  // Top-level unified_deals columns
  { value: "name", label: "Deal Name" },
  { value: "amount", label: "Deal Amount" },
  { value: "asset_class", label: "Asset Class" },
  { value: "assigned_to", label: "Assigned To" },
  { value: "primary_contact_id", label: "Primary Contact" },
  { value: "company_id", label: "Company" },
  { value: "expected_close_date", label: "Expected Close Date" },
  { value: "capital_side", label: "Capital Side" },
  { value: "card_type_id", label: "Card Type" },
  // Common uw_data fields
  { value: "uw:loan_amount", label: "UW — Loan Amount" },
  { value: "uw:property_value", label: "UW — Property Value" },
  { value: "uw:noi_current", label: "UW — NOI (Current)" },
  { value: "uw:purchase_price", label: "UW — Purchase Price" },
  { value: "uw:monthly_rent", label: "UW — Monthly Rent" },
  { value: "uw:rehab_budget", label: "UW — Rehab Budget" },
  { value: "uw:arv", label: "UW — ARV" },
  { value: "uw:offer_price", label: "UW — Offer Price" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PipelineStageConfigProps {
  initialStages: UnifiedStageWithRules[];
  loadError: string | null;
}

export function PipelineStageConfig({
  initialStages,
  loadError,
}: PipelineStageConfigProps) {
  const [stages, setStages] = useState(initialStages);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<"idle" | "saved">("idle");

  const totalRules = stages.reduce(
    (sum, s) => sum + (s.unified_stage_rules?.length ?? 0),
    0
  );

  function handleToggle(stageId: string) {
    setExpandedId((prev) => (prev === stageId ? null : stageId));
  }

  function handleSaveAll() {
    setSavedState("saved");
    setTimeout(() => setSavedState("idle"), 2000);
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Failed to load pipeline stages: {loadError}
        </p>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-muted-foreground">
          No pipeline stages configured yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Pipeline Stage Config
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure advancement rules and warn/alert thresholds for each
            pipeline stage.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={savedState === "saved"}
          size="sm"
        >
          {savedState === "saved" ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{stages.length}</span>
          <span className="text-muted-foreground">Stages</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{totalRules}</span>
          <span className="text-muted-foreground">Total Rules</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Field Required
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          Warn threshold
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          Alert threshold
        </span>
      </div>

      {/* Stage flow bar */}
      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => handleToggle(stage.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              expandedId === stage.id
                ? "border-foreground/30 bg-muted text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: STAGE_COLORS[stage.stage] ?? "#888" }}
            />
            {STAGE_LABELS[stage.stage] ?? stage.stage}
          </button>
        ))}
      </div>

      {/* Stage cards */}
      <div className="space-y-2">
        {stages.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isExpanded={expandedId === stage.id}
            onToggle={() => handleToggle(stage.id)}
            onStageUpdate={(updated) => {
              setStages((prev) =>
                prev.map((s) => (s.id === updated.id ? updated : s))
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StageCard
// ---------------------------------------------------------------------------

function StageCard({
  stage,
  isExpanded,
  onToggle,
  onStageUpdate,
}: {
  stage: UnifiedStageWithRules;
  isExpanded: boolean;
  onToggle: () => void;
  onStageUpdate: (updated: UnifiedStageWithRules) => void;
}) {
  const [warnDays, setWarnDays] = useState(stage.warn_days ?? 5);
  const [alertDays, setAlertDays] = useState(stage.alert_days ?? 10);
  const [addingRule, setAddingRule] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const rules = stage.unified_stage_rules ?? [];

  function handleThresholdBlur(field: "warn_days" | "alert_days") {
    const value = field === "warn_days" ? warnDays : alertDays;
    if (value === stage[field]) return;

    startTransition(async () => {
      const result = await upsertStage(stage.id, { [field]: value });
      if (result.error) {
        toast({
          title: "Failed to update threshold",
          description: result.error,
          variant: "destructive",
        });
        if (field === "warn_days") setWarnDays(stage.warn_days ?? 5);
        else setAlertDays(stage.alert_days ?? 10);
      } else {
        onStageUpdate({ ...stage, [field]: value });
        toast({ title: `${STAGE_LABELS[stage.stage] ?? stage.stage} ${field === "warn_days" ? "warn" : "alert"} threshold updated` });
      }
    });
  }

  function handleAddRule(fieldKey: string, errorMessage: string) {
    startTransition(async () => {
      const result = await addRule(stage.id, fieldKey, errorMessage);
      if (result.error) {
        toast({
          title: "Failed to add rule",
          description: result.error,
          variant: "destructive",
        });
      } else {
        const newRule: UnifiedStageRule = {
          id: crypto.randomUUID(),
          stage_config_id: stage.id,
          field_key: fieldKey,
          error_message: errorMessage || null,
          created_at: new Date().toISOString(),
        };
        onStageUpdate({
          ...stage,
          unified_stage_rules: [...rules, newRule],
        });
        setAddingRule(false);
        toast({ title: `Rule added to ${STAGE_LABELS[stage.stage] ?? stage.stage}` });
      }
    });
  }

  function handleDeleteRule(ruleId: string) {
    startTransition(async () => {
      const result = await deleteRule(ruleId);
      if (result.error) {
        toast({
          title: "Failed to delete rule",
          description: result.error,
          variant: "destructive",
        });
      } else {
        onStageUpdate({
          ...stage,
          unified_stage_rules: rules.filter((r) => r.id !== ruleId),
        });
        toast({ title: "Rule removed" });
      }
    });
  }

  return (
    <Card className={isExpanded ? "bg-muted/30" : ""}>
      <CardContent className="p-0">
        {/* Collapsed header — always visible */}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: STAGE_COLORS[stage.stage] ?? "#888" }}
            />
            <span className="text-sm font-medium text-foreground">
              {STAGE_LABELS[stage.stage] ?? stage.stage}
            </span>
            <Badge variant="secondary" className="text-xs">
              {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span className="text-muted-foreground">{stage.warn_days ?? "—"}d</span>
            </span>
            <span className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3 text-destructive" />
              <span className="text-muted-foreground">{stage.alert_days ?? "—"}d</span>
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            {/* Threshold inputs */}
            <div className="flex items-end gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Warn After (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={warnDays}
                  onChange={(e) => setWarnDays(Number(e.target.value))}
                  onBlur={() => handleThresholdBlur("warn_days")}
                  className="w-24 h-8 text-sm"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Alert After (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={alertDays}
                  onChange={(e) => setAlertDays(Number(e.target.value))}
                  onBlur={() => handleThresholdBlur("alert_days")}
                  className="w-24 h-8 text-sm"
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Days counted from last stage move
            </p>

            <Separator />

            {/* Advancement Rules */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Advancement Rules
              </h4>

              {rules.length === 0 && !addingRule && (
                <p className="text-xs text-muted-foreground italic">
                  No rules — any deal can enter this stage.
                </p>
              )}

              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-md bg-emerald-500/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-foreground">
                      Field Required:{" "}
                      {FIELD_OPTIONS.find((f) => f.value === rule.field_key)
                        ?.label ?? rule.field_key}
                    </span>
                    {rule.error_message && (
                      <span className="text-xs text-muted-foreground">
                        — {rule.error_message}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={isPending}
                    className="rounded p-0.5 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}

              {addingRule ? (
                <AddRuleForm
                  existingFieldKeys={rules.map((r) => r.field_key)}
                  isPending={isPending}
                  onAdd={handleAddRule}
                  onCancel={() => setAddingRule(false)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingRule(true)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add rule
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AddRuleForm
// ---------------------------------------------------------------------------

function AddRuleForm({
  existingFieldKeys,
  isPending,
  onAdd,
  onCancel,
}: {
  existingFieldKeys: string[];
  isPending: boolean;
  onAdd: (fieldKey: string, errorMessage: string) => void;
  onCancel: () => void;
}) {
  const [fieldKey, setFieldKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const availableFields = FIELD_OPTIONS.filter(
    (f) => !existingFieldKeys.includes(f.value)
  );

  return (
    <div className="flex items-end gap-2 rounded-md border border-border bg-background p-3">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Field
        </label>
        <Select value={fieldKey} onValueChange={setFieldKey}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select field..." />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((f) => (
              <SelectItem key={f.value} value={f.value} className="text-xs">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Error message (optional)
        </label>
        <Input
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          placeholder="Error message (optional)"
          className="h-8 text-xs"
        />
      </div>
      <Button
        size="sm"
        className="h-8 text-xs"
        disabled={!fieldKey || isPending}
        onClick={() => onAdd(fieldKey, errorMessage)}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
