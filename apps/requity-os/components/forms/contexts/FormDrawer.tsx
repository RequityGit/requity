"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FormEngine } from "../FormEngine";
import type { FormEngineProps } from "@/lib/form-engine/types";

interface FormDrawerProps extends Omit<FormEngineProps, "context"> {
  open: boolean;
  title?: string;
}

export function FormDrawer({ open, title, onClose, ...props }: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title || "Form"}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FormEngine {...props} context="drawer" onClose={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
