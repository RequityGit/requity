"use client";

import { useState, useEffect } from "react";
import { FileSignature, Loader2 } from "lucide-react";
import { getDealSignatures } from "@/app/(authenticated)/(admin)/pipeline/[id]/esign-actions";
import { SignatureStatus } from "@/components/esign/signature-status";
import { EsignActivityCard } from "@/components/esign/esign-activity-card";
import { EmptyState } from "@/components/shared/EmptyState";
import type { EsignSubmission } from "@/lib/esign/esign-types";

interface EsignSectionProps {
  dealId: string;
  refreshKey?: number;
}

export function EsignSection({ dealId, refreshKey }: EsignSectionProps) {
  const [submissions, setSubmissions] = useState<EsignSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const numDealId = parseInt(dealId, 10);
      if (isNaN(numDealId)) {
        setLoading(false);
        return;
      }
      const result = await getDealSignatures(numDealId);
      if (result.submissions) {
        setSubmissions(result.submissions);
      }
      setLoading(false);
    }
    load();
  }, [dealId, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No signature requests"
        description="Send a document for e-signature to get started."
        compact
      />
    );
  }

  return (
    <div className="space-y-3">
      {expanded !== null ? (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(null)}
            className="text-xs text-primary hover:underline mb-2"
          >
            &larr; Back to list
          </button>
          <SignatureStatus
            submission={submissions.find((s) => s.id === expanded)!}
            onVoided={() => {
              setSubmissions((prev) =>
                prev.map((s) =>
                  s.id === expanded ? { ...s, status: "voided" as const } : s
                )
              );
              setExpanded(null);
            }}
          />
        </div>
      ) : (
        <div className="rq-card-wrapper">
          <div className="rq-card-header">
            <div className="flex items-center gap-2">
              <FileSignature
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.5}
              />
              <h4 className="rq-micro-label">E-Signatures</h4>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {submissions.length}
            </span>
          </div>
          {submissions.map((sub) => (
            <EsignActivityCard
              key={sub.id}
              submission={sub}
              onClick={() => setExpanded(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
