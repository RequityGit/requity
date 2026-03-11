import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

interface ExtractedField {
  value: string | number | boolean;
  confidence: number;
  source: string;
}

interface ExtractionResult {
  deal_fields: Record<string, ExtractedField>;
  extracted_fields: Record<string, ExtractedField>;
  summary: string;
}

function getMediaType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
}

const GENERAL_EXTRACTION_PROMPT = `Extract deal information from this document for a real estate lending platform.
You do not know the specific deal type yet, so extract all information you can find.

Standard deal fields to extract:
- name (text): Deal name, property address, or project name
- amount (currency): Loan amount, deal size, or investment amount
- expected_close_date (date, YYYY-MM-DD format): Expected closing date
- asset_class (select from: sfr, duplex_fourplex, multifamily, mhc, rv_park, campground, commercial, mixed_use, land): Property/asset type
- borrower_name (text): Borrower or sponsor name
- borrower_email (text): Borrower email address
- property_address (text): Full property address
- deal_type_indicators (text): Any clues about deal type (e.g., "fix and flip", "ground-up construction", "bridge loan", "DSCR", "rental")

Underwriting fields to extract (if found):
- purchase_price (currency): Purchase price of the property
- as_is_value (currency): Current appraised or estimated value
- arv (currency): After-repair value
- rehab_budget (currency): Renovation/rehabilitation budget
- loan_to_value (percentage): LTV ratio
- interest_rate (percentage): Interest rate
- loan_term (text): Loan term (e.g., "12 months", "30 years")
- property_type (text): Specific property type
- units (number): Number of units
- square_footage (number): Square footage
- year_built (number): Year built
- occupancy (text): Current occupancy status
- net_operating_income (currency): NOI
- dscr (number): Debt service coverage ratio
- exit_strategy (text): Planned exit strategy

For each field, extract the value if found. Rate your confidence (0.0 to 1.0). Reference where you found the data.

Respond with ONLY valid JSON in this exact format:
{
  "deal_fields": {
    "<field_name>": { "value": <extracted_value>, "confidence": <0.0-1.0>, "source": "<page/section reference>" }
  },
  "extracted_fields": {
    "<uw_field_key>": { "value": <extracted_value>, "confidence": <0.0-1.0>, "source": "<page/section reference>" }
  },
  "summary": "<2-3 sentence summary of the document>"
}

Only include fields you can actually find data for. Do not guess or fabricate values.`;

const EMAIL_BODY_EXTRACTION_PROMPT = `Extract deal information from this email body text for a real estate lending platform.
This is the text of a forwarded email. Extract any deal details mentioned.

Standard deal fields to extract:
- name (text): Deal name, property address, or project name
- amount (currency): Loan amount or deal size
- asset_class (select from: sfr, duplex_fourplex, multifamily, mhc, rv_park, campground, commercial, mixed_use, land): Property/asset type
- borrower_name (text): Borrower or sponsor name
- borrower_email (text): Borrower email address
- property_address (text): Full property address
- deal_type_indicators (text): Any clues about deal type
- purchase_price (currency): Purchase price
- as_is_value (currency): Current value
- arv (currency): After-repair value
- rehab_budget (currency): Renovation budget
- loan_to_value (percentage): LTV ratio
- interest_rate (percentage): Interest rate
- loan_term (text): Loan term
- exit_strategy (text): Exit strategy

Respond with ONLY valid JSON:
{
  "deal_fields": {
    "<field_name>": { "value": <extracted_value>, "confidence": <0.0-1.0>, "source": "email body" }
  },
  "extracted_fields": {
    "<uw_field_key>": { "value": <extracted_value>, "confidence": <0.0-1.0>, "source": "email body" }
  },
  "summary": "<1-2 sentence summary of the email>"
}

Only include fields you can actually find data for. Do not guess or fabricate values.`;

