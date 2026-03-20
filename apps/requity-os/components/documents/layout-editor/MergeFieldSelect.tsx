"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MergeFieldDefinition } from "../styled-doc-parts/types";

const SOURCE_LABELS: Record<string, string> = {
  loans: "Loan Data",
  crm_contacts: "Contacts",
  crm_companies: "Companies",
  companies: "Companies",
  _system: "System",
};

interface MergeFieldSelectProps {
  mergeFields: MergeFieldDefinition[];
  value: string | undefined;
  onChange: (key: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export function MergeFieldSelect({
  mergeFields,
  value,
  onChange,
  placeholder = "Select field...",
  allowClear = true,
}: MergeFieldSelectProps) {
  const grouped = mergeFields.reduce<Record<string, MergeFieldDefinition[]>>(
    (acc, field) => {
      const source = field.source || "_other";
      if (!acc[source]) acc[source] = [];
      acc[source].push(field);
      return acc;
    },
    {}
  );

  const sourceOrder = Object.keys(grouped).sort((a, b) => {
    if (a === "_system") return 1;
    if (b === "_system") return -1;
    return a.localeCompare(b);
  });

  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? undefined : v)}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="__none__" className="text-xs text-muted-foreground">
            None (static value)
          </SelectItem>
        )}
        {sourceOrder.map((source) => (
          <SelectGroup key={source}>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {SOURCE_LABELS[source] ?? source}
            </SelectLabel>
            {grouped[source].map((field) => (
              <SelectItem key={field.key} value={field.key} className="text-xs">
                {field.key} — {field.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
