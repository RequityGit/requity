"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InlineField } from "@/components/ui/inline-field";
import { Building2, Trash2, Loader2, FolderOpen, Plus } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DealBorrowingEntity } from "@/app/types/borrower";
import { ENTITY_TYPES, US_STATES } from "./constants";
import {
  upsertBorrowingEntityAction,
  deleteBorrowingEntityAction,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import { createEntityDriveFolder } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

interface BorrowingEntityCardProps {
  dealId: string;
  entity: DealBorrowingEntity | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

export function BorrowingEntityCard({
  dealId,
  entity,
  onSaved,
  onDeleted,
}: BorrowingEntityCardProps) {
  const [local, setLocal] = useState<Partial<DealBorrowingEntity>>(() => entity ?? {});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [creatingDriveFolder, setCreatingDriveFolder] = useState(false);

  useEffect(() => {
    if (entity) setLocal(entity);
  }, [entity]);

  const saveField = useCallback(
    (field: string, value: unknown) => {
      setLocal((prev) => ({ ...prev, [field]: value }));
      startTransition(async () => {
        const payload = {
          ...(entity ?? {}),
          deal_id: dealId,
          [field]: value,
        };
        const result = await upsertBorrowingEntityAction(
          dealId,
          payload as Partial<DealBorrowingEntity> & { deal_id: string }
        );
        if (result.error) {
          showError(result.error);
          if (entity) setLocal(entity);
        } else {
          if (result.data) setLocal(result.data);
          onSaved();
        }
      });
    },
    [entity, dealId, onSaved]
  );

  const handleDelete = useCallback(async () => {
    if (!entity?.id) return;
    setDeleting(true);
    try {
      const result = await deleteBorrowingEntityAction(entity.id, dealId);
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess("Borrowing entity removed");
        setLocal({});
        setDeleteOpen(false);
        onDeleted?.();
      }
    } finally {
      setDeleting(false);
    }
  }, [entity?.id, dealId, onDeleted]);

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h4 className="rq-micro-label">
            Borrowing Entity
          </h4>
          {pending && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* GDrive folder button */}
          {entity?.id && (
            <TooltipProvider>
            {local.google_drive_folder_url ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={local.google_drive_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Open Drive folder</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    disabled={creatingDriveFolder}
                    onClick={async () => {
                      setCreatingDriveFolder(true);
                      const result = await createEntityDriveFolder(entity.id, dealId);
                      setCreatingDriveFolder(false);
                      if (result.error) {
                        showError("Could not create Drive folder", result.error);
                      } else {
                        if (result.folder_url) {
                          setLocal((prev) => ({ ...prev, google_drive_folder_url: result.folder_url }));
                        }
                        showSuccess("Drive folder created");
                      }
                    }}
                  >
                    {creatingDriveFolder ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Create Drive folder</TooltipContent>
              </Tooltip>
            )}
            </TooltipProvider>
          )}
        {entity?.id && (
          <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <p className="text-sm mb-3">Remove this entity?</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Yes"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  No
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        </div>
      </div>

      {/* Inline-editable fields */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-2">
          <InlineField
            type="text"
            label="Entity Name"
            value={local.entity_name ?? ""}
            placeholder="Entity name"
            onSave={(v) => saveField("entity_name", v)}
            className="col-span-2"
          />
          <InlineField
            type="select"
            label="Type"
            value={local.entity_type ?? ""}
            placeholder="Select type"
            options={ENTITY_TYPES}
            onSave={(v) => saveField("entity_type", v)}
          />
          <InlineField
            type="text"
            label="EIN"
            value={local.ein ?? ""}
            placeholder="XX-XXXXXXX"
            onSave={(v) => saveField("ein", v)}
          />
          <InlineField
            type="select"
            label="State of Formation"
            value={local.state_of_formation ?? ""}
            placeholder="Select state"
            options={US_STATES}
            onSave={(v) => saveField("state_of_formation", v)}
          />
          <InlineField
            type="date"
            label="Date of Formation"
            value={local.date_of_formation ?? ""}
            onSave={(v) => saveField("date_of_formation", v || null)}
          />
          <InlineField
            type="text"
            label="Address"
            value={local.address_line_1 ?? ""}
            placeholder="Address"
            onSave={(v) => saveField("address_line_1", v)}
            className="col-span-2"
          />
          <InlineField
            type="text"
            label="City"
            value={local.city ?? ""}
            placeholder="City"
            onSave={(v) => saveField("city", v)}
          />
          <InlineField
            type="select"
            label="State"
            value={local.state ?? ""}
            placeholder="State"
            options={US_STATES}
            onSave={(v) => saveField("state", v)}
          />
          <InlineField
            type="text"
            label="ZIP"
            value={local.zip ?? ""}
            placeholder="ZIP"
            onSave={(v) => saveField("zip", v)}
          />
          <InlineField
            type="text"
            label="Notes"
            value={local.notes ?? ""}
            placeholder="Notes"
            onSave={(v) => saveField("notes", v)}
          />
        </div>
      </div>
    </div>
  );
}
