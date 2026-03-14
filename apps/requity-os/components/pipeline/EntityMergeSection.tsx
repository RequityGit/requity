"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  UserCheck,
  Building2,
  Home,
  DollarSign,
  Plus,
  Merge,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeftRight,
} from "lucide-react";
import { FieldMergeRow } from "./FieldMergeRow";
import { EntitySearchPopover } from "./EntitySearchPopover";
import {
  type IntakeEntityKey,
  type EntityMode,
  type FieldChoice,
  type EntityMatchResult,
  type IntakeParsedData,
  ENTITY_META,
  ENTITY_FIELD_MAP,
  INCOMING_DATA_MAP,
  isEmpty,
  valsMatch,
} from "@/lib/intake/types";

interface EntityMergeSectionProps {
  entityKey: IntakeEntityKey;
  autoMatch: EntityMatchResult | null | undefined;
  parsed: IntakeParsedData;
  mode: EntityMode;
  onModeChange: (mode: EntityMode) => void;
  fieldChoices: Record<string, FieldChoice>;
  onFieldChoice: (entity: IntakeEntityKey, field: string, choice: FieldChoice) => void;
  onManualMatch?: (entityKey: IntakeEntityKey, match: EntityMatchResult) => void;
}

const ENTITY_ICONS: Record<IntakeEntityKey, React.ReactNode> = {
  contact: <User className="h-3.5 w-3.5" />,
  borrower_contact: <UserCheck className="h-3.5 w-3.5" />,
  company: <Building2 className="h-3.5 w-3.5" />,
  property: <Home className="h-3.5 w-3.5" />,
  opportunity: <DollarSign className="h-3.5 w-3.5" />,
};

const ENTITY_COLOR_CLASSES: Record<IntakeEntityKey, {
  icon: string;
  bg: string;
  border: string;
  text: string;
  toggleActive: string;
}> = {
  contact: {
    icon: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    toggleActive: "bg-blue-500/15 text-blue-600",
  },
  borrower_contact: {
    icon: "text-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    toggleActive: "bg-cyan-500/15 text-cyan-600",
  },
  company: {
    icon: "text-violet-500",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    toggleActive: "bg-violet-500/15 text-violet-600",
  },
  property: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    toggleActive: "bg-emerald-500/15 text-emerald-600",
  },
  opportunity: {
    icon: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    toggleActive: "bg-amber-500/15 text-amber-600",
  },
};

function formatFieldValue(val: unknown): string {
  if (val === null || val === undefined || val === "" || val === 0) return "";
  if (typeof val === "number") {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  }
  return String(val);
}

