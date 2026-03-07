"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { UploadRentRollDialog } from "@/components/admin/commercial-uw/upload-rent-roll-dialog";
import type { RentRollRow } from "@/lib/commercial-uw/types";
import type { RentRollImportMetadata } from "@/components/admin/commercial-uw/upload-rent-roll-dialog";
import { uploadPropertyRentRoll } from "@/app/(authenticated)/admin/pipeline/debt/[id]/property-financial-actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  userId: string;
}

export function UploadPropertyRentRollDialog({
  open,
  onOpenChange,
  propertyId,
  userId,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [asOfDate, setAsOfDate] = useState("");
  const [setAsCurrent, setSetAsCurrent] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStartUpload = () => {
    if (!asOfDate) {
      toast({
        title: "Date required",
        description: "Please select a rent roll as-of date.",
        variant: "destructive",
      });
      return;
    }
    setShowUpload(true);
  };

  const handleImport = async (
    rows: RentRollRow[],
    metadata: RentRollImportMetadata
  ) => {
    setSaving(true);
    try {
      const result = await uploadPropertyRentRoll(
        propertyId,
        asOfDate,
        null,
        metadata.filename,
        metadata.columnMapping,
        rows,
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
          title: "Rent roll uploaded",
          description: `${rows.length} units imported (as of ${new Date(asOfDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`,
        });
        router.refresh();
        handleClose();
      }
    } catch (err) {
      console.error("Rent roll upload error:", err);
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
    setShowUpload(false);
    setAsOfDate("");
    setSetAsCurrent(true);
    onOpenChange(false);
  };

  // When the upload dialog is active, render it directly
  if (showUpload) {
    return (
      <UploadRentRollDialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowUpload(false);
          }
        }}
        onImport={handleImport}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Rent Roll</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Rent Roll As-Of Date
            </Label>
            <DatePicker
              value={asOfDate}
              onChange={setAsOfDate}
              placeholder="Select as-of date"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="set-current-rr"
              checked={setAsCurrent}
              onCheckedChange={(checked) =>
                setSetAsCurrent(checked === true)
              }
            />
            <Label htmlFor="set-current-rr" className="text-sm cursor-pointer">
              Set as current rent roll
            </Label>
          </div>
          <button
            onClick={handleStartUpload}
            disabled={!asOfDate || saving}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Upload
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
