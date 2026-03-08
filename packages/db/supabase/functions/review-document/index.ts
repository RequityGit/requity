// Supabase Edge Function: review-document
// AI-powered document classification and data extraction for deal documents.
// Called from uploadDealDocumentV2 server action after successful upload.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectTypeFromFilename, type DocumentType } from "./detect-type.ts";
import { CLASSIFICATION_PROMPT, EXTRACTION_PROMPTS } from "./prompts.ts";
import { FIELD_MAPPINGS } from "./field-mapping.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_CONCURRENT_REVIEWS = 10;

const DOC_TYPE_LABELS: Record<string, string> = {
  appraisal: "Appraisal",
  bank_statement: "Bank Statement",
  pnl_tax_return: "P&L / Tax Return",
  rent_roll: "Rent Roll",
  title_report: "Title Report",
  insurance_policy: "Insurance Policy",
  entity_document: "Entity Document",
  other: "Document",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let documentId: string | undefined;
  let dealId: string | undefined;

  try {
    const body = await req.json();
    documentId = body.document_id;
    dealId = body.deal_id;

    if (!documentId || !dealId) {
      return jsonResponse({ error: "Missing document_id or deal_id" }, 400);
    }

    const startTime = Date.now();

    // Rate limiting: check concurrent processing reviews
    const { count } = await supabase
      .from("document_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing");

    if (count && count >= MAX_CONCURRENT_REVIEWS) {
      await supabase
        .from("unified_deal_documents")
        .update({ review_status: "pending" })
        .eq("id", documentId);
      return jsonResponse({ queued: true }, 202);
    }

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from("unified_deal_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return jsonResponse(
        { error: "Document not found: " + (docError?.message ?? documentId) },
        404
      );
    }

    const storagePath = doc.storage_path as string | null;
    const documentName = doc.document_name as string;
    const mimeType = doc.mime_type as string | null;

    if (!storagePath) {
      await markDocumentError(supabase, documentId, "No storage path available");
      return jsonResponse({ error: "No storage path" }, 400);
    }

    // Create review record
    const { data: review, error: reviewError } = await supabase
      .from("document_reviews")
      .insert({
        deal_id: dealId,
        document_id: documentId,
        status: "processing",
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Failed to create review:", reviewError);
      return jsonResponse({ error: reviewError.message }, 500);
    }

    // Update document status
    await supabase
      .from("unified_deal_documents")
      .update({ review_status: "processing" })
      .eq("id", documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("loan-documents")
      .download(storagePath);

    if (downloadError || !fileData) {
      await markError(supabase, review.id, documentId, "Failed to download: " + (downloadError?.message ?? "unknown"));
      return jsonResponse({ error: "Download failed" }, 500);
    }

    // Check file size
    if (fileData.size > MAX_FILE_SIZE) {
      await markError(supabase, review.id, documentId, "File exceeds 25MB limit");
      return jsonResponse({ error: "File too large" }, 400);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Determine media type for Claude API
    const mediaType = resolveMediaType(mimeType, documentName);

    // Detect document type
    let documentType: DocumentType =
      detectTypeFromFilename(documentName) || "other";
    let typeConfidence = documentType !== "other" ? 0.8 : 0.0;

    // If filename heuristics inconclusive, use AI classification
    if (documentType === "other") {
      const classification = await classifyDocument(base64, mediaType);
      if (classification) {
        documentType = classification.document_type as DocumentType;
        typeConfidence = classification.confidence;
      }
    }

    // Update review with document type
    await supabase
      .from("document_reviews")
      .update({
        document_type: documentType,
        document_type_confidence: typeConfidence,
      })
      .eq("id", review.id);

    // Run extraction
    const extraction = await extractDocumentData(base64, mediaType, documentType);
    if (!extraction) {
      await markError(supabase, review.id, documentId, "Failed to extract data from document");
      return jsonResponse({ error: "Extraction failed" }, 500);
    }

    // Fetch current deal values for comparison
    const { data: currentDeal } = await supabase
      .from("unified_deals")
      .select("uw_data, property_data")
      .eq("id", dealId)
      .single();

    // Build review items from extraction
    const fieldMappings = FIELD_MAPPINGS[documentType] || {};
    const reviewItems: Record<string, unknown>[] = [];

    if (extraction.extracted_fields) {
      for (const [fieldKey, fieldData] of Object.entries(
        extraction.extracted_fields
      ) as [string, { value: unknown; confidence: number; source?: string }][]) {
        const mapping = fieldMappings[fieldKey];
        if (
          mapping &&
          fieldData?.value !== null &&
          fieldData?.value !== undefined
        ) {
          // Get current value from the deal's jsonb column
          const dealData =
            currentDeal?.[
              mapping.target_column as "uw_data" | "property_data"
            ] as Record<string, unknown> | null;
          const currentValue = dealData?.[mapping.target_json_path];
          const proposedValue = String(fieldData.value);

          reviewItems.push({
            review_id: review.id,
            field_label: mapping.label,
            target_table: mapping.target_table,
            target_column: mapping.target_column,
            target_json_path: mapping.target_json_path,
            target_record_id: dealId,
            current_value: currentValue != null ? String(currentValue) : null,
            proposed_value: proposedValue,
            confidence: fieldData.confidence || 0.5,
            extraction_source: fieldData.source || null,
          });
        }
      }
    }

    // Insert review items
    if (reviewItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("document_review_items")
        .insert(reviewItems);
      if (itemsError) {
        console.error("Failed to insert review items:", itemsError);
      }
    }

    // Generate notes draft
    const notesDraft = generateNotesDraft(
      documentType,
      extraction,
      documentName,
      reviewItems.length
    );

    const processingTime = Date.now() - startTime;

    // Update review to ready
    await supabase
      .from("document_reviews")
      .update({
        status: "ready",
        raw_extraction: extraction,
        summary: extraction.summary || null,
        notes_draft: notesDraft,
        flags: extraction.flags || [],
        model_used: "claude-sonnet-4-20250514",
        tokens_used: extraction._tokens_used || null,
        processing_time_ms: processingTime,
      })
      .eq("id", review.id);

    // Update document status
    await supabase
      .from("unified_deal_documents")
      .update({ review_status: "ready" })
      .eq("id", documentId);

    return jsonResponse({
      success: true,
      review_id: review.id,
      items_count: reviewItems.length,
    });
  } catch (error) {
    console.error("Review document error:", error);
    // Try to mark the review as errored
    if (documentId) {
      await markDocumentError(
        supabase,
        documentId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

// ─── Helper Functions ───

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveMediaType(mimeType: string | null, fileName: string): string {
  if (mimeType?.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) {
    return "application/pdf";
  }
  if (mimeType?.includes("image/")) {
    return mimeType;
  }
  // Default to PDF for unknown types
  return "application/pdf";
}

async function classifyDocument(
  base64: string,
  mediaType: string
): Promise<{ document_type: string; confidence: number } | null> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: CLASSIFICATION_PROMPT },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

async function extractDocumentData(
  base64: string,
  mediaType: string,
  docType: DocumentType
): Promise<Record<string, unknown> | null> {
  const prompt = EXTRACTION_PROMPTS[docType] || EXTRACTION_PROMPTS.other;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    parsed._tokens_used =
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    return parsed;
  } catch (firstError) {
    // Retry once with explicit JSON-only instruction
    try {
      const retryResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system:
            "You MUST respond with ONLY valid JSON. No markdown, no backticks, no explanation.",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64,
                  },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      });

      const retryData = await retryResponse.json();
      const retryText = retryData.content?.[0]?.text;
      if (retryText) {
        const parsed = JSON.parse(retryText.replace(/```json|```/g, "").trim());
        parsed._tokens_used =
          (retryData.usage?.input_tokens || 0) +
          (retryData.usage?.output_tokens || 0);
        return parsed;
      }
    } catch {
      /* second attempt failed */
    }
    return null;
  }
}

function generateNotesDraft(
  docType: DocumentType,
  extraction: Record<string, unknown>,
  fileName: string,
  proposedUpdates: number
): string {
  const label = DOC_TYPE_LABELS[docType] || "Document";
  let note = `**AI Document Review — ${label}**\nFile: ${fileName}\n\n`;

  if (extraction.summary) {
    note += `**Summary:** ${extraction.summary}\n\n`;
  }

  if (proposedUpdates > 0) {
    note += `**Proposed Updates:** ${proposedUpdates} field(s) identified for update.\n\n`;
  }

  const flags = extraction.flags as string[] | undefined;
  if (flags && flags.length > 0) {
    note += `**Flags:**\n`;
    for (const flag of flags) {
      note += `- ${flag}\n`;
    }
  }

  return note.trim();
}

async function markError(
  supabase: ReturnType<typeof createClient>,
  reviewId: string,
  documentId: string,
  message: string
) {
  await supabase
    .from("document_reviews")
    .update({ status: "error", error_message: message })
    .eq("id", reviewId);
  await supabase
    .from("unified_deal_documents")
    .update({ review_status: "error" })
    .eq("id", documentId);
}

async function markDocumentError(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  message: string
) {
  await supabase
    .from("unified_deal_documents")
    .update({ review_status: "error" })
    .eq("id", documentId);
  // Check if a review record exists for this document
  const { data: existing } = await supabase
    .from("document_reviews")
    .select("id")
    .eq("document_id", documentId)
    .single();
  if (existing) {
    await supabase
      .from("document_reviews")
      .update({ status: "error", error_message: message })
      .eq("id", existing.id);
  }
}
