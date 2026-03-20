"use client";

import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MergeFieldSelect } from "../MergeFieldSelect";
import type { TermTableSection, TermRow, MergeFieldDefinition } from "../../styled-doc-parts/types";

interface TermTableEditorProps {
  section: TermTableSection;
  mergeFields: MergeFieldDefinition[];
  onChange: (section: TermTableSection) => void;
}

export function TermTableEditor({
  section,
  mergeFields,
  onChange,
}: TermTableEditorProps) {
  const updateRow = (index: number, updates: Partial<TermRow>) => {
    const rows = [...section.rows];
    rows[index] = { ...rows[index], ...updates };
    onChange({ ...section, rows });
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= section.rows.length) return;
    const rows = [...section.rows];
    [rows[index], rows[newIndex]] = [rows[newIndex], rows[index]];
    onChange({ ...section, rows });
  };

  const removeRow = (index: number) => {
    const rows = section.rows.filter((_, i) => i !== index);
    onChange({ ...section, rows });
  };

  const addRow = () => {
    onChange({
      ...section,
      rows: [...section.rows, { label: "" }],
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Section Title</Label>
        <Input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className="h-8 text-xs mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Rows</Label>
        {section.rows.map((row, i) => (
          <div
            key={i}
            className="border rounded-md p-3 space-y-2 bg-background"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Label</Label>
                  <Input
                    value={row.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                    placeholder="Row label"
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Field</Label>
                  <div className="mt-0.5">
                    <MergeFieldSelect
                      mergeFields={mergeFields}
                      value={row.field}
                      onChange={(key) =>
                        updateRow(i, {
                          field: key,
                          value: key ? undefined : row.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveRow(i, -1)}
                  disabled={i === 0}
                >
                  <ChevronUp size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveRow(i, 1)}
                  disabled={i === section.rows.length - 1}
                >
                  <ChevronDown size={12} />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeRow(i)}
              >
                <Trash2 size={12} />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {!row.field && (
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Static Value
                  </Label>
                  <Input
                    value={row.value ?? ""}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                    placeholder="Static value"
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
              )}
              <div className="w-24">
                <Label className="text-[10px] text-muted-foreground">Format</Label>
                <Select
                  value={row.format ?? "__none__"}
                  onValueChange={(v) =>
                    updateRow(i, {
                      format: v === "__none__" ? undefined : (v as TermRow["format"]),
                    })
                  }
                >
                  <SelectTrigger className="h-7 text-xs mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-xs">
                      None
                    </SelectItem>
                    <SelectItem value="currency" className="text-xs">
                      Currency
                    </SelectItem>
                    <SelectItem value="percentage" className="text-xs">
                      Percentage
                    </SelectItem>
                    <SelectItem value="date" className="text-xs">
                      Date
                    </SelectItem>
                    <SelectItem value="number" className="text-xs">
                      Number
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label className="text-[10px] text-muted-foreground">Suffix</Label>
                <Input
                  value={row.suffix ?? ""}
                  onChange={(e) => updateRow(i, { suffix: e.target.value || undefined })}
                  placeholder="e.g. months"
                  className="h-7 text-xs mt-0.5"
                />
              </div>
              <div className="flex items-center gap-1.5 pt-3">
                <Switch
                  checked={row.highlight ?? false}
                  onCheckedChange={(checked) => updateRow(i, { highlight: checked })}
                  className="scale-75"
                />
                <Label className="text-[10px] text-muted-foreground">HL</Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={addRow}>
        <Plus size={12} className="mr-1" />
        Add Row
      </Button>
    </div>
  );
}
