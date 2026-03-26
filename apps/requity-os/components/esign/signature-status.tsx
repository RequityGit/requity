"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Mail,
  XCircle,
  Ban,
  Download,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/lib/toast";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  voidSignatureRequest,
  resendSignatureRequest,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/esign-actions";
import type {
  EsignSubmission,
  EsignSignerStatus,
  EsignSubmissionStatus,
} from "@/lib/esign/esign-types";
import { formatDateTime } from "@/lib/format";

interface SignatureStatusProps {
  submission: EsignSubmission;
  onVoided?: () => void;
  onDownload?: (storagePath: string) => void;
}

const statusConfig: Record<
  EsignSubmissionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  pending: { label: "Pending", variant: "outline", icon: Clock },
  partially_signed: { label: "Partially Signed", variant: "outline", icon: Eye },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  declined: { label: "Declined", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "secondary", icon: Clock },
  voided: { label: "Voided", variant: "secondary", icon: Ban },
};

const signerStatusIcon: Record<EsignSignerStatus, typeof Clock> = {
  pending: Clock,
  sent: Mail,
  opened: Eye,
  signed: CheckCircle2,
  declined: XCircle,
};

export function SignatureStatus({
  submission,
  onVoided,
  onDownload,
}: SignatureStatusProps) {
  const [isResending, setIsResending] = useState<string | null>(null);
  const confirm = useConfirm();

  const config = statusConfig[submission.status];
  const StatusIcon = config.icon;

  const signers = submission.signers ?? [];
  const signedCount = signers.filter((s) => s.status === "signed").length;

  async function handleVoid() {
    const ok = await confirm({
      title: "Void signature request?",
      description:
        "This will cancel the signature request for all signers. This action cannot be undone.",
      confirmLabel: "Void Request",
      destructive: true,
    });

    if (!ok) return;

    const result = await voidSignatureRequest(submission.id);
    if (result.error) {
      showError("Could not void request", result.error);
    } else {
      showSuccess("Signature request voided");
      onVoided?.();
    }
  }

  async function handleResend(email: string) {
    setIsResending(email);
    const result = await resendSignatureRequest(submission.id, email);
    if (result.error) {
      showError("Could not resend", result.error);
    } else {
      showSuccess("Reminder sent");
    }
    setIsResending(null);
  }

  return (
    <div className="rq-card-wrapper">
      <div className="rq-card-header">
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <h4 className="rq-micro-label">E-Signature Status</h4>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      <div className="rq-card">
        <div className="space-y-1 mb-4">
          <p className="text-sm font-medium">{submission.document_name}</p>
          <p className="text-xs text-muted-foreground">
            {signedCount} of {signers.length} signed
          </p>
        </div>

        <div className="space-y-2">
          {signers.map((signer) => {
            const SignerIcon = signerStatusIcon[signer.status];
            return (
              <div
                key={signer.id}
                className="rq-list-row gap-3 items-center"
              >
                <SignerIcon
                  className={`h-4 w-4 shrink-0 ${
                    signer.status === "signed"
                      ? "text-emerald-500"
                      : signer.status === "declined"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                  strokeWidth={1.5}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{signer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {signer.email}
                    {signer.role !== "signer" && (
                      <span className="ml-1 capitalize">({signer.role})</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {signer.signed_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(signer.signed_at)}
                    </span>
                  )}
                  {["pending", "sent", "opened"].includes(signer.status) &&
                    submission.status !== "voided" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(signer.email)}
                        disabled={isResending === signer.email}
                        className="h-7 text-xs"
                      >
                        <RefreshCw
                          className={`h-3 w-3 mr-1 ${
                            isResending === signer.email ? "animate-spin" : ""
                          }`}
                        />
                        Resend
                      </Button>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          {submission.status === "completed" &&
            submission.documents?.[0]?.storage_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onDownload?.(submission.documents![0]!.storage_path!)
                }
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Signed
              </Button>
            )}
          {["pending", "partially_signed"].includes(submission.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoid}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Void Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
