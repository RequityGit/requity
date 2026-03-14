"use client";

import { useMemo } from "react";
import {
  MERGE_VARIABLES,
  type TemplateVariable,
} from "@/app/(authenticated)/(admin)/email-templates/types";

interface TemplatePreviewProps {
  subject: string;
  htmlBody: string;
  previewData?: Record<string, string> | null;
  availableVariables?: TemplateVariable[];
}

function replaceVariables(
  text: string,
  vars: Record<string, string>
): string {
  let result = text;
  Object.keys(vars).forEach((key) => {
    result = result.replaceAll(`{{${key}}}`, vars[key]);
  });
  return result;
}

export function TemplatePreview({
  subject,
  htmlBody,
  previewData,
  availableVariables,
}: TemplatePreviewProps) {
  // Build a variable -> example value map, preferring preview_data, then
  // available_variables examples, then global MERGE_VARIABLES examples.
  const variableMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Start with global merge variable examples
    MERGE_VARIABLES.forEach((v) => {
      if (v.example) map[v.key] = v.example;
    });

    // Layer on per-template available_variables examples
    if (availableVariables) {
      availableVariables.forEach((v) => {
        if (v.example) map[v.key] = v.example;
      });
    }

    // Layer on per-template preview_data (highest priority)
    if (previewData) {
      Object.keys(previewData).forEach((key) => {
        map[key] = previewData[key];
      });
    }

    return map;
  }, [previewData, availableVariables]);

  const renderedSubject = useMemo(
    () => replaceVariables(subject, variableMap),
    [subject, variableMap]
  );

  const renderedBody = useMemo(
    () => replaceVariables(htmlBody, variableMap),
    [htmlBody, variableMap]
  );

  if (!htmlBody.trim()) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
        No content to preview. Switch to the Editor tab to add HTML content.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card p-4">
        <div className="text-xs text-muted-foreground mb-1">Subject</div>
        <div className="font-medium">{renderedSubject || "No subject"}</div>
      </div>
      <div className="rounded-md border bg-card">
        <div className="border-b px-3 py-2 bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground">
            Email Preview (merge variables replaced with sample data)
          </span>
        </div>
        <div className="p-4">
          <iframe
            srcDoc={renderedBody}
            title="Email preview"
            className="w-full min-h-[500px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
