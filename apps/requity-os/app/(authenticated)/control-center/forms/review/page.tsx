"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Eye, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FormSubmissionReviewModal } from "@/components/forms/FormSubmissionReviewModal";
import type { Database } from "@/lib/supabase/types";

type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"] & {
  form_definitions: Database["public"]["Tables"]["form_definitions"]["Row"] | null;
};

export default function FormSubmissionsReviewPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase: any = createClient();
      const { data, error } = await supabase
        .from("form_submissions")
        .select(`
          *,
          form_definitions (*)
        `)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load submissions:", error);
      } else {
        setSubmissions((data || []) as FormSubmission[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleReview = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSubmission(null);
    // Reload submissions after review
    window.location.reload();
  };

  const getEntitySummary = (entityIds: Record<string, unknown> | null) => {
    if (!entityIds || typeof entityIds !== "object") return "None";
    const entities = [];
    if (entityIds.contact_id) entities.push("Contact");
    if (entityIds.property_id) entities.push("Property");
    if (entityIds.company_id) entities.push("Company");
    if (entityIds.opportunity_id) entities.push("Opportunity");
    return entities.length > 0 ? entities.join(", ") : "None";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Form Submissions Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review form submissions that require manual opportunity creation.
        </p>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Entities Created</TableHead>
              <TableHead>Error</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  Loading...
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                  No submissions pending review.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => {
                const entityIds = (submission.entity_ids as Record<string, unknown>) || {};
                const hasError = !!submission.internal_notes;
                
                return (
                  <TableRow key={submission.id} className="hover:bg-accent/50">
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {submission.form_definitions?.name || "Unknown Form"}
                      </div>
                      {submission.form_definitions?.slug && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          /forms/{submission.form_definitions.slug}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {submission.submitted_by_email || submission.submitted_by || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getEntitySummary(entityIds)}</div>
                      {!entityIds.opportunity_id && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Missing Opportunity
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasError ? (
                        <div className="flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle size={12} />
                          <span className="truncate max-w-[200px]" title={submission.internal_notes || undefined}>
                            {submission.internal_notes?.substring(0, 50) || "Error occurred"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(submission)}
                      >
                        <Eye size={14} strokeWidth={1.5} className="mr-1.5" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedSubmission && (
        <FormSubmissionReviewModal
          submission={selectedSubmission}
          open={modalOpen}
          onOpenChange={handleModalClose}
        />
      )}
    </div>
  );
}
