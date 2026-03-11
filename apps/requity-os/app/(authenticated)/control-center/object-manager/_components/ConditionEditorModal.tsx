"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@repo/lib";
import {
  ASSET_CLASSES,
  LOAN_TYPES,
  type VisibilityCondition,
} from "@/lib/visibility-engine";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition: VisibilityCondition | null;
  onSave: (condition: VisibilityCondition | null) => void;
}

export function ConditionEditorModal({
  open,
  onOpenChange,
  condition,
  onSave,
}: Props) {
  const [ac, setAc] = useState<string[]>(condition?.asset_class || []);
  const [lt, setLt] = useState<string[]>(condition?.loan_type || []);

  // Reset state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setAc(condition?.asset_class || []);
      setLt(condition?.loan_type || []);
    }
    onOpenChange(isOpen);
  };

  const toggle = (
    list: string[],
    setter: (v: string[]) => void,
    value: string
  ) => {
    setter(
      list.includes(value)
        ? list.filter((i) => i !== value)
        : [...list, value]
    );
  };

  const handleSave = () => {
    const c: VisibilityCondition = {};
    if (ac.length) c.asset_class = ac as VisibilityCondition["asset_class"];
    if (lt.length) c.loan_type = lt as VisibilityCondition["loan_type"];
    onSave(Object.keys(c).length ? c : null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setAc([]);
    setLt([]);
  };

  const hasCondition = ac.length > 0 || lt.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Visibility Conditions</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            AND across axes, OR within each axis
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Asset Class */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 block mb-2">
              Asset Class
            </label>
            <div className="flex gap-2">
              {ASSET_CLASSES.map((v) => {
                const sel = ac.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggle(ac, setAc, v)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                      sel
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                        : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sel && "✓ "}
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loan Type */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
              Loan Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {LOAN_TYPES.map((v) => {
                const sel = lt.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggle(lt, setLt, v)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                      sel
                        ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-400"
                        : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sel && "✓ "}
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Helper text */}
          {!hasCondition && (
            <div className="p-3 rounded-lg border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">
                No conditions = always visible
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {hasCondition && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            Save Conditions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
