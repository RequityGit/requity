"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { processFormSubmissionAction } from "@/app/(authenticated)/control-center/forms/review/actions";
import type { Database } from "@/lib/supabase/types";

type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"] & {
  form_definitions: Database["public"]["Tables"]["form_definitions"]["Row"] | null;
};

interface FormSubmissionReviewModalProps {
  submission: FormSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormSubmissionReviewModal({
  submission,
  open,
  onOpenChange,
}: FormSubmissionReviewModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const formData = (submission.data as Record<string, unknown>) || {};
  const entityIds = (submission.entity_ids as Record<string, unknown>) || {};

  // Pre-fill from form data
  const prefilledDealName = (formData.deal_name as string) || 
    (formData.full_name ? `${formData.full_name} - ${formData.property_address || "Deal"}` : "New Deal");
  const prefilledLoanType = (formData.loan_type as string) || (formData.category as string) || "";
  const prefilledLoanAmount = (formData.loan_amount as string) || (formData.proposed_loan_amount as string) || "";

  const [dealName, setDealName] = useState(prefilledDealName);
  const [loanType, setLoanType] = useState(prefilledLoanType);
  const [loanAmount, setLoanAmount] = useState(prefilledLoanAmount);
  const [notes, setNotes] = useState("");

  const handleCreateOpportunity = () => {
    if (!dealName.trim()) {
      toast({
        title: "Deal name is required",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await processFormSubmissionAction({
        submissionId: submission.id,
        action: "create_opportunity",
        dealName: dealName.trim(),
        loanType: loanType || null,
        loanAmount: loanAmount ? parseFloat(loanAmount.replace(/[^0-9.]/g, "")) : null,
        notes: notes.trim() || null,
      });

      if (result.error) {
        toast({
          title: "Failed to create opportunity",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Opportunity created successfully",
          description: `Deal "${dealName}" has been created and linked to this submission.`,
        });
        onOpenChange(false);
        router.push(`/originations/${result.opportunityId}`);
      }
    });
  };

  const handleMarkReviewed = () => {
    startTransition(async () => {
      const result = await processFormSubmissionAction({
        submissionId: submission.id,
        action: "mark_reviewed",
      });

      if (result.error) {
        toast({
          title: "Failed to update submission",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission marked as reviewed",
        });
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Form Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {submission.form_definitions?.name || "Unknown Form"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge variant={submission.status === "pending_review" ? "destructive" : "secondary"}>
                {submission.status}
              </Badge>
            </div>

            {submission.submitted_by_email && (
              <div className="text-sm">
                <span className="text-muted-foreground">Submitted by: </span>
                <span className="text-foreground">{submission.submitted_by_email}</span>
              </div>
            )}

            {submission.internal_notes && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-destructive mb-1">Error Details</p>
                    <p className="text-xs text-destructive/80">{submission.internal_notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Entities Created */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Entities Created</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {entityIds.contact_id ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600" />
                )}
                <span className="text-sm">Contact</span>
                {entityIds.contact_id && (
                  <Badge variant="outline" className="text-xs">
                    Created
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {entityIds.property_id ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600" />
                )}
                <span className="text-sm">Property</span>
                {entityIds.property_id && (
                  <Badge variant="outline" className="text-xs">
                    Created
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {entityIds.company_id ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600" />
                )}
                <span className="text-sm">Company</span>
                {entityIds.company_id && (
                  <Badge variant="outline" className="text-xs">
                    Created
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {entityIds.opportunity_id ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <AlertCircle size={16} className="text-destructive" />
                )}
                <span className="text-sm">Opportunity</span>
                {entityIds.opportunity_id ? (
                  <Badge variant="outline" className="text-xs">
                    Created
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Missing
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Form Data Preview */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Form Data</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {Object.entries(formData)
                .filter(([key]) => !key.startsWith("_"))
                .slice(0, 10)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="text-foreground font-medium">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              {Object.keys(formData).length > 10 && (
                <p className="text-xs text-muted-foreground">
                  +{Object.keys(formData).length - 10} more fields
                </p>
              )}
            </div>
          </div>

          {/* Create Opportunity Form */}
          {!entityIds.opportunity_id && (
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Create Opportunity</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="deal-name">Deal Name *</Label>
                  <Input
                    id="deal-name"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    placeholder="Enter deal name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="loan-type">Loan Type</Label>
                    <Select value={loanType} onValueChange={setLoanType}>
                      <SelectTrigger id="loan-type">
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="dscr">DSCR</SelectItem>
                        <SelectItem value="guc">Ground-Up Construction</SelectItem>
                        <SelectItem value="rtl">Residential</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="loan-amount">Loan Amount</Label>
                    <Input
                      id="loan-amount"
                      type="text"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="$0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this submission..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleCreateOpportunity}
                  disabled={isPending || !dealName.trim()}
                >
                  {isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <CheckCircle size={16} className="mr-2" />
                  )}
                  Create Opportunity
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMarkReviewed}
                  disabled={isPending}
                >
                  Mark as Reviewed
                </Button>
              </div>
            </div>
          )}

          {/* If opportunity already exists */}
          {entityIds.opportunity_id && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle size={16} />
                <span>Opportunity already created. This submission is ready to be marked as reviewed.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleMarkReviewed}
                disabled={isPending}
              >
                Mark as Reviewed
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
