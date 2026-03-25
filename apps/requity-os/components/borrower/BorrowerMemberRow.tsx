"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { InlineField } from "@/components/ui/inline-field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Loader2, Link2, FolderOpen } from "lucide-react";
import { formatPhoneNumber } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";
import type { DealBorrowerMember } from "@/app/types/borrower";
import { BORROWER_ROLES } from "./constants";
import {
  updateBorrowerMemberAction,
  removeBorrowerMemberAction,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import { createBorrowerDriveFolder } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { BorrowerContactPicker } from "./BorrowerContactPicker";

interface BorrowerMemberRowProps {
  member: DealBorrowerMember;
  dealId: string;
  borrowingEntityId: string | null;
  existingContactIds: string[];
  onOptimisticUpdate: (
    memberId: string,
    updates: Partial<DealBorrowerMember>
  ) => void;
  /** Called only for structural changes (remove, link contact) that need a full re-fetch */
  onRemoved: () => void;
  /** Called when a contact is linked or created (structural change) */
  onLinked: () => void;
}

export function BorrowerMemberRow({
  member,
  dealId,
  borrowingEntityId,
  existingContactIds,
  onOptimisticUpdate,
  onRemoved,
  onLinked,
}: BorrowerMemberRowProps) {
  const [removing, setRemoving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  /** Save a single field. Optimistic update is instant; DB write is fire-and-forget
   *  with rollback on error. No re-fetch needed since the parent's state is the
   *  source of truth and is already updated optimistically. */
  const saveField = useCallback(
    async (field: keyof DealBorrowerMember, value: unknown) => {
      const current = (member as unknown as Record<string, unknown>)[field];
      if (current === value) return;
      const updates = { [field]: value };
      onOptimisticUpdate(member.id, updates);
      const result = await updateBorrowerMemberAction(
        member.id,
        dealId,
        updates
      );
      if (result.error) {
        onOptimisticUpdate(member.id, { [field]: current });
        showError(result.error);
      }
      // No onUpdated/re-fetch on success: optimistic state is already correct
    },
    [member, dealId, onOptimisticUpdate]
  );

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    try {
      const result = await removeBorrowerMemberAction(member.id, dealId);
      if (result.error) showError(result.error);
      else {
        setRemoveOpen(false);
        onRemoved();
      }
    } finally {
      setRemoving(false);
    }
  }, [member.id, dealId, onRemoved]);

  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(
    member.contact?.google_drive_folder_url ?? null
  );
  const [creatingDrive, setCreatingDrive] = useState(false);

  const hasContact = !!member.contact_id;

  return (
    <TableRow className="group/row hover:bg-muted/30 rq-transition">
      {/* Name (contact-connected field) */}
      <TableCell className="font-medium py-1.5">
        <div>
          <div className="flex items-center gap-1.5">
            <BorrowerContactPicker
              member={member}
              dealId={dealId}
              borrowingEntityId={borrowingEntityId}
              existingContactIds={existingContactIds}
              onLinked={onLinked}
            />
            {hasContact && (
              <Link
                href={`/contacts/${member.contact_id}`}
                className="text-muted-foreground hover:text-primary shrink-0"
                title="View linked contact"
              >
                <Link2 className="h-3 w-3" />
              </Link>
            )}
            {hasContact && driveFolderUrl && (
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary shrink-0"
                title="Open Drive folder"
              >
                <FolderOpen className="h-3 w-3" />
              </a>
            )}
            {hasContact && !driveFolderUrl && (
              <button
                type="button"
                className="text-muted-foreground/40 hover:text-primary shrink-0"
                title="Create Drive folder"
                disabled={creatingDrive}
                onClick={async () => {
                  setCreatingDrive(true);
                  const result = await createBorrowerDriveFolder(member.contact_id!, dealId);
                  setCreatingDrive(false);
                  if (result.error) {
                    showError("Could not create Drive folder", result.error);
                  } else {
                    if (result.folder_url) setDriveFolderUrl(result.folder_url);
                    showSuccess("Drive folder created");
                  }
                }}
              >
                {creatingDrive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FolderOpen className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
          {(() => {
            const email = member.contact?.email || member.email;
            const phone = member.contact?.phone || member.phone;
            const phoneFmt = phone ? formatPhoneNumber(phone) : "";
            const parts = [email, phoneFmt].filter(Boolean);
            return parts.length > 0 ? (
              <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-normal">
                {parts.join(" \u00b7 ")}
              </div>
            ) : null;
          })()}
        </div>
      </TableCell>

      {/* Role */}
      <TableCell className="py-1.5">
        <InlineField
          type="select"
          value={member.role}
          placeholder="Role"
          options={BORROWER_ROLES}
          onSave={(v) => saveField("role", v)}
        />
      </TableCell>

      {/* Ownership % */}
      <TableCell className="text-right py-1.5">
        <InlineField
          type="percent"
          value={member.ownership_pct ?? 0}
          placeholder="0%"
          min={0}
          max={100}
          align="right"
          onSave={(v) => saveField("ownership_pct", parseFloat(v) || 0)}
        />
      </TableCell>

      {/* FICO */}
      <TableCell className="text-right py-1.5">
        <InlineField
          type="number"
          value={member.credit_score > 0 ? member.credit_score : ""}
          placeholder="0"
          min={300}
          max={850}
          align="right"
          onSave={(v) => saveField("credit_score", parseInt(v) || 0)}
        />
      </TableCell>

      {/* Liquidity */}
      <TableCell className="text-right py-1.5">
        <InlineField
          type="currency"
          value={Number(member.liquidity) > 0 ? member.liquidity : ""}
          placeholder="$0"
          min={0}
          align="right"
          onSave={(v) => saveField("liquidity", parseFloat(v) || 0)}
        />
      </TableCell>

      {/* Net Worth */}
      <TableCell className="text-right py-1.5">
        <InlineField
          type="currency"
          value={Number(member.net_worth) > 0 ? member.net_worth : ""}
          placeholder="$0"
          min={0}
          align="right"
          onSave={(v) => saveField("net_worth", parseFloat(v) || 0)}
        />
      </TableCell>

      {/* Experience (years) */}
      <TableCell className="text-right py-1.5">
        <InlineField
          type="number"
          value={Number(member.experience) > 0 ? member.experience : ""}
          placeholder="0"
          min={0}
          max={99}
          align="right"
          onSave={(v) => saveField("experience", parseInt(v) || 0)}
        />
      </TableCell>

      {/* Guarantor */}
      <TableCell className="py-1.5">
        <Switch
          checked={member.is_guarantor}
          className="scale-90"
          onCheckedChange={async (checked) => {
            const previous = member.is_guarantor;
            onOptimisticUpdate(member.id, { is_guarantor: checked });
            const result = await updateBorrowerMemberAction(
              member.id,
              dealId,
              { is_guarantor: checked }
            );
            if (result.error) {
              onOptimisticUpdate(member.id, { is_guarantor: previous });
              showError(result.error);
            }
          }}
        />
      </TableCell>

      {/* Delete */}
      <TableCell className="w-8 py-1.5">
        <Popover open={removeOpen} onOpenChange={setRemoveOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/40 opacity-0 group-hover/row:opacity-100 hover:text-destructive rq-transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <p className="text-sm mb-3">Remove this borrower?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Yes"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRemoveOpen(false)}
              >
                No
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    </TableRow>
  );
}
