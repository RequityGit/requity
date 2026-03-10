"use client";

import { AlertTriangle } from "lucide-react";

interface OverrideWarningProps {
  entityName: string;
  fieldLabel: string;
  currentValue: string;
}

export function OverrideWarning({ entityName, fieldLabel, currentValue }: OverrideWarningProps) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <AlertTriangle size={14} strokeWidth={1.5} className="text-[#B8822A] shrink-0" />
      <p className="text-xs text-[#B8822A]">
        This will update {entityName}&apos;s {fieldLabel} (currently {currentValue})
      </p>
    </div>
  );
}
