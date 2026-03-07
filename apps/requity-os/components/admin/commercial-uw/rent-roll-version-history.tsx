"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw, FileSpreadsheet } from "lucide-react";
import type { RentRollRow } from "@/lib/commercial-uw/types";

export interface UploadVersion {
  id: string;
  upload_type: string;
  original_filename: string;
  row_count: number;
  created_at: string;
  parsed_data: Record<string, unknown>[] | null;
  column_mapping: Record<string, string> | null;
}

interface Props {
  versions: UploadVersion[];
  onRestore: (rows: RentRollRow[]) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RentRollVersionHistory({ versions, onRestore }: Props) {
  if (versions.length === 0) return null;

  const handleRestore = (version: UploadVersion) => {
    if (!version.parsed_data) return;
    const rows = version.parsed_data as unknown as RentRollRow[];
    onRestore(rows);
  };

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Upload History</h4>
        <Badge variant="outline" className="text-xs">
          {versions.length} version{versions.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="space-y-2">
        {versions.map((v, idx) => (
          <div
            key={v.id}
            className="flex items-center gap-3 p-2 bg-card border rounded text-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {v.original_filename}
                {idx === 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Latest
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(v.created_at)} &middot; {v.row_count} units
              </p>
            </div>
            {v.parsed_data && (
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-7 text-xs"
                onClick={() => handleRestore(v)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restore
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
