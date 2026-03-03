"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResolveTemplateResponse } from "@/lib/types/user-email-templates";

interface UseResolveTemplateOptions {
  onSuccess?: (data: ResolveTemplateResponse) => void;
  onError?: (error: string) => void;
}

export function useResolveTemplate(options?: UseResolveTemplateOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResolveTemplateResponse | null>(null);

  const resolve = useCallback(
    async (params: {
      templateSlug: string;
      loanId?: string;
      contactId?: string;
      overrideVariables?: Record<string, string>;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Not authenticated");
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/resolve-user-template`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              template_slug: params.templateSlug,
              loan_id: params.loanId,
              contact_id: params.contactId,
              override_variables: params.overrideVariables,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ?? `Request failed with status ${response.status}`
          );
        }

        const result = (await response.json()) as ResolveTemplateResponse;
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        options?.onError?.(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { resolve, loading, error, data };
}
