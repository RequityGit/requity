"use client";

import {
  CheckCircle2,
  Clock,
  FileSignature,
  XCircle,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { EsignSubmission, EsignSubmissionStatus } from "@/lib/esign/esign-types";

interface EsignActivityCardProps {
  submission: EsignSubmission;
  onClick?: () => void;
}

const statusDisplay: Record<
  EsignSubmissionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileSignature },
  pending: { label: "Awaiting Signatures", variant: "outline", icon: Clock },
  partially_signed: { label: "Partially Signed", variant: "outline", icon: FileSignature },
  completed: { label: "Fully Signed", variant: "default", icon: CheckCircle2 },
  declined: { label: "Declined", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "secondary", icon: Clock },
  voided: { label: "Voided", variant: "secondary", icon: Ban },
};

export function EsignActivityCard({ submission, onClick }: EsignActivityCardProps) {
  const config = statusDisplay[submission.status];
  const Icon = config.icon;
  const signers = submission.signers ?? [];
  const signedCount = signers.filter((s) => s.status === "signed").length;

  return (
    <div
      className="rq-list-row gap-3 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{submission.document_name}</p>
        <p className="text-xs text-muted-foreground">
          {signedCount} of {signers.length} signed
          {signers.length > 0 && (
            <> &middot; {signers.map((s) => s.name).join(", ")}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={config.variant} className="text-[10px]">
          {config.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {formatDateTime(submission.created_at)}
        </span>
      </div>
    </div>
  );
}