export function EntityMergeSection({
  entityKey,
  autoMatch,
  parsed,
  mode,
  onModeChange,
  fieldChoices,
  onFieldChoice,
  onManualMatch,
}: EntityMergeSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = ENTITY_META[entityKey];
  const displayLabel = entityKey === "opportunity" ? "Deal" : entityKey === "borrower_contact" ? "Borrower" : meta.label;
  const colors = ENTITY_COLOR_CLASSES[entityKey];
  const fields = ENTITY_FIELD_MAP[entityKey];
  const hasMatch = !!autoMatch;
  const conf = autoMatch ? Math.round(autoMatch.confidence * 100) : 0;
  const incomingData = INCOMING_DATA_MAP[entityKey](parsed);
  const existingData = autoMatch?.snapshot || {};

  const fieldStats = useMemo(() => {
    if (mode !== "merge" || !hasMatch) return null;
    let conflicts = 0;
    let autoFills = 0;
    let matches = 0;
    fields.forEach((f) => {
      const inc = incomingData[f.key];
      const ext = existingData[f.key];
      if (isEmpty(inc) && isEmpty(ext)) return;
      if (valsMatch(inc, ext)) { matches++; return; }
      if (isEmpty(inc) || isEmpty(ext)) { autoFills++; return; }
      conflicts++;
    });
    return { conflicts, autoFills, matches };
  }, [mode, hasMatch, fields, incomingData, existingData]);

  const unresolvedCount = useMemo(() => {
    if (mode !== "merge" || !hasMatch) return 0;
    let count = 0;
    fields.forEach((f) => {
      const inc = incomingData[f.key];
      const ext = existingData[f.key];
      if (!isEmpty(inc) && !isEmpty(ext) && !valsMatch(inc, ext) && !fieldChoices[f.key]) count++;
    });
    return count;
  }, [mode, hasMatch, fieldChoices, fields, incomingData, existingData]);

  const showFields = mode === "merge" && hasMatch;
  const showNewPreview = mode === "new";
  const showSearch = mode === "merge" && !hasMatch;

  const populatedIncomingFields = useMemo(() => {
    if (!showNewPreview) return [];
    return fields
      .map((f) => ({ ...f, value: incomingData[f.key] }))
      .filter((f) => !isEmpty(f.value));
  }, [showNewPreview, fields, incomingData]);

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        showFields ? [colors.bg, colors.border] : "border-border"
      )}
    >
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* Row header: the left side (icon + label) is the expand trigger;
            the right side (New/Merge buttons) lives outside CollapsibleTrigger
            to avoid invalid nested <button> elements (browsers break the outer
            button's click handler when inner <button>s are nested). */}
        <div
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-t-lg transition-colors",
          )}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 flex-1 min-w-0 text-left bg-transparent border-0 p-0",
                "cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "hover:bg-muted/30 -ml-1 pl-1 py-0.5 pr-2",
              )}
              aria-expanded={expanded}
              aria-label={expanded ? `Collapse ${displayLabel}` : `Expand ${displayLabel} to choose existing vs incoming`}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                  colors.bg, colors.border, "border"
                )}
              >
                <span className={colors.icon}>{ENTITY_ICONS[entityKey]}</span>
              </div>
              <div className="min-w-0">
                <div className={cn("text-[11px] font-bold uppercase tracking-wider", colors.text)}>
                  {displayLabel}
                </div>
                {hasMatch && mode === "merge" && (
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        conf >= 90 ? "bg-emerald-500" : conf >= 70 ? "bg-amber-500" : "bg-orange-500"
                      )}
                    />
                    {conf}% match
                    {autoMatch!.snapshot.name ? ` \u2192 ${String(autoMatch!.snapshot.name)}` : null}
                    {autoMatch!.snapshot.address_line1 ? ` \u2192 ${String(autoMatch!.snapshot.address_line1)}` : null}
                  </div>
                )}
              </div>
              <span className="h-6 w-6 flex items-center justify-center shrink-0 text-muted-foreground ml-auto">
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {showFields && fieldStats && (
              <div className="flex gap-1.5 mr-1">
                {fieldStats.conflicts > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] py-0 px-1.5",
                      unresolvedCount > 0
                        ? "border-amber-500/50 text-amber-600"
                        : "border-emerald-500/50 text-emerald-600"
                    )}
                  >
                    {unresolvedCount > 0 ? `${unresolvedCount} conflict${unresolvedCount > 1 ? "s" : ""}` : "resolved"}
                  </Badge>
                )}
                {fieldStats.autoFills > 0 && (
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-blue-500/50 text-blue-600">
                    {fieldStats.autoFills} fill{fieldStats.autoFills > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex gap-0.5 rounded-md border bg-muted/30 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onModeChange("new"); }}
                className={cn(
                  "h-6 px-2 text-[10px] font-semibold gap-1",
                  mode === "new" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Plus className="h-2.5 w-2.5" /> New
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onModeChange("merge"); }}
                className={cn(
                  "h-6 px-2 text-[10px] font-semibold gap-1",
                  mode === "merge" ? cn("shadow-sm", colors.toggleActive) : "text-muted-foreground"
                )}
              >
                {hasMatch ? (
                  <><Merge className="h-2.5 w-2.5" /> Merge</>
                ) : (
                  <><Search className="h-2.5 w-2.5" /> Find</>
                )}
              </Button>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          {/* Field-level merge UI */}
          {showFields && (
            <div className="px-3 pb-3 border-t border-border/30">
              <div className="grid items-center gap-2 py-2 [grid-template-columns:100px_1fr_28px_1fr]">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Field</div>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Existing</div>
                <div />
                <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 text-center">Incoming</div>
              </div>
              {fields.map((f) => (
                <FieldMergeRow
                  key={f.key}
                  fieldDef={f}
                  incomingVal={incomingData[f.key]}
                  existingVal={existingData[f.key]}
                  choice={fieldChoices[f.key]}
                  onChoice={(val) => onFieldChoice(entityKey, f.key, val)}
                />
              ))}
              {(entityKey === "contact" || entityKey === "borrower_contact") && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                  <ArrowLeftRight className="h-3 w-3" />
                  <span>= Keep both (adds incoming as secondary value)</span>
                </div>
              )}
            </div>
          )}

          {/* Search UI when no match in merge mode */}
          {showSearch && (
            <div className="px-3 pb-3">
              <EntitySearchPopover
                entityKey={entityKey}
                onSelect={(ek, match) => {
                  onManualMatch?.(ek, match);
                }}
              />
            </div>
          )}

          {/* +New preview panel */}
          {showNewPreview && (
            <div className="px-3 pb-3 border-t border-border/30">
              <div className="text-[10px] font-medium text-muted-foreground py-2">
                {populatedIncomingFields.length > 0
                  ? `Will create new ${displayLabel.toLowerCase()} with these values:`
                  : `Will create new ${displayLabel.toLowerCase()}. No data from email for this entity.`}
              </div>
              {populatedIncomingFields.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {populatedIncomingFields.map((f) => (
                    <div key={f.key}>
                      <div className="text-[9px] text-muted-foreground/50">{f.label}</div>
                      <div className="text-[11px] text-foreground font-medium mt-0.5 truncate">
                        {formatFieldValue(f.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
