"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Check, Pencil } from "lucide-react";
import type { UwFieldDef } from "./pipeline-types";

export interface ExtractedField {
  value: string | number | boolean;
  confidence: number;
  source: string;
}

interface ExtractedFieldsReviewProps {
  dealFields: Record<string, ExtractedField>;
  uwFields: Record<string, ExtractedField>;
  uwFieldDefs: UwFieldDef[];
  summary: string;
  onAccept: (accepted: {
    dealFields: Record<string, unknown>;
    uwFields: Record<string, unknown>;
    summaryNote?: string;
  }) => void;
  onBack: () => void;
  pending?: boolean;
}

const DEAL_FIELD_LABELS: Record<string, string> = {
  name: "Deal Name",
  amount: "Amount",
  expected_close_date: "Expected Close Date",
  asset_class: "Asset Class",
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600">
        High
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
        Medium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-600">
      Low
    </Badge>
  );
}

export function ExtractedFieldsReview({
  dealFields,
  uwFields,
  uwFieldDefs,
  summary,
  onAccept,
  onBack,
  pending,
}: ExtractedFieldsReviewProps) {
  // Track which fields are checked (included) and their edited values
  const [checkedDealFields, setCheckedDealFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [key, field] of Object.entries(dealFields)) {
      initial[key] = field.confidence >= 0.5;
    }
    return initial;
  });

  const [checkedUwFields, setCheckedUwFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [key, field] of Object.entries(uwFields)) {
      initial[key] = field.confidence >= 0.5;
    }
    return initial;
  });

  const [editedDealValues, setEditedDealValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(dealFields)) {
      initial[key] = field.value;
    }
    return initial;
  });

  const [editedUwValues, setEditedUwValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(uwFields)) {
      initial[key] = field.value;
    }
    return initial;
  });

  const [editedSummary, setEditedSummary] = useState(summary);
  const [editingSummary, setEditingSummary] = useState(false);
  const [saveAsNote, setSaveAsNote] = useState(true);

  const uwFieldDefMap = useMemo(
    () => new Map(uwFieldDefs.map((f) => [f.key, f])),
    [uwFieldDefs]
  );

  const dealFieldEntries = Object.entries(dealFields);
  const uwFieldEntries = Object.entries(uwFields);
  const totalFields = dealFieldEntries.length + uwFieldEntries.length;
  const checkedCount =
    Object.values(checkedDealFields).filter(Boolean).length +
    Object.values(checkedUwFields).filter(Boolean).length;

  function handleAccept() {
    const acceptedDeal: Record<string, unknown> = {};
    for (const [key] of dealFieldEntries) {
      if (checkedDealFields[key]) {
        acceptedDeal[key] = editedDealValues[key];
      }
    }

    const acceptedUw: Record<string, unknown> = {};
    for (const [key] of uwFieldEntries) {
      if (checkedUwFields[key]) {
        acceptedUw[key] = editedUwValues[key];
      }
    }

    onAccept({
      dealFields: acceptedDeal,
      uwFields: acceptedUw,
      summaryNote: saveAsNote ? editedSummary : undefined,
    });
  }

  function renderFieldInput(
    key: string,
    value: unknown,
    onChange: (val: unknown) => void,
    fieldDef?: UwFieldDef
  ) {
    const type = fieldDef?.type ?? (key === "amount" ? "currency" : "text");

    if (type === "select" && fieldDef?.options) {
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={onChange}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldDef.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === "boolean") {
      return (
        <Select
          value={String(value ?? "false")}
          onValueChange={(v) => onChange(v === "true")}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    const isNumeric = type === "currency" || type === "percent" || type === "number";
    return (
      <Input
        className={`h-8 text-xs ${isNumeric ? "num" : ""}`}
        type={isNumeric ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) =>
          onChange(isNumeric ? Number(e.target.value) || 0 : e.target.value)
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      {summary && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deal Summary
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setEditingSummary(!editingSummary)}
            >
              <Pencil className="h-3 w-3 mr-1" />
              {editingSummary ? "Done" : "Edit"}
            </Button>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            {editingSummary ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="min-h-[80px] text-xs bg-background"
                placeholder="Edit the deal summary..."
              />
            ) : (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{editedSummary}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="save-as-note"
              checked={saveAsNote}
              onCheckedChange={(checked) => setSaveAsNote(!!checked)}
            />
            <label htmlFor="save-as-note" className="text-xs text-muted-foreground cursor-pointer">
              Save summary as a deal note
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {totalFields} fields extracted
        </span>
        <Badge variant="outline">
          {checkedCount} / {totalFields} selected
        </Badge>
      </div>

      {/* Deal Fields */}
      {dealFieldEntries.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Deal Details
          </Label>
          <div className="space-y-2 rounded-lg border p-3">
            {dealFieldEntries.map(([key, field]) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  checked={checkedDealFields[key] ?? false}
                  onCheckedChange={(checked) =>
                    setCheckedDealFields((prev) => ({
                      ...prev,
                      [key]: !!checked,
                    }))
                  }
                />
                <div className="w-28 flex-shrink-0">
                  <span className="text-xs font-medium">
                    {DEAL_FIELD_LABELS[key] ?? key}
                  </span>
                </div>
                <div className="flex-1">
                  {renderFieldInput(key, editedDealValues[key], (val) =>
                    setEditedDealValues((prev) => ({ ...prev, [key]: val }))
                  )}
                </div>
                <ConfidenceBadge confidence={field.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UW Fields */}
      {uwFieldEntries.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Underwriting Fields
          </Label>
          <div className="space-y-2 rounded-lg border p-3">
            {uwFieldEntries.map(([key, field]) => {
              const def = uwFieldDefMap.get(key);
              return (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    checked={checkedUwFields[key] ?? false}
                    onCheckedChange={(checked) =>
                      setCheckedUwFields((prev) => ({
                        ...prev,
                        [key]: !!checked,
                      }))
                    }
                  />
                  <div className="w-28 flex-shrink-0">
                    <span className="text-xs font-medium">
                      {def?.label ?? key}
                    </span>
                  </div>
                  <div className="flex-1">
                    {renderFieldInput(
                      key,
                      editedUwValues[key],
                      (val) =>
                        setEditedUwValues((prev) => ({ ...prev, [key]: val })),
                      def
                    )}
                  </div>
                  <ConfidenceBadge confidence={field.confidence} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={pending}>
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back
        </Button>
        <Button onClick={handleAccept} disabled={checkedCount === 0 || pending}>
          {pending ? (
            "Creating deal..."
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Apply & Create Deal
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
