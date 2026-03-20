"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MergeFieldSelect } from "./MergeFieldSelect";
import type { LayoutTitleBanner, MergeFieldDefinition } from "../styled-doc-parts/types";

interface TitleBannerEditorProps {
  banner: LayoutTitleBanner;
  mergeFields: MergeFieldDefinition[];
  onChange: (banner: LayoutTitleBanner) => void;
}

export function TitleBannerEditor({
  banner,
  mergeFields,
  onChange,
}: TitleBannerEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Title</Label>
        <Input
          value={banner.title}
          onChange={(e) => onChange({ ...banner, title: e.target.value })}
          placeholder="e.g. Indicative Term Sheet"
          className="h-8 text-xs mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input
          value={banner.subtitle ?? ""}
          onChange={(e) =>
            onChange({ ...banner, subtitle: e.target.value || undefined })
          }
          placeholder="e.g. Commercial Bridge Loan"
          className="h-8 text-xs mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Date Field</Label>
        <div className="mt-1">
          <MergeFieldSelect
            mergeFields={mergeFields}
            value={banner.date_field}
            onChange={(key) => onChange({ ...banner, date_field: key })}
            placeholder="Select date field..."
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Expiration Field</Label>
        <div className="mt-1">
          <MergeFieldSelect
            mergeFields={mergeFields}
            value={banner.expiration_field}
            onChange={(key) => onChange({ ...banner, expiration_field: key })}
            placeholder="Select expiration field..."
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Renders in red to indicate urgency
        </p>
      </div>
    </div>
  );
}
