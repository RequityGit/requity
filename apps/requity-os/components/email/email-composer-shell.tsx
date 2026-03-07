"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Minus, Maximize2, Minimize2, X } from "lucide-react";

type ComposerMode = "normal" | "minimized" | "expanded";

interface EmailComposerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isDirty: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function EmailComposerShell({
  open,
  onClose,
  title,
  subtitle,
  isDirty,
  children,
  footer,
}: EmailComposerShellProps) {
  const [mode, setMode] = useState<ComposerMode>("normal");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset mode when opened
  useEffect(() => {
    if (open) setMode("normal");
  }, [open]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMode("minimized");
      }
    },
    []
  );

  if (!open) return null;

  return (
    <>
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed bottom-0 right-6 z-50 flex flex-col rounded-t-lg border border-border bg-background shadow-xl transition-all duration-200",
          "max-sm:inset-x-0 max-sm:right-0",
          mode === "expanded" ? "sm:w-[700px]" : "sm:w-[520px]"
        )}
      >
        {/* Header bar */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/50 border-b rounded-t-lg",
            mode === "minimized" && "cursor-pointer border-b-0"
          )}
          onClick={() => mode === "minimized" && setMode("normal")}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{title}</p>
            {subtitle && mode !== "minimized" && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === "minimized" ? "normal" : "minimized");
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === "expanded" ? "normal" : "expanded");
              }}
            >
              {mode === "expanded" ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body + Footer — hidden when minimized */}
        {mode !== "minimized" && (
          <>
            <div
              className={cn(
                "flex-1 overflow-y-auto p-4 space-y-3",
                mode === "expanded" ? "max-h-[600px]" : "max-h-[500px]"
              )}
            >
              {children}
            </div>
            <div className="flex items-center justify-between border-t px-4 py-2.5">
              {footer}
            </div>
          </>
        )}
      </div>

      {/* Close confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard email?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard this
              email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
