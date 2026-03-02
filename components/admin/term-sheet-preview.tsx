"use client";

import { cn } from "@/lib/utils";
import {
  TERM_SHEET_SECTIONS,
  SAMPLE_DATA,
  type TermSheetSectionDef,
} from "@/lib/term-sheet-fields";
import { FileText } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  /** Ordered section keys */
  sectionOrder: string[];
  /** Section-level visibility: { show_borrower_section: true, ... } */
  sectionVisibility: Record<string, boolean>;
  /** Field-level visibility: { "borrower": { "borrower_name": true } } */
  fieldVisibility: Record<string, Record<string, boolean>>;
  /** Custom field labels: { "borrower": { "borrower_name": "Custom" } } */
  fieldLabels: Record<string, Record<string, string>>;
  /** Section heading overrides */
  sectionHeadings: Record<string, string>;
  /** Company name for header */
  companyName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermSheetPreview({
  sectionOrder,
  sectionVisibility,
  fieldVisibility,
  fieldLabels,
  sectionHeadings,
  companyName,
}: Props) {
  const visibleSections = sectionOrder
    .map((key) => TERM_SHEET_SECTIONS.find((s) => s.key === key))
    .filter(
      (s): s is TermSheetSectionDef =>
        s !== undefined && sectionVisibility[s.key] !== false
    );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Preview header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
          Live Preview
        </span>
      </div>

      {/* Term sheet mock */}
      <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
        {/* Company header */}
        <div className="text-center mb-4 pb-3 border-b-2 border-primary">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            {companyName || "Company Name"}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Term Sheet</p>
        </div>

        {/* Sections */}
        {visibleSections.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 italic">
            No sections are visible. Toggle sections on in the editor.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleSections.map((section) => {
              const sectionFields = section.fields.filter(
                (f) => fieldVisibility[section.key]?.[f.key] !== false
              );
              const heading =
                sectionHeadings[section.key] || section.label;

              return (
                <div key={section.key}>
                  <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider border-b border-slate-200 pb-1 mb-1.5">
                    {heading}
                  </h4>
                  {sectionFields.length > 0 ? (
                    <div className="space-y-0.5">
                      {sectionFields.map((field) => {
                        const label =
                          fieldLabels[section.key]?.[field.key] ||
                          field.label;
                        return (
                          <div
                            key={field.key}
                            className="flex gap-1 text-[10px] leading-relaxed"
                          >
                            <span className="text-slate-500 shrink-0 w-28 text-right">
                              {label}:
                            </span>
                            <span className="text-slate-800 font-medium">
                              {SAMPLE_DATA[field.key] ?? "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      {section.hasCustomText
                        ? "(Custom text only)"
                        : "(No fields visible)"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-slate-200">
          <p className="text-[9px] text-slate-400 text-center">
            This is a preview with sample data. Actual values come from the loan
            record.
          </p>
        </div>
      </div>
    </div>
  );
}
