"use client";

import { useState } from "react";
import { type Editor } from "@tiptap/react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MergeFieldDef {
  key: string;
  label: string;
  source: string;
  column: string;
  format?: string | null;
}

interface EditorSidebarProps {
  mode: "document" | "template";
  editor: Editor | null;
  mergeFields: MergeFieldDef[];
  mergeData?: Record<string, string>;
  documentInfo?: {
    templateName?: string;
    version?: number;
    recordLabel?: string;
    generatedBy?: string;
    generatedAt?: string;
    status?: string;
  };
}

const SOURCE_COLORS: Record<string, string> = {
  loans: "bg-blue-500",
  crm_contacts: "bg-blue-500",
  companies: "bg-blue-500",
  equity_deals: "bg-blue-500",
  _system: "bg-green-500",
  template_config: "bg-amber-500",
};

export function EditorSidebar({
  mode,
  editor,
  mergeFields,
  mergeData,
  documentInfo,
}: EditorSidebarProps) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  if (mode === "template") {
    // Group fields by source
    const grouped: Record<string, MergeFieldDef[]> = {};
    for (const f of mergeFields) {
      if (query && !f.key.toLowerCase().includes(query) && !f.label.toLowerCase().includes(query)) {
        continue;
      }
      if (!grouped[f.source]) grouped[f.source] = [];
      grouped[f.source].push(f);
    }

    const handleInsert = (field: MergeFieldDef) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertMergeField({
          fieldKey: field.key,
          sourceTable: field.source,
          sourceColumn: field.column,
        })
        .run();
    };

    return (
      <div className="w-[264px] border-l border-border bg-background flex flex-col h-full">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">
            Insert Merge Field
          </p>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fields..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-3 space-y-4">
            {Object.entries(grouped).map(([source, fields]) => (
              <div key={source}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${SOURCE_COLORS[source] ?? "bg-gray-400"}`}
                  />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                    {source}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {fields.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => handleInsert(f)}
                      className="w-full text-left px-2 py-1.5 rounded text-xs font-mono text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      title={f.label}
                    >
                      {f.key}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(grouped).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No fields match your search.
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Template Info */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">
            Template Info
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{mergeFields.length} merge fields</p>
          </div>
        </div>
      </div>
    );
  }

  // Document mode sidebar
  return (
    <div className="w-[264px] border-l border-border bg-background flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-5">
          {/* Properties */}
          {documentInfo && (
            <section>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">
                Properties
              </p>
              <div className="space-y-2 text-xs">
                {documentInfo.templateName && (
                  <div>
                    <span className="text-muted-foreground">Template:</span>{" "}
                    <span className="font-medium">{documentInfo.templateName}</span>
                  </div>
                )}
                {documentInfo.version != null && (
                  <div>
                    <span className="text-muted-foreground">Version:</span>{" "}
                    <span className="num">v{documentInfo.version}</span>
                  </div>
                )}
                {documentInfo.recordLabel && (
                  <div>
                    <span className="text-muted-foreground">Record:</span>{" "}
                    <span className="font-medium">{documentInfo.recordLabel}</span>
                  </div>
                )}
                {documentInfo.status && (
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant="secondary" className="text-[10px]">
                      {documentInfo.status}
                    </Badge>
                  </div>
                )}
                {documentInfo.generatedBy && (
                  <div>
                    <span className="text-muted-foreground">Generated by:</span>{" "}
                    <span>{documentInfo.generatedBy}</span>
                  </div>
                )}
                {documentInfo.generatedAt && (
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    <span className="num">
                      {new Date(documentInfo.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Merged Values */}
          {mergeData && Object.keys(mergeData).length > 0 && (
            <section>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1">
                Merged Values
              </p>
              <p className="text-[10px] text-muted-foreground mb-2">
                Bold values in the document were populated from these fields.
              </p>
              <div className="space-y-1.5">
                {Object.entries(mergeData).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-2 text-xs">
                    <span className="font-mono text-blue-600 shrink-0">{key}</span>
                    <span className="text-muted-foreground truncate text-right">
                      {val || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
