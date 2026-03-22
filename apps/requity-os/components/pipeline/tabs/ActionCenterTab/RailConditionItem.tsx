"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  Ban,
  ChevronDown,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { showSuccess, showError } from "@/lib/toast";
import { updateConditionStatusAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import type { DealConditionRow, ConditionDocument } from "./useActionCenterData";

// ── Status config ──

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-muted-foreground", dotColor: "bg-muted-foreground", icon: Clock },
  submitted: { label: "Submitted", color: "text-blue-600 dark:text-blue-400", dotColor: "bg-blue-500", icon: FileText },
  under_review: { label: "In Review", color: "text-amber-600 dark:text-amber-400", dotColor: "bg-amber-500", icon: Eye },
  approved: { label: "Approved", color: "text-green-600 dark:text-green-400", dotColor: "bg-green-500", icon: CheckCircle2 },
  waived: { label: "Waived", color: "text-slate-500", dotColor: "bg-slate-400", icon: Ban },
  not_applicable: { label: "N/A", color: "text-slate-400", dotColor: "bg-slate-300", icon: Ban },
  rejected: { label: "Rejected", color: "text-red-600 dark:text-red-400", dotColor: "bg-red-500", icon: AlertTriangle },
};

const STATUS_OPTIONS = ["pending", "submitted", "under_review", "approved", "waived", "not_applicable", "rejected"];

interface RailConditionItemProps {
  condition: DealConditionRow;
  documents: ConditionDocument[];
  dealId: string;
  onStatusChange: (conditionId: string, newStatus: string) => void;
}

export function RailConditionItem({
  condition: c,
  documents,
  dealId,
  onStatusChange,
}: RailConditionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
  const condDocs = documents.filter((d) => d.condition_id === c.id);

  const handleStatusChange = async (newStatus: string) => {
    const oldStatus = c.status;
    onStatusChange(c.id, newStatus);

    const result = await updateConditionStatusAction(c.id, newStatus, dealId);
    if (result && "error" in result && result.error) {
      onStatusChange(c.id, oldStatus);
      showError("Could not update condition", result.error);
    } else {
      showSuccess("Condition updated");
    }
  };

  return (
    <div className="border-b last:border-b-0">
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 bg-transparent border-0 cursor-pointer hover:bg-muted/30 rq-transition text-left"
      >
        {/* Status dot */}
        <span className={cn("h-2 w-2 rounded-full shrink-0", statusCfg.dotColor)} />

        {/* Name */}
        <span className="text-[13px] font-medium flex-1 min-w-0 truncate">
          {c.condition_name}
        </span>

        {/* Meta */}
        {condDocs.length > 0 && (
          <span className="text-[10px] text-muted-foreground num shrink-0">
            {condDocs.length} doc{condDocs.length !== 1 ? "s" : ""}
          </span>
        )}

        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", statusCfg.color)}>
          {statusCfg.label}
        </Badge>

        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 pt-1 space-y-3 bg-muted/20">
          {/* Description */}
          {c.internal_description && (
            <p className="text-[12px] text-muted-foreground">{c.internal_description}</p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="inline-field-label">Category</span>
              <p className="text-[12px] capitalize">{c.category.replace(/_/g, " ")}</p>
            </div>
            <div>
              <span className="inline-field-label">Required Stage</span>
              <p className="text-[12px] capitalize">{c.required_stage.replace(/_/g, " ")}</p>
            </div>
            {c.due_date && (
              <div>
                <span className="inline-field-label">Due Date</span>
                <p className="text-[12px]">{formatDate(c.due_date)}</p>
              </div>
            )}
            {c.responsible_party && (
              <div>
                <span className="inline-field-label">Responsible</span>
                <p className="text-[12px]">{c.responsible_party}</p>
              </div>
            )}
          </div>

          {/* Status update */}
          <div>
            <span className="inline-field-label">Status</span>
            <Select value={c.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="inline-field h-8 text-[12px] w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <SelectItem key={s} value={s}>
                      <span className={cn("text-[12px]", cfg?.color)}>{cfg?.label ?? s}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Documents */}
          {condDocs.length > 0 && (
            <div>
              <span className="inline-field-label">Documents</span>
              <div className="space-y-1 mt-1">
                {condDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px]"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{doc.document_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical path badge */}
          {c.critical_path_item && (
            <Badge variant="outline" className="text-[10px] text-red-600 dark:text-red-400 border-red-300 dark:border-red-700">
              Critical Path
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
