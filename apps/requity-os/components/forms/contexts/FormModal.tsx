"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormEngine } from "../FormEngine";
import type { FormEngineProps } from "@/lib/form-engine/types";

interface FormModalProps extends Omit<FormEngineProps, "context"> {
  open: boolean;
  title?: string;
}

export function FormModal({ open, title, onClose, ...props }: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title || "Form"}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <FormEngine {...props} context="modal" onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
