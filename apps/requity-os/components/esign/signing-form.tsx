"use client";

import { useEffect, useState } from "react";
import { DocusealForm } from "@docuseal/react";
import { Loader2 } from "lucide-react";

interface SigningFormProps {
  submissionId: number;
  signerEmail: string;
  onComplete?: () => void;
  onDecline?: () => void;
}

/**
 * Embedded DocuSeal signing form.
 * Fetches a JWT token, then renders the DocusealForm inline.
 */
export function SigningForm({
  submissionId,
  signerEmail,
  onComplete,
  onDecline,
}: SigningFormProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/esign/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId, signerEmail }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Could not load signing form");
          return;
        }

        const data = await res.json();
        setToken(data.token);
      } catch {
        setError("Could not load signing form");
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [submissionId, signerEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {error || "Unable to load signing form"}
      </div>
    );
  }

  return (
    <div className="rq-card-wrapper">
      <DocusealForm
        src={`https://docuseal.com/d/${token}`}
        email={signerEmail}
        withTitle={false}
        withDecline
        withDownloadButton
        withSendCopyButton
        onComplete={onComplete}
        onDecline={onDecline}
        className="w-full min-h-[600px]"
      />
    </div>
  );
}
