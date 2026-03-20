import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/deals/[dealId]/review-condition-document
 *
 * Condition-aware AI document review. Uses the condition's template_guidance
 * ("What to Look For") as discrete review criteria, evaluates each one against
 * the document, and produces a recommendation.
 *
 * Body: { document_id: string; condition_id: string }
 * Auth: Bearer service role key OR authenticated admin/super_admin
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { dealId } = params;
  let documentId: string | undefined;
  let conditionId: string | undefined;

  try {
    // Auth: accept service role key or check for authenticated admin
    const auth = req.headers.get("authorization");
    const isServiceRole = auth === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    if (!isServiceRole) {
      // Check for authenticated user via cookie-based auth
      const cookieHeader = req.headers.get("cookie") ?? "";
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
      const userClient = createClient(SUPABASE_URL, anonKey, {
        global: { headers: { cookie: cookieHeader } },
      });
      const {
        data: { user },
      } = await userClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify admin role
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const role = (userRole as { role: string } | null)?.role;
      if (role !== "admin" && role !== "super_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();
    documentId = body.document_id;
    conditionId = body.condition_id;

    if (!documentId || !conditionId || !dealId) {
      return NextResponse.json(
        { error: "Missing document_id, condition_id, or dealId" },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI review is not configured. Missing ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    // ── Fetch document ──
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
      return NextResponse.json(
        { error: "Document has no storage path" },
        { status: 400 }
      );
    }

    // ── Fetch condition with template guidance ──
    const { data: condition, error: condError } = await supabase
      .from("unified_deal_conditions" as never)
      .select(
        "id, condition_name, category, status, template_guidance, borrower_description, internal_description" as never
      )
      .eq("id" as never, conditionId as never)
      .single();

    if (condError || !condition) {
      return NextResponse.json(
        { error: "Condition not found" },
        { status: 404 }
      );
    }

    const cond = condition as unknown as {
      id: string;
      condition_name: string;
      category: string | null;
      status: string;
      template_guidance: string | null;
      borrower_description: string | null;
      internal_description: string | null;
    };

    // Build review criteria from template_guidance + internal_description
    const guidanceText = cond.template_guidance?.trim() || "";
    const internalNotes = cond.internal_description?.trim() || "";

    // ── Create review record ──
    const { data: review, error: reviewError } = await supabase
      .from("document_reviews")
      .insert({
        deal_id: dealId,
        document_id: documentId,
        condition_id: conditionId,
        status: "processing",
      } as never)
      .select()
      .single();

    if (reviewError) {
      console.error("Failed to create review:", reviewError);
      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 }
      );
    }

    const reviewId = (review as { id: string }).id;

    // Update document review_status
    await supabase
      .from("unified_deal_documents")
      .update({ review_status: "processing" })
      .eq("id", documentId);

    // ── Download file from storage ──
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("loan-documents")
      .download(storagePath);

    if (downloadError || !fileData) {
      await markError(
        supabase,
        reviewId,
        documentId,
        "Download failed: " + (downloadError?.message ?? "unknown")
      );
      return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }

    // ── Convert to base64 ──
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

    // ── Build the condition-aware prompt ──
    const prompt = buildConditionReviewPrompt(
      cond.condition_name,
      cond.category,
      guidanceText,
      internalNotes,
      documentName
    );

    // ── Call Claude ──
    let result: ConditionReviewResult | null = null;
    let tokensUsed = 0;

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

      if (!response.ok) {
        const apiError =
          data?.error?.message ||
          data?.error?.type ||
          `HTTP ${response.status}`;
        console.error(
          `[review-condition-document] Claude API error: ${apiError}`
        );
        throw new Error(`Claude API error (${response.status}): ${apiError}`);
      }

      const text = data.content?.[0]?.text;
      if (!text) {
        console.error(
          "[review-condition-document] No text in response:",
          JSON.stringify(data).slice(0, 500)
        );
        throw new Error("Empty response from Claude");
      }

      tokensUsed =
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      result = JSON.parse(
        text.replace(/```json|```/g, "").trim()
      ) as ConditionReviewResult;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[review-condition-document] AI call failed:", errMsg);
      await markError(supabase, reviewId, documentId, errMsg);
      return NextResponse.json(
        { error: "AI review failed: " + errMsg },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    // ── Store results ──
    await supabase
      .from("document_reviews")
      .update({
        status: "ready",
        document_type: result.document_type || "other",
        document_type_confidence: result.document_type_confidence || 0.5,
        raw_extraction: result as never,
        summary: result.summary || null,
        flags: result.flags || [],
        model_used: "claude-sonnet-4-20250514",
        tokens_used: tokensUsed,
        processing_time_ms: processingTime,
      })
      .eq("id", reviewId);

    await supabase
      .from("unified_deal_documents")
      .update({ review_status: "ready" })
      .eq("id", documentId);

    return NextResponse.json({
      success: true,
      review_id: reviewId,
      criteria_results: result.criteria_results,
      recommendation: result.recommendation,
      recommendation_reasoning: result.recommendation_reasoning,
      summary: result.summary,
      flags: result.flags,
      document_type: result.document_type,
      processing_time_ms: processingTime,
      tokens_used: tokensUsed,
    });
  } catch (error) {
    console.error("review-condition-document error:", error);
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

// ─── Types ───

interface CriterionResult {
  criterion: string;
  result: "pass" | "fail" | "unclear";
  detail: string;
}

interface ConditionReviewResult {
  document_type: string;
  document_type_confidence: number;
  criteria_results: CriterionResult[];
  recommendation: "approve" | "request_revision" | "needs_manual_review";
  recommendation_reasoning: string;
  summary: string;
  flags: string[];
  extracted_fields?: Record<
    string,
    { value: unknown; confidence: number; source: string }
  >;
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

function buildConditionReviewPrompt(
  conditionName: string,
  category: string | null,
  guidanceText: string,
  internalNotes: string,
  documentName: string
): string {
  // Parse guidance into discrete criteria lines
  const criteriaLines: string[] = [];

  if (guidanceText) {
    // Split on common delimiters: periods, commas between clauses, semicolons, newlines
    // But be smart about it - split on sentence boundaries and list items
    const parts = guidanceText
      .split(/(?:\.\s+|\n|;\s*|,\s*(?=(?:must|check|confirm|verify|ensure|no |min|max|look|review|at least|should)))/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    for (const part of parts) {
      // Clean up and capitalize
      const cleaned = part.replace(/^\s*[-*]\s*/, "").trim();
      if (cleaned) {
        criteriaLines.push(
          cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
        );
      }
    }
  }

  // If no parseable criteria, use the raw guidance as a single criterion
  if (criteriaLines.length === 0 && guidanceText) {
    criteriaLines.push(guidanceText);
  }

  const criteriaSection =
    criteriaLines.length > 0
      ? criteriaLines.map((c, i) => `${i + 1}. ${c}`).join("\n")
      : "No specific review criteria provided. Use your best judgment for this document type.";

  const internalNotesSection = internalNotes
    ? `\nADDITIONAL REVIEWER NOTES:\n${internalNotes}\n`
    : "";

  return `You are an experienced underwriter reviewing a document submitted for a commercial/residential real estate loan condition.

CONDITION NAME: ${conditionName}
${category ? `CATEGORY: ${category}` : ""}
DOCUMENT FILE: ${documentName}

REVIEW CRITERIA (evaluate each one individually):
${criteriaSection}
${internalNotesSection}
INSTRUCTIONS:
1. Carefully review the entire document.
2. For EACH criterion listed above, determine whether the document satisfies it:
   - "pass": The document clearly meets this requirement
   - "fail": The document clearly does NOT meet this requirement
   - "unclear": The document does not contain enough information to determine, or the criterion is not applicable to this document type
3. Provide a specific detail explaining your assessment for each criterion. Reference page numbers, specific values, or dates where possible.
4. Based on all criteria results, provide an overall recommendation:
   - "approve": All criteria pass (or pass + unclear with no concerns)
   - "request_revision": One or more criteria fail
   - "needs_manual_review": Criteria are mostly unclear, or the document may be the wrong type
5. Write a concise summary (2-3 sentences) of what the document contains and its key data points.
6. List any flags (concerns, discrepancies, unusual items) even if criteria pass.
7. Identify the document type from: appraisal, bank_statement, pnl_tax_return, rent_roll, title_report, insurance_policy, entity_document, loan_document, credit_report, other.

Respond with ONLY valid JSON (no markdown, no commentary):
{
  "document_type": "<type>",
  "document_type_confidence": <0-1>,
  "criteria_results": [
    {"criterion": "<criterion text>", "result": "pass|fail|unclear", "detail": "<specific explanation>"}
  ],
  "recommendation": "approve|request_revision|needs_manual_review",
  "recommendation_reasoning": "<1-2 sentences explaining the overall recommendation>",
  "summary": "<2-3 sentence summary of document contents>",
  "flags": ["<concern 1>", "<concern 2>"]
}`;
}
