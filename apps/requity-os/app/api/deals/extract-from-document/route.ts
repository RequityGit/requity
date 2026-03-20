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

interface ExtractionResponse {
  deal_fields: Record<string, ExtractedField>;
  extracted_fields: Record<string, ExtractedField>;
  summary: string;
}

function getMediaType(storagePath: string): string {
  const lower = storagePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
}

export async function POST(req: NextRequest) {
  // Auth: check for service role key or session-based auth
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    // Fall back to cookie-based auth
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
  }

  try {
    const body = await req.json();
    const storagePath = body.storage_path as string | null;
    const cardTypeId = body.card_type_id as string | null;

    if (!storagePath) {
      return NextResponse.json(
        { error: "No storage_path provided" },
        { status: 400 }
      );
    }

    if (!cardTypeId) {
      return NextResponse.json(
        { error: "No card_type_id provided" },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI extraction is not configured" },
        { status: 500 }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: cardType, error: ctError } = await admin
      .from("unified_card_types")
      .select("label")
      .eq("id", cardTypeId)
      .single();

    if (ctError || !cardType) {
      return NextResponse.json(
        { error: "Card type not found" },
        { status: 404 }
      );
    }

    // Reject unsupported file types early
    const lowerPath = storagePath.toLowerCase();
    if (lowerPath.endsWith(".doc") || lowerPath.endsWith(".docx")) {
      return NextResponse.json(
        {
          error:
            "Word documents are not supported for AI extraction. Please upload a PDF or image file.",
        },
        { status: 400 }
      );
    }

    // Download file from Supabase storage
    const { data: fileData, error: downloadError } = await admin.storage
      .from("loan-documents")
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error("Failed to download file from storage:", downloadError);
      return NextResponse.json(
        { error: "Failed to download uploaded file" },
        { status: 500 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mediaType = getMediaType(storagePath);

    const { data: fieldConfigs } = await admin
      .from("field_configurations")
      .select("field_key, field_label, field_type, dropdown_options, module")
      .in("module", ["uw_deal", "property"])
      .eq("is_archived", false)
      .eq("is_visible", true);

    type FieldConfig = {
      field_key: string;
      field_label: string;
      field_type: string;
      dropdown_options: string[] | null;
      module: string;
    };
    const allFields = (fieldConfigs ?? []) as FieldConfig[];

    const uwFieldDescriptions = allFields
      .filter((f) => f.module === "uw_deal")
      .map((f) => {
        let desc = `- ${f.field_key} (${f.field_type}): ${f.field_label}`;
        if (f.dropdown_options?.length) {
          desc += ` [options: ${f.dropdown_options.join(", ")}]`;
        }
        return desc;
      })
      .join("\n");

    const propertyFieldDescriptions = allFields
      .filter((f) => f.module === "property")
      .map((f) => {
        let desc = `- ${f.field_key} (${f.field_type}): ${f.field_label}`;
        if (f.dropdown_options?.length) {
          desc += ` [options: ${f.dropdown_options.join(", ")}]`;
        }
        return desc;
      })
      .join("\n");

    const prompt = `Extract deal information from this document for a real estate lending platform. This is a "${cardType.label}" deal type.

Standard deal fields to extract:
- name (text): Deal name, property address, or project name
- amount (currency): Loan amount, deal size, or investment amount
- asset_class (select from: sfr, duplex_fourplex, multifamily, mhc, rv_park, campground, commercial, mixed_use, land): Property/asset type

${uwFieldDescriptions ? `Underwriting fields to extract:\n${uwFieldDescriptions}` : ""}

${propertyFieldDescriptions ? `Property fields to extract:\n${propertyFieldDescriptions}` : ""}

For each field, extract the value if found in the document. Rate your confidence (0.0 to 1.0) in the extraction accuracy. Reference where in the document you found the data.

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

Only include fields that you can actually find data for in the document. Do not guess or fabricate values.`;

    const contentType = mediaType.startsWith("image/") ? "image" : "document";

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
                type: contentType,
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let apiMessage = "Unknown API error";
      try {
        const errorData = JSON.parse(errorText);
        apiMessage = errorData?.error?.message ?? apiMessage;
      } catch {
        // Detect HTML error pages (e.g. Cloudflare) and show a friendly message
        if (errorText && errorText.trimStart().startsWith("<!")) {
          apiMessage = "AI service temporarily unavailable — please try again";
        } else if (errorText) {
          apiMessage = errorText.slice(0, 200);
        }
      }
      console.error("Anthropic API error:", response.status, apiMessage);

      if (response.status === 401)
        apiMessage = "AI service authentication failed — check API key";
      else if (response.status === 429)
        apiMessage =
          "AI service rate limit reached — please try again in a moment";
      else if (response.status === 413)
        apiMessage = "Document is too large for AI processing";

      return NextResponse.json(
        { error: `AI extraction failed: ${apiMessage}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "No extraction result from AI" },
        { status: 502 }
      );
    }

    const parsed: ExtractionResponse = JSON.parse(
      text.replace(/```json|```/g, "").trim()
    );

    // Clean up temp file (fire-and-forget)
    if (storagePath.startsWith("temp-extractions/")) {
      admin.storage
        .from("loan-documents")
        .remove([storagePath])
        .catch((err) =>
          console.error("Failed to cleanup temp extraction file:", err)
        );
    }

    return NextResponse.json({
      deal_fields: parsed.deal_fields ?? {},
      extracted_fields: parsed.extracted_fields ?? {},
      summary: parsed.summary ?? "",
    });
  } catch (error) {
    console.error("extract-from-document error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to extract document",
      },
      { status: 500 }
    );
  }
}
