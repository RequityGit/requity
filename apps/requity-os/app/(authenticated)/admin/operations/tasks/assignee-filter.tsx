"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "./tasks-board";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AssigneeFilterProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  profiles: Profile[];
  label?: string;
}

export function AssigneeFilter({
  options,
  selected,
  onChange,
  profiles,
  label = "Assignee",
}: AssigneeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAll = selected.length === 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const display = isAll
    ? "All"
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || "1 selected"
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-[7px] rounded-md border text-[13px] font-medium cursor-pointer min-w-[160px] justify-between transition-colors",
          open
            ? "border-ring bg-secondary text-foreground"
            : "border-border bg-secondary text-foreground hover:border-ring/50"
        )}
      >
        <span className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex-shrink-0">
            {label}
          </span>
          <span className="truncate">{display}</span>
        </span>
        <ChevronsUpDown
          className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
          strokeWidth={1.5}
        />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-popover border border-border rounded-md shadow-md z-50 min-w-[220px] max-h-[280px] overflow-auto animate-in fade-in-0 zoom-in-95 duration-100">
          {/* All option */}
          <button
            onClick={() => onChange([])}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors",
              isAll
                ? "bg-accent font-semibold"
                : "hover:bg-accent"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0",
                isAll
                  ? "bg-primary border-primary"
                  : "border-border"
              )}
            >
              {isAll && (
                <Check
                  className="h-[11px] w-[11px] text-primary-foreground"
                  strokeWidth={2.5}
                />
              )}
            </div>
            All
          </button>
          <div className="h-px bg-border" />
          {options.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors",
                  active
                    ? "bg-accent font-semibold"
                    : "hover:bg-accent"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0",
                    active
                      ? "bg-primary border-primary"
                      : "border-border"
                  )}
                >
                  {active && (
                    <Check
                      className="h-[11px] w-[11px] text-primary-foreground"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
                <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                  {getInitials(opt.label)}
                </div>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
