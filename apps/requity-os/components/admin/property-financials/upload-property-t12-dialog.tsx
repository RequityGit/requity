"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { UploadT12HistoricalsDialog } from "@/components/admin/commercial-uw/upload-t12-historicals-dialog";
import type { T12HistoricalsImportData } from "@/components/admin/commercial-uw/upload-t12-historicals-dialog";
import { uploadPropertyT12 } from "@/app/(authenticated)/admin/pipeline/debt/[id]/property-financial-actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  userId: string;
}

export function UploadPropertyT12Dialog({
  open,
  onOpenChange,
  propertyId,
  userId,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [setAsCurrent, setSetAsCurrent] = useState(true);
  const [showPreDialog, setShowPreDialog] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleImport = async (data: T12HistoricalsImportData) => {
    setSaving(true);
    try {
      const lineItems = data.lineItems.map((item, i) => {
        const mapping = data.mappings.find((m) => m.lineItemIndex === i);
        return {
          original_row_label: item.original_row_label,
          mapped_category: mapping?.mapped_category ?? null,
          is_income: item.is_income,
          is_excluded: mapping?.is_excluded ?? false,
          exclusion_reason: mapping?.exclusion_reason ?? null,
          amounts: item.amounts,
          annual_total: item.annual_total,
          sort_order: item.sort_order,
        };
      });

      const result = await uploadPropertyT12(
        propertyId,
        data.periodStart,
        data.periodEnd,
        data.sourceLabel || null,
        data.fileName || null,
        data.monthLabels,
        lineItems,
        userId,
        setAsCurrent
      );

      if (result.error) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "T12 uploaded",
          description: `${data.lineItems.length} line items imported (${data.periodStart} to ${data.periodEnd})`,
        });
        router.refresh();
        handleClose();
      }
    } catch (err) {
      console.error("T12 upload error:", err);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setShowPreDialog(true);
    setSetAsCurrent(true);
    onOpenChange(false);
  };

  // Show the full T12 historicals upload dialog
  if (!showPreDialog) {
    return (
      <UploadT12HistoricalsDialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
        onImport={handleImport}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload T12 Operating Statement</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a trailing 12-month income and expense statement. You&apos;ll map
            the period dates and line items in the next step.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="set-current-t12"
              checked={setAsCurrent}
              onCheckedChange={(checked) =>
                setSetAsCurrent(checked === true)
              }
            />
            <Label htmlFor="set-current-t12" className="text-sm cursor-pointer">
              Set as current T12
            </Label>
          </div>
          <button
            onClick={() => setShowPreDialog(false)}
            disabled={saving}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Upload
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
