"use client";

import { Textarea } from "@/components/ui/textarea";

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function HtmlEditor({ value, onChange }: HtmlEditorProps) {
  return (
    <div className="rounded-md border bg-card">
      <div className="border-b px-3 py-2 bg-slate-50">
        <span className="text-xs font-medium text-muted-foreground">
          HTML Body
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="<html>&#10;  <body>&#10;    <h1>Hello {{borrower_name}}</h1>&#10;    <p>Your loan has been approved.</p>&#10;  </body>&#10;</html>"
        className="min-h-[400px] rounded-none border-0 font-mono text-sm resize-y focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
