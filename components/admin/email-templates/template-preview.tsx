"use client";

import { useMemo } from "react";
import { MERGE_VARIABLES } from "@/app/(authenticated)/admin/email-templates/types";

interface TemplatePreviewProps {
  subject: string;
  htmlBody: string;
}

export function TemplatePreview({ subject, htmlBody }: TemplatePreviewProps) {
  const renderedSubject = useMemo(() => {
    let result = subject;
    for (const v of MERGE_VARIABLES) {
      result = result.replaceAll(`{{${v.key}}}`, v.example ?? v.key);
    }
    return result;
  }, [subject]);

  const renderedBody = useMemo(() => {
    let result = htmlBody;
    for (const v of MERGE_VARIABLES) {
      result = result.replaceAll(`{{${v.key}}}`, v.example ?? v.key);
    }
    return result;
  }, [htmlBody]);

  if (!htmlBody.trim()) {
    return (
      <div className="rounded-md border bg-white p-8 text-center text-muted-foreground">
        No content to preview. Switch to the Editor tab to add HTML content.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white p-4">
        <div className="text-xs text-muted-foreground mb-1">Subject</div>
        <div className="font-medium">{renderedSubject || "No subject"}</div>
      </div>
      <div className="rounded-md border bg-white">
        <div className="border-b px-3 py-2 bg-slate-50">
          <span className="text-xs font-medium text-muted-foreground">
            Email Preview (merge variables replaced with sample data)
          </span>
        </div>
        <div className="p-4">
          <iframe
            srcDoc={renderedBody}
            title="Email preview"
            className="w-full min-h-[500px] border-0"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
}
