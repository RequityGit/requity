"use client";

import { X, FileText } from "lucide-react";

interface TemplateAppliedBannerProps {
  templateName: string;
  templateVersion: number;
  onClear: () => void;
}

export function TemplateAppliedBanner({
  templateName,
  templateVersion,
  onClear,
}: TemplateAppliedBannerProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border text-xs">
      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">
        Template:{" "}
        <span className="font-medium text-foreground">{templateName}</span>
        <span className="text-muted-foreground ml-1">(v{templateVersion})</span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Clear template"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
