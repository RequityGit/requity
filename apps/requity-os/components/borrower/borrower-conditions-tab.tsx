"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileUpload } from "@/components/shared/file-upload";
import { DocumentDownload } from "@/components/borrower/document-download";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Paperclip,
  FileText,
  Upload,
} from "lucide-react";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import {
  uploadConditionDocument,
} from "@/app/(authenticated)/borrower/loans/[id]/actions";
import type { Tables } from "@/lib/supabase/types";

type LoanCondition = Tables<"loan_conditions">;
type LoanDocument = Tables<"loan_documents">;

interface BorrowerConditionsTabProps {
  conditions: LoanCondition[];
  loanId: string;
  currentUserId: string;
}

const COMPLETE_STATUSES = ["approved", "waived", "not_applicable"];

export function BorrowerConditionsTab({
  conditions,
  loanId,
  currentUserId,
}: BorrowerConditionsTabProps) {
  // Show all conditions (not just borrower-assigned) so borrowers can track overall progress
  const outstanding = conditions.filter(
    (c) => !COMPLETE_STATUSES.includes(c.status)
  );
  const complete = conditions.filter((c) =>
    COMPLETE_STATUSES.includes(c.status)
  );

  if (conditions.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No conditions yet</p>
        <p className="text-xs mt-1">
          Conditions will appear here once your loan processor sets them up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-lg border px-4 py-3 text-center">
          <p className="text-2xl font-semibold num text-foreground">
            {conditions.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="bg-card rounded-lg border px-4 py-3 text-center">
          <p className="text-2xl font-semibold num text-amber-600 dark:text-amber-400">
            {outstanding.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Outstanding</p>
        </div>
        <div className="bg-card rounded-lg border px-4 py-3 text-center">
          <p className="text-2xl font-semibold num text-green-600 dark:text-green-400">
            {complete.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Complete</p>
        </div>
      </div>

      {/* Outstanding conditions */}
      {outstanding.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Outstanding ({outstanding.length})
          </h3>
          {outstanding.map((c) => (
            <BorrowerConditionCard
              key={c.id}
              condition={c}
              loanId={loanId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Completed conditions */}
      {complete.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
            Complete ({complete.length})
          </h3>
          {complete.map((c) => (
            <BorrowerConditionCard
              key={c.id}
              condition={c}
              loanId={loanId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual borrower-facing condition card
// ---------------------------------------------------------------------------
function BorrowerConditionCard({
  condition,
  loanId,
  currentUserId,
}: {
  condition: LoanCondition;
  loanId: string;
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const isComplete = COMPLETE_STATUSES.includes(condition.status);
  const isOverdue =
    !isComplete &&
    condition.due_date &&
    new Date(condition.due_date) < new Date();

  async function loadData() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const docsRes = await supabase
      .from("loan_documents")
      .select("*")
      .eq("condition_id", condition.id)
      .order("created_at", { ascending: false });
    setDocuments(docsRes.data ?? []);
    setDataLoaded(true);
  }

  async function handleToggle() {
    if (!expanded && !dataLoaded) {
      await loadData();
    }
    setExpanded((prev) => !prev);
  }

  async function handleUploadDocument() {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("conditionId", condition.id);
      formData.append("loanId", loanId);

      const result = await uploadConditionDocument(formData);
      if (result.error) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        await loadData();
        setSelectedFile(null);
        setShowUpload(false);
        toast({ title: "Document uploaded successfully" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Card header row */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
          isComplete
            ? "bg-green-50/50 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30"
            : isOverdue
              ? "bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30"
              : "bg-card hover:bg-muted"
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {condition.condition_name}
            </span>
            {condition.critical_path_item && (
              <Badge className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0">
                Required
              </Badge>
            )}
            <StatusBadge status={condition.status} />
          </div>

          {condition.borrower_description && (
            <p className="text-xs text-muted-foreground mt-1">
              {condition.borrower_description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            {condition.due_date && (
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                Due: {formatDate(condition.due_date)}
              </span>
            )}
            {condition.received_date && (
              <span>Received: {formatDate(condition.received_date)}</span>
            )}
            {condition.approved_date && (
              <span className="text-green-700 dark:text-green-400">
                Approved: {formatDate(condition.approved_date)}
              </span>
            )}
          </div>

          {condition.rejection_reason && (
            <p className="text-xs text-destructive mt-1.5 font-medium">
              Action needed: {condition.rejection_reason}
            </p>
          )}

          {/* Activity summary hint */}
          {dataLoaded && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {documents.length} file{documents.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 ml-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t bg-muted/60 p-4 space-y-5">
          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Uploaded Documents ({documents.length})
              </h4>
              {!isComplete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setShowUpload((prev) => !prev)}
                >
                  <Upload className="h-3 w-3" />
                  Upload File
                </Button>
              )}
            </div>

            {showUpload && !isComplete && (
              <div className="space-y-2 rounded-lg border bg-card p-3">
                <FileUpload
                  onFileSelect={(file) => setSelectedFile(file)}
                  maxSize={25}
                />
                {selectedFile && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedFile(null);
                        setShowUpload(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleUploadDocument}
                      disabled={loading}
                    >
                      {loading ? "Uploading..." : "Submit Document"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No files uploaded yet.
                {!isComplete && " Use the Upload button to attach documents."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 text-xs bg-card rounded border px-3 py-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="flex-1 truncate">{doc.document_name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </span>
                    <DocumentDownload
                      filePath={doc.file_url}
                      fileName={doc.document_name}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Notes */}
          <UnifiedNotes
            entityType="condition"
            entityId={condition.id}
            loanId={loanId}
            compact
          />
        </div>
      )}
    </div>
  );
}
