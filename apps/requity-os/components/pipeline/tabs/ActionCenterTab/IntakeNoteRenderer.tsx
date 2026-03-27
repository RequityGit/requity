"use client";

import { Sparkles, Mail, User, Building2 } from "lucide-react";

/**
 * Detects if a note body is an email intake auto-generated note.
 * These notes follow the pattern: **Email Intake - <subject>**\n\n<body>
 */
export function isIntakeNote(body: string): boolean {
  return body.startsWith("**Email Intake");
}

interface ParsedIntakeNote {
  subject: string;
  source: string | null;
  aiSummary: string | null;
  broker: { name: string; company: string | null } | null;
  borrower: { name: string; entity: string | null } | null;
  extractedFields: { label: string; value: string }[];
  detailedNotes: string | null;
}

function parseIntakeNote(body: string): ParsedIntakeNote {
  const lines = body.split("\n");
  const result: ParsedIntakeNote = {
    subject: "",
    source: null,
    aiSummary: null,
    broker: null,
    borrower: null,
    extractedFields: [],
    detailedNotes: null,
  };

  // Extract subject from first line: **Email Intake - <subject>** or **Email Intake Merged**
  const firstLine = lines[0] || "";
  const subjectMatch = firstLine.match(/\*\*Email Intake(?:\s*-\s*|\s+Merged\*\*)(.*?)(?:\*\*)?$/);
  result.subject = subjectMatch?.[1]?.replace(/\*\*/g, "").trim() || firstLine.replace(/\*\*/g, "").trim();

  let inExtractedFields = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("Source:")) {
      result.source = trimmed.replace("Source:", "").trim();
      inExtractedFields = false;
    } else if (trimmed.startsWith("Subject:")) {
      // Skip, we already have it
      inExtractedFields = false;
    } else if (trimmed.startsWith("AI Summary:") || trimmed.startsWith("**AI Summary:**")) {
      result.aiSummary = trimmed.replace(/\*?\*?AI Summary:\*?\*?/, "").trim();
      inExtractedFields = false;
    } else if (trimmed.startsWith("Broker:")) {
      const brokerLine = trimmed.replace("Broker:", "").trim();
      result.broker = { name: brokerLine, company: null };
      inExtractedFields = false;
    } else if (trimmed.startsWith("Company:") && result.broker) {
      result.broker.company = trimmed.replace("Company:", "").trim();
      inExtractedFields = false;
    } else if (trimmed.startsWith("Borrower:")) {
      const borrowerLine = trimmed.replace("Borrower:", "").trim();
      result.borrower = { name: borrowerLine, entity: null };
      inExtractedFields = false;
    } else if (trimmed.startsWith("Entity:") && result.borrower) {
      result.borrower.entity = trimmed.replace("Entity:", "").trim();
      inExtractedFields = false;
    } else if (trimmed === "All Extracted Fields:" || trimmed === "**All Extracted Fields:**") {
      inExtractedFields = true;
    } else if (trimmed.startsWith("Detailed Notes:") || trimmed.startsWith("**Detailed Notes:**")) {
      result.detailedNotes = trimmed.replace(/\*?\*?Detailed Notes:\*?\*?/, "").trim();
      inExtractedFields = false;
    } else if (trimmed.startsWith("**Changes applied:**")) {
      // Merge note format
      inExtractedFields = false;
    } else if (trimmed.startsWith("**Reviewer notes:**")) {
      inExtractedFields = false;
    } else if (inExtractedFields && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const label = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      if (label && value) {
        result.extractedFields.push({ label, value });
      }
    }
  }

  return result;
}

interface IntakeNoteRendererProps {
  body: string;
}

export function IntakeNoteRenderer({ body }: IntakeNoteRendererProps) {
  const parsed = parseIntakeNote(body);

  return (
    <div className="space-y-2.5">
      {/* AI Summary */}
      {parsed.aiSummary && (
        <div className="rounded-lg border-l-[3px] border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              AI Summary
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-foreground/80">{parsed.aiSummary}</p>
        </div>
      )}

      {/* Extracted Fields as key-value grid */}
      {parsed.extractedFields.length > 0 && (
        <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Extracted Fields
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {parsed.extractedFields.map((f, i) => (
              <div key={i} className="flex items-baseline gap-1.5 text-[11px] py-0.5">
                <span className="text-muted-foreground shrink-0">{f.label}:</span>
                <span className="font-medium text-foreground truncate">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source / Broker / Borrower as deemphasized metadata */}
      {(parsed.source || parsed.broker || parsed.borrower) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70">
          {parsed.source && (
            <span className="flex items-center gap-1">
              <Mail className="h-2.5 w-2.5" />
              {parsed.source}
            </span>
          )}
          {parsed.broker && (
            <span className="flex items-center gap-1">
              <Building2 className="h-2.5 w-2.5" />
              {parsed.broker.name}
              {parsed.broker.company && ` (${parsed.broker.company})`}
            </span>
          )}
          {parsed.borrower && (
            <span className="flex items-center gap-1">
              <User className="h-2.5 w-2.5" />
              {parsed.borrower.name}
              {parsed.borrower.entity && ` / ${parsed.borrower.entity}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
