"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle, Send, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateChecklist,
  submitForApproval,
  resubmitApproval,
} from "@/app/(authenticated)/admin/operations/approvals/actions";
import type { ApprovalEntityType, ChecklistResult } from "@/lib/approvals/types";

interface SubmitForApprovalDialogProps {
  entityType: ApprovalEntityType;
  entityId: string;
  entityData: Record<string, any>;
  dealSnapshot: Record<string, any>;
  /** If provided, this is a resubmission */
  existingApprovalId?: string;
  trigger?: React.ReactNode;
}

export function SubmitForApprovalDialog({
  entityType,
  entityId,
  entityData,
  dealSnapshot,
  existingApprovalId,
  trigger,
}: SubmitForApprovalDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"validating" | "results" | "submit">("validating");
  const [checklistResults, setChecklistResults] = useState<ChecklistResult[]>([]);
  const [allPassed, setAllPassed] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setStep("validating");
      setChecklistResults([]);
      setAllPassed(false);
      setSubmissionNotes("");

      // Run validation
      const result = await validateChecklist(entityType, entityData);
      setChecklistResults(result.results);
      setAllPassed(result.passed);
      setStep("results");
    }
  }

  async function handleSubmit() {
    setLoading(true);

    let result;
    if (existingApprovalId) {
      result = await resubmitApproval({
        approvalId: existingApprovalId,
        dealSnapshot,
        checklistResults,
        submissionNotes: submissionNotes || undefined,
      });
    } else {
      result = await submitForApproval({
        entityType,
        entityId,
        submissionNotes: submissionNotes || undefined,
        dealSnapshot,
        checklistResults,
      });
    }

    setLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: existingApprovalId ? "Resubmitted" : "Submitted for Approval",
        description: "The approval request has been sent to the assigned approver.",
      });
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-[#1a2b4a] hover:bg-[#1a2b4a]/90">
            <Send className="h-4 w-4" />
            {existingApprovalId ? "Resubmit for Approval" : "Submit for Approval"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {existingApprovalId ? "Resubmit for Approval" : "Submit for Approval"}
          </DialogTitle>
        </DialogHeader>

        {step === "validating" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Running validation checklist...</span>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 py-2">
            {/* Checklist Results */}
            {checklistResults.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  Validation Checklist
                  {allPassed ? (
                    <span className="text-green-600 text-xs font-normal">All passed</span>
                  ) : (
                    <span className="text-red-600 text-xs font-normal">
                      {checklistResults.filter((r) => !r.passed).length} item(s) failed
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {checklistResults.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        item.passed ? "bg-green-50" : "bg-red-50"
                      )}
                    >
                      {item.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className={item.passed ? "text-green-800" : "text-red-800"}>
                        {item.label}
                      </span>
                      {item.reason && (
                        <span className="text-xs text-red-600 ml-auto">{item.reason}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!allPassed && checklistResults.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Fix these items before submitting</p>
                  <p className="text-xs text-amber-700 mt-1">
                    All validation items must pass before you can submit for approval.
                  </p>
                </div>
              </div>
            )}

            {allPassed && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Submission Notes <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Add context for the approver..."
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="gap-2 bg-[#1a2b4a] hover:bg-[#1a2b4a]/90"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Send className="h-4 w-4" />
                    {existingApprovalId ? "Resubmit" : "Submit"}
                  </Button>
                </DialogFooter>
              </>
            )}

            {!allPassed && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
