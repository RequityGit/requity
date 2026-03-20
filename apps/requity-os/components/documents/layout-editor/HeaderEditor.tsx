"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LayoutHeader } from "../styled-doc-parts/types";

interface HeaderEditorProps {
  header: LayoutHeader;
  onChange: (header: LayoutHeader) => void;
}

export function HeaderEditor({ header, onChange }: HeaderEditorProps) {
  const update = (key: keyof LayoutHeader, value: string | boolean) => {
    onChange({ ...header, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Entity Name</Label>
        <Input
          value={header.entity}
          onChange={(e) => update("entity", e.target.value)}
          className="h-8 text-xs mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input
          value={header.subtitle ?? ""}
          onChange={(e) => update("subtitle", e.target.value)}
          placeholder="e.g. Commercial Bridge Finance"
          className="h-8 text-xs mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Address</Label>
        <Input
          value={header.address ?? ""}
          onChange={(e) => update("address", e.target.value)}
          className="h-8 text-xs mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Phone</Label>
          <Input
            value={header.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            className="h-8 text-xs mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input
            value={header.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
            className="h-8 text-xs mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Website</Label>
        <Input
          value={header.website ?? ""}
          onChange={(e) => update("website", e.target.value)}
          className="h-8 text-xs mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={header.show_logo !== false}
          onCheckedChange={(checked) => update("show_logo", checked)}
        />
        <Label className="text-xs">Show Logo</Label>
      </div>
    </div>
  );
}
