"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRightCircle } from "lucide-react";
import { moveToServicingAction } from "@/app/(authenticated)/admin/servicing/actions";

interface MoveToServicingButtonProps {
  loanId: string;
  loanNumber: string | null;
  currentStage: string;
}

const ELIGIBLE_STAGES = [
  "funded",
  "servicing",
  "clear_to_close",
  "approved",
];

export function MoveToServicingButton({
  loanId,
  loanNumber,
  currentStage,
}: MoveToServicingButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (!ELIGIBLE_STAGES.includes(currentStage)) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await moveToServicingAction(loanId);

      if ("error" in result && result.error) {
        toast({
          title: "Error moving to servicing",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Loan moved to servicing",
        description: `${loanNumber ?? "Loan"} has been boarded to the servicing portfolio.`,
      });

      setOpen(false);
      // Navigate to the servicing detail page
      if (result.loanId) {
        router.push(`/admin/servicing/${encodeURIComponent(result.loanId)}`);
      } else {
        router.push("/admin/servicing");
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <ArrowRightCircle className="h-4 w-4" />
        Move to Servicing
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Loan to Servicing</DialogTitle>
            <DialogDescription>
              This will create a servicing record for{" "}
              <span className="font-semibold">{loanNumber ?? loanId}</span> and
              copy all loan data, including the construction budget and draw
              history. The pipeline loan stage will be updated to
              &quot;Servicing&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? "Moving..." : "Confirm Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
