"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { LayoutDisclaimer } from "../styled-doc-parts/types";

interface DisclaimerEditorProps {
  disclaimer: LayoutDisclaimer | undefined;
  onChange: (disclaimer: LayoutDisclaimer | undefined) => void;
}

export function DisclaimerEditor({ disclaimer, onChange }: DisclaimerEditorProps) {
  const enabled = disclaimer !== undefined;

  const toggle = (checked: boolean) => {
    if (checked) {
      onChange({ text: "" });
    } else {
      onChange(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={toggle} />
        <Label className="text-xs">Include disclaimer</Label>
      </div>

      {enabled && disclaimer && (
        <>
          <div>
            <Label className="text-xs">Label (bold prefix)</Label>
            <Input
              value={disclaimer.label ?? ""}
              onChange={(e) =>
                onChange({ ...disclaimer, label: e.target.value || undefined })
              }
              placeholder="e.g. Non-Binding Indication of Interest."
              className="h-8 text-xs mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Text</Label>
            <Textarea
              value={disclaimer.text}
              onChange={(e) => onChange({ ...disclaimer, text: e.target.value })}
              placeholder="Disclaimer text..."
              className="text-xs mt-1 min-h-[80px]"
            />
          </div>
        </>
      )}
    </div>
  );
}
