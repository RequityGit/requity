"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncFolderDocuments } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import type { DealDocument, DealCondition } from "./types";

interface DocumentsTabData {
  documents: DealDocument[];
  conditions: DealCondition[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDocumentsTabData(
  dealId: string,
  googleDriveFolderId?: string | null
): DocumentsTabData {
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [conditions, setConditions] = useState<DealCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const [docsRes, conditionsRes] = await Promise.all([
          supabase
            .from("unified_deal_documents" as never)
            .select(
              "id, deal_id, document_name, category, storage_path, file_url, file_size_bytes, mime_type, uploaded_by, condition_id, condition_approval_status, review_status, archived_at, visibility, google_drive_file_id, submission_status, deleted_at, created_at, contact_id, company_id, document_type, document_date, contact:crm_contacts!unified_deal_documents_contact_id_fkey(id, first_name, last_name), company:companies!unified_deal_documents_company_id_fkey(id, name)"
            )
            .eq("deal_id" as never, dealId as never)
            .is("deleted_at" as never, null as never)
            .order("created_at" as never, { ascending: false }),
          supabase
            .from("unified_deal_conditions" as never)
            .select(
              "*, loan_condition_templates:template_id(internal_description, borrower_description)" as never
            )
            .eq("deal_id" as never, dealId as never)
            .order("sort_order" as never),
        ]);

        if (!mountedRef.current) return;

        if (docsRes.error) {
          console.error("Failed to fetch documents:", docsRes.error.message);
        }
        const docs = ((docsRes as unknown as { data: DealDocument[] | null }).data ?? []);

        // Map conditions to flatten template joins (same as server did)
        type ConditionWithTemplate = DealCondition & {
          loan_condition_templates?: {
            internal_description: string | null;
            borrower_description: string | null;
          } | null;
        };
        const rawConditions = ((conditionsRes as unknown as { data: ConditionWithTemplate[] | null }).data ?? []);
        const mapped: DealCondition[] = rawConditions.map((c) => {
          const template = c.loan_condition_templates;
          return {
            ...c,
            template_guidance: template?.internal_description ?? null,
            template_borrower_description: template?.borrower_description ?? null,
            loan_condition_templates: undefined,
          };
        }) as unknown as DealCondition[];

        setDocuments(docs);
        setConditions(mapped);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load documents");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [dealId]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Realtime: subscribe to document changes for this deal
  useEffect(() => {
    if (!dealId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`deal-docs-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "unified_deal_documents",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, fetchData]);

  // Auto-sync: when folder is linked, trigger background Drive ↔ Portal sync
  const syncTriggeredRef = useRef(false);
  useEffect(() => {
    if (!googleDriveFolderId || syncTriggeredRef.current) return;
    const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
    const cacheKey = `doc-sync-${dealId}`;
    try {
      const lastSync = sessionStorage.getItem(cacheKey);
      if (lastSync && Date.now() - Number(lastSync) < THROTTLE_MS) return;
    } catch {
      // sessionStorage may be unavailable
    }

    syncTriggeredRef.current = true;
    syncFolderDocuments(dealId)
      .then((result) => {
        try { sessionStorage.setItem(cacheKey, String(Date.now())); } catch {}
        if (result.imported && result.imported > 0) {
          fetchData(true); // silent refetch to show imported docs
        }
      })
      .catch(() => {}); // non-blocking
  }, [dealId, googleDriveFolderId, fetchData]);

  return { documents, conditions, loading, error, refetch: () => fetchData(true) };
}
