"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { deleteDocumentAction } from "@/app/(authenticated)/(admin)/documents/actions";

interface DocumentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    file_name: string;
    source: "loan" | "contact" | "company" | "deal";
  } | null;
}

export function DocumentDeleteDialog({
  open,
  onOpenChange,
  document,
}: DocumentDeleteDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!document) return;
    startTransition(async () => {
      const result = await deleteDocumentAction(document.id, document.source);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document deleted");
        router.refresh();
        onOpenChange(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{" "}
            <span className="font-medium">{document?.file_name}</span> from the
            document center. This action can be reversed by a super admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
