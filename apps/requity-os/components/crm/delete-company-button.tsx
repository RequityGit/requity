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
import { deleteCrmCompanyAction } from "@/app/(authenticated)/admin/crm/actions";

interface DeleteCompanyButtonProps {
  companyId: string;
  companyName: string;
  variant?: "icon" | "button";
  onDeleted?: () => void;
}

export function DeleteCompanyButton({
  companyId,
  companyName,
  variant = "button",
  onDeleted,
}: DeleteCompanyButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteCrmCompanyAction(companyId);

      if (result.error) {
        toast({
          title: "Error deleting company",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Company deleted" });

      if (onDeleted) {
        onDeleted();
      }

      router.refresh();
    } catch {
      toast({
        title: "Error deleting company",
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
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Company</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{companyName}&quot;? This
            company will be removed from the CRM. This action cannot be undone.
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
