"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { renameDocumentAction } from "@/app/(authenticated)/admin/documents/actions";

interface DocumentRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    source: "loan" | "contact" | "company" | "deal";
  } | null;
}

export function DocumentRenameDialog({
  open,
  onOpenChange,
  document,
}: DocumentRenameDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(document?.file_name ?? "");
  const [isPending, startTransition] = useTransition();

  // Sync name when document changes
  if (document && name === "" && document.file_name) {
    setName(document.file_name);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setName("");
    onOpenChange(nextOpen);
  }

  function handleSave() {
    if (!document) return;
    startTransition(async () => {
      const result = await renameDocumentAction(
        document.id,
        document.source,
        name
      );
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document renamed");
        router.refresh();
        handleOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="doc-name">Name</Label>
          <Input
            id="doc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) handleSave();
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim()}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
