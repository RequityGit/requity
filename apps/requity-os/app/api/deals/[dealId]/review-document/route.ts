import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Simple auth: require service role key in Authorization header
function authorize(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
}

type DocumentType =
  | "appraisal"
  | "bank_statement"
  | "pnl_tax_return"
  | "rent_roll"
  | "title_report"
  | "insurance_policy"
  | "entity_document"
  | "other";

const FILENAME_PATTERNS: [RegExp, DocumentType][] = [
  [/appraisal|as-is/i, "appraisal"],
  [/bank.?statement|account.?statement/i, "bank_statement"],
  [/p&l|profit.?(?:and|&).?loss|tax.?return|1040|1065|1120|k-?1|schedule.?[cek]/i, "pnl_tax_return"],
  [/rent.?roll|unit.?mix/i, "rent_roll"],
  [/title|commitment|prelim/i, "title_report"],
  [/insurance|policy|binder|certificate.?of.?insurance|coi/i, "insurance_policy"],
  [/articles|operating.?agreement|certificate.?of.?(?:formation|organization|good.?standing)|ein|ss-?4|bylaws|resolution/i, "entity_document"],
];

function detectType(filename: string): DocumentType {
  for (const [re, type] of FILENAME_PATTERNS) {
    if (re.test(filename)) return type;
  }
  return "other";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { dealId } = params;
  let documentId: string | undefined;

  try {
    const body = await req.json();
    documentId = body.document_id;

    if (!documentId || !dealId) {
      return NextResponse.json(
        { error: "Missing document_id or deal_id" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from("unified_deal_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const storagePath = doc.storage_path as string | null;
    const documentName = doc.document_name as string;
    const mimeType = doc.mime_type as string | null;

    if (!storagePath) {
      await supabase
        .from("unified_deal_documents")
        .update({ review_status: "error" })
        .eq("id", documentId);
      return NextResponse.json({ error: "No storage path" }, { status: 400 });
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
      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 }
      );
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
      await markError(
        supabase,
        review.id,
        documentId,
        "Download failed: " + (downloadError?.message ?? "unknown")
      );
      return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Determine media type
    let mediaType = "application/pdf";
    if (mimeType?.includes("image/")) mediaType = mimeType;
    else if (
      mimeType?.includes("pdf") ||
      documentName.toLowerCase().endsWith(".pdf")
    )
      mediaType = "application/pdf";

    // Detect document type from filename
    let documentType: DocumentType = detectType(documentName);
    let typeConfidence = documentType !== "other" ? 0.8 : 0.0;

    // If filename heuristics inconclusive, use AI classification
    if (documentType === "other") {
      const classification = await classifyDocument(base64, mediaType);
      if (classification) {
        documentType = classification.document_type as DocumentType;
        typeConfidence = classification.confidence;
      }
    }

    // Update review with type
    await supabase
      .from("document_reviews")
      .update({
        document_type: documentType,
        document_type_confidence: typeConfidence,
      })
      .eq("id", review.id);

    // Extract data using Claude
    const extraction = await extractDocumentData(
      base64,
      mediaType,
      documentType
    );
    if (!extraction) {
      await markError(
        supabase,
        review.id,
        documentId,
        "Failed to extract data from document"
      );
      return NextResponse.json(
        { error: "Extraction failed" },
        { status: 500 }
      );
    }

    // Build notes draft
    const docLabel =
      {
        appraisal: "Appraisal",
        bank_statement: "Bank Statement",
        pnl_tax_return: "P&L / Tax Return",
        rent_roll: "Rent Roll",
        title_report: "Title Report",
        insurance_policy: "Insurance Policy",
        entity_document: "Entity Document",
        other: "Document",
      }[documentType] || "Document";

    let notesDraft = `**AI Document Review — ${docLabel}**\nFile: ${documentName}\n\n`;
    if (extraction.summary)
      notesDraft += `**Summary:** ${extraction.summary}\n\n`;
    const flags = extraction.flags as string[] | undefined;
    if (flags && flags.length > 0) {
      notesDraft += "**Flags:**\n";
      for (const f of flags) notesDraft += `- ${f}\n`;
    }

    const processingTime = Date.now() - startTime;

    // Update review to ready
    await supabase
      .from("document_reviews")
      .update({
        status: "ready",
        raw_extraction: extraction,
        summary: (extraction.summary as string) || null,
        notes_draft: notesDraft.trim(),
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

    return NextResponse.json({
      success: true,
      review_id: review.id,
    });
  } catch (error) {
    console.error("Review document error:", error);
    if (documentId) {
      await supabase
        .from("unified_deal_documents")
        .update({ review_status: "error" })
        .eq("id", documentId);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ─── Helpers ───

async function markError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: 'Classify this document as one of: appraisal, bank_statement, pnl_tax_return, rent_roll, title_report, insurance_policy, entity_document, other. Respond with ONLY JSON: {"document_type": "<type>", "confidence": <0-1>}',
              },
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
  const prompt =
    "Extract structured data from this " +
    docType +
    ' document for a real estate lending underwriting system. For each field found, provide value, confidence (0-1), and source page/section. Include a summary (2-3 sentences) and flags (array of concerns). Respond with ONLY valid JSON: {"document_type": "' +
    docType +
    '", "extracted_fields": {"<field>": {"value": <val>, "confidence": <0-1>, "source": "<ref>"}}, "summary": "<text>", "flags": []}';

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
    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    parsed._tokens_used =
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    return parsed;
  } catch {
    return null;
  }
}
