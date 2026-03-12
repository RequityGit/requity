"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { StageBlocker } from "@/app/(authenticated)/admin/pipeline-v2/actions";

interface StageBlockersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStageLabel: string;
  blockers: StageBlocker[];
}

export function StageBlockersDialog({
  open,
  onOpenChange,
  targetStageLabel,
  blockers,
}: StageBlockersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cannot advance to {targetStageLabel}
          </DialogTitle>
          <DialogDescription>
            The following requirements must be met before this deal can reach{" "}
            {targetStageLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto py-2">
          {blockers.map((blocker) => (
            <div key={blocker.stage} className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                {blocker.stageLabel}
              </h4>

              {blocker.ruleErrors.length > 0 && (
                <ul className="space-y-1 pl-4">
                  {blocker.ruleErrors.map((err, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground list-disc"
                    >
                      {err}
                    </li>
                  ))}
                </ul>
              )}

              {blocker.missingFields.length > 0 && (
                <ul className="space-y-1 pl-4">
                  {blocker.missingFields.map((field) => (
                    <li
                      key={field.field_key}
                      className="text-sm text-muted-foreground list-disc"
                    >
                      {field.label}{" "}
                      <span className="text-xs text-muted-foreground/60">
                        ({field.module.replace(/_/g, " ")})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
