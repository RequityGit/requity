"use client";

import { useState, useRef } from "react";
import { Upload, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConditionDocumentCard } from "./ConditionDocumentCard";
import { LinkExistingPicker } from "./LinkExistingPicker";
import type { ConditionDocument } from "./useActionCenterData";
import type { ReviewStatus } from "./useConditionDocuments";

interface ConditionDocumentsProps {
  conditionId: string;
  dealId: string;
  docs: ConditionDocument[];
  unlinkedDocs: ConditionDocument[];
  reviewStatuses: Record<string, ReviewStatus>;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  onLink: (docId: string) => Promise<void>;
  onRetriggerReview: (docId: string) => Promise<void>;
  onPreview: (doc: ConditionDocument) => void;
  onDownload: (doc: ConditionDocument) => void;
}

export function ConditionDocuments({
  docs,
  unlinkedDocs,
  reviewStatuses,
  isUploading,
  onUpload,
  onDelete,
  onLink,
  onRetriggerReview,
  onPreview,
  onDownload,
}: ConditionDocumentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((f) => onUpload(f));
  };

  return (
    <div className="border-b p-4 space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="rq-micro-label">
          Documents ({docs.length})
        </span>
        {unlinkedDocs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-muted-foreground"
            onClick={() => setShowLinkPicker(!showLinkPicker)}
          >
            <Link2 className="h-3 w-3 mr-1" />
            Link Existing
          </Button>
        )}
      </div>

      {/* Upload zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer rq-transition",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground hover:bg-muted/20"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-xs text-muted-foreground">
          Drop files here or <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-[10.5px] text-muted-foreground/60 mt-1">
          PDF, images, Word, Excel up to 25MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Link existing picker */}
      {showLinkPicker && (
        <LinkExistingPicker
          docs={unlinkedDocs}
          onLink={(docId) => {
            onLink(docId);
            setShowLinkPicker(false);
          }}
          onClose={() => setShowLinkPicker(false)}
        />
      )}

      {/* Document list */}
      {docs.length === 0 ? (
        <EmptyState
          title="No documents"
          description="Upload or link a document to this condition"
          compact
        />
      ) : (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <ConditionDocumentCard
              key={doc.id}
              doc={doc}
              reviewStatus={reviewStatuses[doc.id]}
              onPreview={() => onPreview(doc)}
              onDownload={() => onDownload(doc)}
              onDelete={() => onDelete(doc.id)}
              onRetriggerReview={() => onRetriggerReview(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
