"use client";

import { Check, Pencil, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { SecureUploadLinkDialog } from "@/components/pipeline/SecureUploadLinkDialog";
import type { DealConditionRow } from "./useActionCenterData";
import type { DealCondition } from "@/components/pipeline/pipeline-types";

interface ConditionActionsProps {
  condition: DealConditionRow;
  dealId: string;
  onStatusChange: (conditionId: string, newStatus: string) => void;
}

export function ConditionActions({
  condition,
  dealId,
  onStatusChange,
}: ConditionActionsProps) {
  const confirm = useConfirm();

  // Cast DealConditionRow to DealCondition for SecureUploadLinkDialog compatibility
  const conditionForDialog = {
    ...condition,
    template_id: null,
    is_borrower_facing: true,
    critical_path_item: condition.critical_path_item ?? false,
    requires_approval: condition.requires_approval ?? false,
    is_required: condition.is_required ?? true,
    sort_order: condition.sort_order ?? 0,
  } as DealCondition;

  return (
    <div className="border-b px-4 py-3 flex flex-wrap gap-2">
      {/* Primary action based on current status */}
      {(condition.status === "pending" || condition.status === "requested" || condition.status === "submitted") && (
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          onClick={() =>
            onStatusChange(
              condition.id,
              condition.status === "pending" || condition.status === "requested"
                ? "submitted"
                : "approved"
            )
          }
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          {condition.status === "pending" || condition.status === "requested" ? "Mark Received" : "Approve"}
        </Button>
      )}

      {/* Request Revision */}
      <SecureUploadLinkDialog
        dealId={dealId}
        conditions={[conditionForDialog]}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Request Revision
          </Button>
        }
      />

      {/* Send Upload Link */}
      <SecureUploadLinkDialog
        dealId={dealId}
        conditions={[conditionForDialog]}
        trigger={
          <Button variant="outline" size="sm" className="text-xs">
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Send Upload Link
          </Button>
        }
      />

      {/* Waive */}
      {condition.status !== "waived" && condition.status !== "approved" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={async () => {
            const ok = await confirm({
              title: "Waive condition?",
              description: `This will waive "${condition.condition_name}". This can be undone.`,
              confirmLabel: "Waive",
            });
            if (ok) onStatusChange(condition.id, "waived");
          }}
        >
          Waive
        </Button>
      )}
    </div>
  );
}
