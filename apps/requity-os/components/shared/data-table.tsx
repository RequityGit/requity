"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** If true, this column will be sticky on mobile */
  sticky?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "No data found.",
  onRowClick,
}: DataTableProps<T>) {
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    // Show swipe hint on mobile if table has many columns
    if (columns.length > 3 && window.innerWidth < 768) {
      const dismissed = sessionStorage.getItem("table-swipe-hint-dismissed");
      if (!dismissed) {
        setShowSwipeHint(true);
        const timer = setTimeout(() => {
          setShowSwipeHint(false);
          sessionStorage.setItem("table-swipe-hint-dismissed", "true");
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [columns.length]);

  return (
    <div className="rounded-md border bg-card relative">
      {/* Swipe hint overlay */}
      {showSwipeHint && (
        <div
          className="absolute top-12 right-2 z-10 flex items-center gap-1 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm px-2 py-1 rounded-md border shadow-sm swipe-hint md:hidden"
          onClick={() => {
            setShowSwipeHint(false);
            sessionStorage.setItem("table-swipe-hint-dismissed", "true");
          }}
        >
          <span>Swipe to see more</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}

      <div className="mobile-scroll lg:overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, colIdx) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.className,
                    colIdx === 0 && "lg:static sticky left-0 z-[1] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] lg:shadow-none"
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  className={cn(
                    onRowClick ? "cursor-pointer hover:bg-muted" : "",
                    "min-h-[56px] md:min-h-0"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIdx) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.className,
                        "py-3 md:py-4",
                        colIdx === 0 && "lg:static sticky left-0 z-[1] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] lg:shadow-none"
                      )}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
