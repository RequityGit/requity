"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteButtonProps {
  note: string;
  onChange?: (value: string) => void;
}

export function NoteButton({ note, onChange }: NoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(note || "");
  const ref = useRef<HTMLDivElement>(null);
  const has = val.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "rounded px-[5px] py-[3px] flex items-center gap-[3px] transition-colors text-[10px] cursor-pointer border",
          has
            ? "bg-dash-info/10 border-dash-info/30 text-dash-info"
            : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <MessageSquare className="w-[13px] h-[13px]" strokeWidth={1.5} />
        {has && <span className="text-[9px] font-semibold">1</span>}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[260px] z-[100] bg-card border border-border rounded-lg shadow-xl p-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-[0.06em]">
            Assumption Note
          </div>
          <textarea
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              onChange?.(e.target.value);
            }}
            placeholder="Add a note..."
            className="w-full min-h-[70px] resize-y rounded-lg border border-border bg-accent/50 text-foreground px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-muted-foreground"
          />
          <div className="flex justify-end gap-1.5 mt-2">
            {has && (
              <button
                onClick={() => {
                  setVal("");
                  onChange?.("");
                  setOpen(false);
                }}
                className="px-2.5 py-[5px] text-[11px] font-medium text-muted-foreground bg-transparent border-none cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="px-2.5 py-[5px] text-[11px] font-semibold bg-primary text-primary-foreground rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
