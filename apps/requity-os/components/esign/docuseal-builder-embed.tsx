"use client";

import { useEffect, useState, useCallback } from "react";
import { DocusealBuilder } from "@docuseal/react";
import { Loader2 } from "lucide-react";

interface DocusealBuilderEmbedProps {
  /** Name for the template in DocuSeal */
  templateName: string;
  /** PDF URLs to load into the builder (for new templates) */
  documentUrls?: string[];
  /** Existing DocuSeal template ID (for editing field placement) */
  existingTemplateId?: number;
  /** Signer roles to configure in the builder */
  roles?: string[];
  /** Called when the builder saves with the DocuSeal template data */
  onSave?: (detail: { id: number; name: string }) => void;
  /** Called when the builder loads */
  onLoad?: () => void;
  /** Custom CSS class */
  className?: string;
}

/**
 * Embedded DocuSeal template builder for placing signature/form fields on documents.
 * Used in two flows:
 * - Template preset: Admin configures signing fields once in Control Center
 * - Ad-hoc: User places fields on a specific document before sending
 */
export function DocusealBuilderEmbed({
  templateName,
  documentUrls,
  existingTemplateId,
  roles,
  onSave,
  onLoad,
  className,
}: DocusealBuilderEmbedProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/esign/builder-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateName,
            documentUrls,
            templateId: existingTemplateId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Could not load builder");
          return;
        }

        const data = await res.json();
        setToken(data.token);
      } catch {
        setError("Could not load builder");
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [templateName, documentUrls, existingTemplateId]);

  const handleSave = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (detail: any) => {
      if (onSave && detail?.id) {
        onSave({ id: detail.id, name: detail.name || templateName });
      }
    },
    [onSave, templateName]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading builder...
        </span>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        {error || "Unable to load builder"}
      </div>
    );
  }

  return (
    <DocusealBuilder
      token={token}
      roles={roles}
      withSendButton={false}
      withSignYourselfButton={false}
      withUploadButton={true}
      onSave={handleSave}
      onLoad={onLoad}
      autosave={false}
      className={className ?? "w-full min-h-[700px]"}
    />
  );
}
