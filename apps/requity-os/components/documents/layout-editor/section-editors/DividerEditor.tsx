"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DividerSection } from "../../styled-doc-parts/types";

interface DividerEditorProps {
  section: DividerSection;
  onChange: (section: DividerSection) => void;
}

export function DividerEditor({ section, onChange }: DividerEditorProps) {
  return (
    <div>
      <Label className="text-xs">Style</Label>
      <Select
        value={section.style ?? "line"}
        onValueChange={(v) =>
          onChange({ ...section, style: v as "line" | "space" })
        }
      >
        <SelectTrigger className="h-8 text-xs mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="line" className="text-xs">
            Line
          </SelectItem>
          <SelectItem value="space" className="text-xs">
            Space
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