/**
 * POST /api/intake/process
 *
 * Runs AI extraction on an email intake queue item.
 * Auth: CRON_SECRET bearer token or admin session.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronCall) {
    // Fall back to service role key check
    if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      const { createClient: createServerClient } = await import(
        "@/lib/supabase/server"
      );
      const supabase = await createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (!roleData || !["admin", "super_admin"].includes(roleData.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI extraction is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const intakeQueueId = body.intake_queue_id as string | null;

    if (!intakeQueueId) {
      return NextResponse.json(
        { error: "No intake_queue_id provided" },
        { status: 400 }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the queue item
    const { data: queueItem, error: fetchError } = await admin
      .from("email_intake_queue")
      .select("*, crm_emails:crm_email_id(body_text)")
      .eq("id", intakeQueueId)
      .single();

    if (fetchError || !queueItem) {
      return NextResponse.json(
        { error: "Queue item not found" },
        { status: 404 }
      );
    }

    if (queueItem.status !== "pending") {
      return NextResponse.json(
        { error: `Queue item status is '${queueItem.status}', expected 'pending'` },
        { status: 409 }
      );
    }

    // Mark as processing
    await admin
      .from("email_intake_queue")
      .update({ status: "processing" })
      .eq("id", intakeQueueId);

    const allResults: ExtractionResult[] = [];
    const summaries: string[] = [];

    // Step 1: Extract from email body text
    const bodyText = (queueItem.crm_emails as { body_text: string | null } | null)?.body_text;
    if (bodyText && bodyText.trim().length > 50) {
      try {
        const bodyResult = await callClaude(
          [{ type: "text", text: `${EMAIL_BODY_EXTRACTION_PROMPT}\n\nEmail body:\n${bodyText.substring(0, 10000)}` }]
        );
        if (bodyResult) {
          allResults.push(bodyResult);
          if (bodyResult.summary) summaries.push(`Email: ${bodyResult.summary}`);
        }
      } catch (err) {
        console.error("[Intake] Email body extraction failed:", err);
      }
    }

    // Step 2: Extract from each attachment
    const attachments = (queueItem.attachments || []) as Array<{
      filename: string;
      storage_path: string;
      mime_type: string;
      size_bytes: number;
      extraction_status: string;
    }>;

    const updatedAttachments = [...attachments];

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];

      if (att.extraction_status !== "pending" || !att.storage_path) {
        continue;
      }

      // Skip non-extractable types
      const ext = att.filename.toLowerCase().split(".").pop() || "";
      if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) {
        updatedAttachments[i] = { ...att, extraction_status: "manual_review" };
        continue;
      }

      try {
        // Download from Supabase Storage
        const { data: fileData, error: downloadError } = await admin.storage
          .from("loan-documents")
          .download(att.storage_path);

        if (downloadError || !fileData) {
          console.error(`[Intake] Failed to download ${att.filename}:`, downloadError);
          updatedAttachments[i] = { ...att, extraction_status: "download_failed" };
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mediaType = getMediaType(att.filename);
        const contentType = mediaType.startsWith("image/") ? "image" : "document";

        const result = await callClaude([
          {
            type: contentType as "image" | "document",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          { type: "text", text: GENERAL_EXTRACTION_PROMPT },
        ]);

        if (result) {
          allResults.push(result);
          if (result.summary) summaries.push(`${att.filename}: ${result.summary}`);
          updatedAttachments[i] = { ...att, extraction_status: "completed" };
        } else {
          updatedAttachments[i] = { ...att, extraction_status: "extraction_failed" };
        }
      } catch (err) {
        console.error(`[Intake] Extraction failed for ${att.filename}:`, err);
        updatedAttachments[i] = { ...att, extraction_status: "extraction_failed" };
      }
    }

    // Step 3: Merge results (attachment data takes priority over body text)
    const mergedDealFields: Record<string, ExtractedField> = {};
    const mergedUwFields: Record<string, ExtractedField> = {};

    for (const result of allResults) {
      for (const [key, field] of Object.entries(result.deal_fields)) {
        if (!mergedDealFields[key] || field.confidence > mergedDealFields[key].confidence) {
          mergedDealFields[key] = field;
        }
      }
      for (const [key, field] of Object.entries(result.extracted_fields)) {
        if (!mergedUwFields[key] || field.confidence > mergedUwFields[key].confidence) {
          mergedUwFields[key] = field;
        }
      }
    }

    // Step 4: Auto-detect card type based on extracted fields
    let suggestedCardTypeId: string | null = null;
    const dealTypeIndicators = mergedDealFields.deal_type_indicators?.value?.toString().toLowerCase() || "";
    const hasRehabBudget = !!mergedUwFields.rehab_budget;
    const hasArv = !!mergedUwFields.arv;
    const hasDscr = !!mergedUwFields.dscr;
    const hasNoi = !!mergedUwFields.net_operating_income;

    // Fetch card types for matching
    const { data: cardTypes } = await admin
      .from("unified_card_types")
      .select("id, label, slug");

    if (cardTypes && cardTypes.length > 0) {
      // Simple heuristic matching
      const labelMatch = (keywords: string[]) =>
        cardTypes.find((ct) =>
          keywords.some((kw) =>
            ct.label.toLowerCase().includes(kw) || ct.slug?.toLowerCase().includes(kw)
          )
        );

      if (dealTypeIndicators.includes("fix") || dealTypeIndicators.includes("flip") || (hasRehabBudget && hasArv)) {
        suggestedCardTypeId = labelMatch(["fix", "flip"])?.id || null;
      } else if (dealTypeIndicators.includes("construction") || dealTypeIndicators.includes("ground-up") || dealTypeIndicators.includes("ground up")) {
        suggestedCardTypeId = labelMatch(["construction", "ground"])?.id || null;
      } else if (dealTypeIndicators.includes("bridge")) {
        suggestedCardTypeId = labelMatch(["bridge"])?.id || null;
      } else if (dealTypeIndicators.includes("dscr") || dealTypeIndicators.includes("rental") || hasDscr) {
        suggestedCardTypeId = labelMatch(["dscr", "rental"])?.id || null;
      } else if (dealTypeIndicators.includes("multifamily") || hasNoi) {
        suggestedCardTypeId = labelMatch(["multifamily", "commercial"])?.id || null;
      }

      // Fallback: if no match, pick the first card type
      if (!suggestedCardTypeId && cardTypes.length > 0) {
        suggestedCardTypeId = null; // Leave it for the admin to choose
      }
    }

    // Step 5: Contact matching (if not already matched during sync)
    let matchedContactId = queueItem.matched_contact_id;
    if (!matchedContactId && queueItem.from_email) {
      const { data: matchData } = await admin.rpc("match_email_to_entities", {
        lookup_email: queueItem.from_email,
      });
      if (matchData && Array.isArray(matchData)) {
        const contactMatch = matchData.find(
          (m: { contact_id: string | null }) => m.contact_id
        );
        if (contactMatch) {
          matchedContactId = contactMatch.contact_id;
        }
      }
    }

    // Step 6: Update queue item
    const hasDealFields = Object.keys(mergedDealFields).length > 0;
    const hasUwFields = Object.keys(mergedUwFields).length > 0;
    const newStatus = hasDealFields || hasUwFields ? "ready" : "error";

    await admin
      .from("email_intake_queue")
      .update({
        status: newStatus,
        attachments: updatedAttachments,
        extraction_summary: summaries.join(" | ") || null,
        extracted_deal_fields: hasDealFields ? mergedDealFields : null,
        extracted_uw_fields: hasUwFields ? mergedUwFields : null,
        suggested_card_type_id: suggestedCardTypeId,
        matched_contact_id: matchedContactId,
      })
      .eq("id", intakeQueueId);

    return NextResponse.json({
      success: true,
      status: newStatus,
      deal_fields_count: Object.keys(mergedDealFields).length,
      uw_fields_count: Object.keys(mergedUwFields).length,
      suggested_card_type_id: suggestedCardTypeId,
    });
  } catch (error) {
    console.error("[Intake] Process error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process intake item",
      },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callClaude(content: any[]): Promise<ExtractionResult | null> {
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
          content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("[Intake] Claude API error:", response.status, errorText.slice(0, 200));
    return null;
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as ExtractionResult;
  } catch {
    console.error("[Intake] Failed to parse Claude response:", text.slice(0, 200));
    return null;
  }
}
