"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";

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
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Enable checkbox row selection */
  selectable?: boolean;
  /** Currently selected row IDs (controlled) */
  selectedIds?: Set<string>;
  /** Called when selection changes */
  onSelectionChange?: (ids: Set<string>) => void;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  emptyMessage = "No data found.",
  emptyState,
  onRowClick,
  selectable,
  selectedIds,
  onSelectionChange,
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

  // Selection helpers
  const allVisibleIds = selectable
    ? data.map((row) => row.id).filter((id): id is string => !!id)
    : [];
  const allSelected = selectable && allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds?.has(id));
  const someSelected = selectable && !allSelected && allVisibleIds.some((id) => selectedIds?.has(id));

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allVisibleIds));
    }
  }, [allSelected, allVisibleIds, onSelectionChange]);

  const toggleRow = useCallback(
    (id: string) => {
      if (!onSelectionChange || !selectedIds) return;
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

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
              {selectable && (
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={someSelected ? "indeterminate" : allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col, colIdx) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.className,
                    colIdx === 0 && !selectable && "lg:static sticky left-0 z-[1] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] lg:shadow-none"
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
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyState ?? (
                    <EmptyState title={emptyMessage} compact />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const rowId = row.id || String(idx);
                const isSelected = selectable && selectedIds?.has(rowId);
                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      onRowClick ? "cursor-pointer hover:bg-muted" : "",
                      "min-h-[56px] md:min-h-0",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell className="w-10 px-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(rowId)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${idx + 1}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          col.className,
                          "py-3 md:py-4",
                          colIdx === 0 && !selectable && "lg:static sticky left-0 z-[1] bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] lg:shadow-none"
                        )}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
