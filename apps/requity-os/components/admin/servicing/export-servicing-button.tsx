"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportServicingWorkbook } from "@/lib/export-servicing-xlsx";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

interface ExportServicingButtonProps {
  loanId: string;
  variant?: "button" | "icon" | "menu-item";
}

export function ExportServicingButton({
  loanId,
  variant = "button",
}: ExportServicingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      await exportServicingWorkbook(supabase, loanId);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          disabled={loading}
          title="Export to Excel"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
        </Button>
        {error && (
          <p className="absolute top-full mt-1 right-0 text-xs text-destructive whitespace-nowrap">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === "menu-item") {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Export to Excel
      </button>
    );
  }

  // Default: button variant
  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={loading}
        className="gap-2"
        variant="outline"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export to Excel
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
