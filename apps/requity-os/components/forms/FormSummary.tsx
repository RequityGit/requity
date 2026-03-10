"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormSummaryProps {
  message: string;
  onClose?: () => void;
}

export function FormSummary({ message, onClose }: FormSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
        <CheckCircle size={32} strokeWidth={1.5} className="text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Submitted</h2>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      {onClose && (
        <Button variant="outline" onClick={onClose} className="mt-6">
          Close
        </Button>
      )}
    </div>
  );
}
