"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";
import { deleteLoanAction } from "@/app/(authenticated)/admin/loans/actions";

interface DeleteLoanButtonProps {
  loanId: string;
  loanNumber: string | null;
}

export function DeleteLoanButton({ loanId, loanNumber }: DeleteLoanButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteLoanAction(loanId);

      if (result.error) {
        toast({
          title: "Error deleting loan",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Loan deleted" });
      router.push("/admin/loans");
    } catch {
      toast({
        title: "Error deleting loan",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete Loan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Loan</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete loan{" "}
            {loanNumber ? `"${loanNumber}"` : "this loan"}? This will also
            remove all associated conditions. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
