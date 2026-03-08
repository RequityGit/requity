// Supabase Edge Function: review-document
// AI-powered document classification and data extraction for deal documents.
// Called from uploadDealDocumentV2 server action after successful upload.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

// ─── Document Type Detection (inlined from detect-type.ts) ───

type DocumentType =
  | "appraisal"
  | "bank_statement"
  | "pnl_tax_return"
  | "rent_roll"
  | "title_report"
  | "insurance_policy"
  | "entity_document"
  | "other";

const FILENAME_PATTERNS: Record<string, DocumentType> = {
  appraisal: "appraisal",
  "as-is": "appraisal",
  "bank.?statement": "bank_statement",
  "account.?statement": "bank_statement",
  "p&l": "pnl_tax_return",
  "profit.?(?:and|&).?loss": "pnl_tax_return",
  "tax.?return": "pnl_tax_return",
  "1040": "pnl_tax_return",
  "1065": "pnl_tax_return",
  "1120": "pnl_tax_return",
  "k-?1": "pnl_tax_return",
  "schedule.?[cek]": "pnl_tax_return",
  "rent.?roll": "rent_roll",
  "unit.?mix": "rent_roll",
  title: "title_report",
  commitment: "title_report",
  prelim: "title_report",
  insurance: "insurance_policy",
  policy: "insurance_policy",
  binder: "insurance_policy",
  "certificate.?of.?insurance": "insurance_policy",
  coi: "insurance_policy",
  articles: "entity_document",
  "operating.?agreement": "entity_document",
  "certificate.?of.?(?:formation|organization|good.?standing)":
    "entity_document",
  ein: "entity_document",
  "ss-?4": "entity_document",
  bylaws: "entity_document",
  resolution: "entity_document",
};

function detectTypeFromFilename(filename: string): DocumentType | null {
  const lower = filename.toLowerCase();
  for (const [pattern, type] of Object.entries(FILENAME_PATTERNS)) {
    if (new RegExp(pattern, "i").test(lower)) {
      return type;
    }
  }
  return null;
}

// ─── Classification & Extraction Prompts (inlined from prompts.ts) ───

const CLASSIFICATION_PROMPT = `You are a document classifier for a real estate lending company. Analyze the first pages of this document and classify it into EXACTLY ONE of these types:

- appraisal (property appraisal, BPO, valuation report)
- bank_statement (bank account statements, account summaries)
- pnl_tax_return (profit & loss statements, tax returns, K-1s, 1040/1065/1120 forms, Schedule C/E/K)
- rent_roll (rent rolls, unit mixes, occupancy reports)
- title_report (title commitments, preliminary title reports, title searches)
- insurance_policy (insurance binders, certificates, policies, COIs)
- entity_document (articles of organization, operating agreements, EIN letters, certificates of good standing, resolutions)
- other (anything that doesn't match the above)

Respond with ONLY valid JSON:
{
  "document_type": "<type>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`;

const EXTRACTION_PROMPTS: Record<string, string> = {
  appraisal: `You are extracting structured data from a real estate appraisal for a lending company's underwriting system.

Extract the following fields. For each field, provide the value, your confidence (0.0-1.0), and the source location in the document.

Required fields:
- as_is_value: The as-is market value / opinion of value (number)
- arv: After-repair value if available (number, null if not present)
- property_address: Full property address including city, state, zip
- property_type: SFR, 2-4 Unit, Condo, Townhouse, MHC, Mixed Use, etc.
- property_condition: C1-C6 rating or descriptive condition
- year_built: Year the property was built
- gross_living_area: GLA / square footage (number)
- lot_size: Lot size in sq ft or acres
- bedroom_count: Number of bedrooms
- bathroom_count: Number of bathrooms
- appraiser_name: Name of the appraiser
- effective_date: Effective date of the appraisal
- comparable_sales: Array of up to 3 comparable sales with address, sale_price, sale_date, adjustments

Also provide:
- summary: 2-3 sentence summary of the appraisal
- flags: Array of any concerns (value discrepancies, old comps, condition issues, market decline)

Respond with ONLY valid JSON matching this exact schema:
{
  "document_type": "appraisal",
  "extracted_fields": {
    "<field_name>": {
      "value": <extracted value>,
      "confidence": <0.0-1.0>,
      "source": "<page/section reference>"
    }
  },
  "summary": "<summary>",
  "flags": ["<flag1>", "<flag2>"]
}`,

  bank_statement: `You are extracting structured data from bank statements for a lending company's underwriting system.

Extract the following fields:
- account_holder_name: Name on the account
- bank_name: Name of the financial institution
- account_type: Checking, Savings, Money Market, etc.
- account_number_last4: Last 4 digits of account number
- statement_period_start: Start date of the statement period
- statement_period_end: End date of the statement period
- beginning_balance: Opening balance (number)
- ending_balance: Closing balance (number)
- total_deposits: Total deposits during period (number)
- total_withdrawals: Total withdrawals during period (number)
- average_daily_balance: Average daily balance if shown (number, null if not present)
- large_deposits: Array of deposits over $5,000 with date, amount, description
- nsf_occurrences: Number of NSF/overdraft events (number)

Also provide:
- summary: 2-3 sentence summary
- flags: Array of concerns (low balance, NSFs, large unexplained deposits, inconsistent deposits)

Respond with ONLY valid JSON matching the schema:
{
  "document_type": "bank_statement",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  pnl_tax_return: `You are extracting structured data from profit & loss statements or tax returns for a lending company's underwriting system.

Extract the following fields:
- entity_name: Business name or individual taxpayer name
- tax_year: Tax year or P&L period
- form_type: 1040, 1065, 1120, 1120-S, K-1, Schedule C, Schedule E, P&L Statement
- gross_revenue: Total gross income/revenue (number)
- total_expenses: Total deductions/expenses (number)
- net_operating_income: NOI or net income before taxes (number)
- net_income: Net income after taxes (number)
- depreciation: Depreciation amount (number, important for cash flow addback)
- amortization: Amortization amount (number)
- interest_expense: Total interest expense (number)
- rental_income: Rental income if present (number)
- filing_status: Single, MFJ, MFS, HOH, etc. (for 1040s)
- agi: Adjusted gross income (for 1040s)

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (declining revenue, high expense ratio, negative NOI, missing schedules)

Respond with ONLY valid JSON:
{
  "document_type": "pnl_tax_return",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  rent_roll: `You are extracting structured data from a rent roll for a lending company's underwriting system.

Extract the following fields:
- property_name: Property name or address
- report_date: Date of the rent roll
- total_units: Total number of units (number)
- occupied_units: Number of occupied units (number)
- vacant_units: Number of vacant units (number)
- occupancy_rate: Occupancy percentage (number, e.g. 94.5)
- total_monthly_rent: Total scheduled monthly rent (number)
- total_annual_rent: Total annualized rent (number)
- average_rent_per_unit: Average rent per occupied unit (number)
- unit_mix: Array of unit types with count, rent, sqft (e.g. [{type: "1BR/1BA", count: 10, rent: 1200, sqft: 750}])
- delinquent_units: Number of units with past-due rent (number)
- total_delinquency: Total delinquent amount (number)

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (high vacancy, delinquencies, below-market rents, rent concentration)

Respond with ONLY valid JSON:
{
  "document_type": "rent_roll",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  title_report: `You are extracting structured data from a title report/commitment for a lending company's underwriting system.

Extract the following fields:
- property_address: Full property address
- legal_description: Legal description (abbreviated if very long)
- current_owner: Name of current property owner / vesting
- title_company: Name of the title company
- effective_date: Effective date of the title search
- commitment_number: Title commitment or file number
- proposed_insured: Name of proposed insured
- policy_amount: Proposed policy amount (number)
- existing_liens: Array of existing liens with position, holder, amount, recording_info
- exceptions: Array of schedule B exceptions (easements, restrictions, etc.)
- taxes_current: Whether property taxes are current (boolean)
- tax_amount: Annual tax amount if shown (number)
- vesting_type: Fee simple, leasehold, etc.

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (unreleased liens, judgments, tax delinquencies, unusual exceptions)

Respond with ONLY valid JSON:
{
  "document_type": "title_report",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  insurance_policy: `You are extracting structured data from an insurance policy/binder/COI for a lending company's underwriting system.

Extract the following fields:
- carrier_name: Insurance company name
- policy_number: Policy number
- insured_name: Named insured
- property_address: Insured property address
- policy_type: Homeowners, Commercial Property, Builders Risk, Flood, etc.
- coverage_amount: Dwelling/building coverage amount (number)
- liability_coverage: Liability coverage amount (number)
- deductible: Deductible amount (number)
- annual_premium: Annual premium (number)
- effective_date: Policy effective date
- expiration_date: Policy expiration date
- mortgagee_clause: Whether lender is listed as mortgagee/loss payee (boolean)
- mortgagee_name: Name in the mortgagee clause if present
- flood_zone: Flood zone designation if shown
- replacement_cost: Whether coverage is replacement cost vs ACV

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (insufficient coverage, missing mortgagee, expiring soon, high deductible, flood zone)

Respond with ONLY valid JSON:
{
  "document_type": "insurance_policy",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  entity_document: `You are extracting structured data from entity/corporate documents for a lending company's underwriting system.

Extract the following fields:
- entity_name: Full legal entity name
- entity_type: LLC, Corporation, LP, Trust, etc.
- formation_state: State of formation/organization
- formation_date: Date of formation
- ein: EIN / Tax ID number (if present in an EIN letter)
- registered_agent: Registered agent name and address
- members_managers: Array of members/managers/officers with name, title, ownership_percentage
- managing_member: Name of the managing member or authorized signatory
- good_standing: Whether the entity is in good standing (boolean, from CoGS)
- good_standing_date: Date of the certificate of good standing
- document_subtype: articles, operating_agreement, ein_letter, cogs, resolution, bylaws

Also provide:
- summary: 2-3 sentence summary
- flags: Concerns (dissolved entity, missing members, no EIN, expired good standing)

Respond with ONLY valid JSON:
{
  "document_type": "entity_document",
  "extracted_fields": {
    "<field_name>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary>",
  "flags": ["<flag>"]
}`,

  other: `You are extracting structured data from a document uploaded to a real estate lending deal. The document type is not one of the standard categories, so perform a general extraction.

Extract any relevant information you find, focusing on:
- Names (people, companies, entities)
- Addresses (property or mailing)
- Dollar amounts (loan amounts, values, prices, costs)
- Dates (effective dates, expiration dates, closing dates)
- Percentages (rates, LTV, ownership)
- Key terms and conditions
- Any data that would be relevant to underwriting a real estate loan

Do NOT map these to specific deal fields — instead, present them as informational notes.

Respond with ONLY valid JSON:
{
  "document_type": "other",
  "extracted_fields": {
    "<descriptive_key>": { "value": <value>, "confidence": <0.0-1.0>, "source": "<reference>" }
  },
  "summary": "<summary of what this document is and what it contains>",
  "flags": ["<any concerns or notable items>"]
}`,
};

// ─── Field Mappings (inlined from field-mapping.ts) ───

interface FieldMapping {
  label: string;
  target_table: string;
  target_column: string;
  target_json_path: string;
}

const FIELD_MAPPINGS: Record<string, Record<string, FieldMapping>> = {
  appraisal: {
    as_is_value: {
      label: "As-Is Value",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "property_value",
    },
    arv: {
      label: "After-Repair Value (ARV)",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "after_repair_value",
    },
    property_address: {
      label: "Property Address",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_address",
    },
    property_type: {
      label: "Property Type",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_type",
    },
    property_condition: {
      label: "Property Condition",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_condition",
    },
    year_built: {
      label: "Year Built",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "year_built",
    },
    gross_living_area: {
      label: "Square Footage (GLA)",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "sqft",
    },
    bedroom_count: {
      label: "Bedrooms",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "bedrooms",
    },
    bathroom_count: {
      label: "Bathrooms",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "bathrooms",
    },
  },

  bank_statement: {
    ending_balance: {
      label: "Cash Reserves (Ending Balance)",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "borrower_cash_reserves",
    },
    average_daily_balance: {
      label: "Avg Daily Balance",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "avg_daily_balance",
    },
    bank_name: {
      label: "Bank Name",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "bank_name",
    },
  },

  pnl_tax_return: {
    net_operating_income: {
      label: "Net Operating Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "noi",
    },
    gross_revenue: {
      label: "Gross Revenue",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "gross_revenue",
    },
    total_expenses: {
      label: "Total Expenses",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "annual_expenses",
    },
    net_income: {
      label: "Net Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "net_income",
    },
    depreciation: {
      label: "Depreciation",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "depreciation",
    },
  },

  rent_roll: {
    total_units: {
      label: "Total Units",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "unit_count",
    },
    occupancy_rate: {
      label: "Occupancy Rate",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "occupancy_rate",
    },
    total_monthly_rent: {
      label: "Monthly Rental Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "monthly_rental_income",
    },
    total_annual_rent: {
      label: "Annual Rental Income",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "annual_rental_income",
    },
    average_rent_per_unit: {
      label: "Avg Rent Per Unit",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "avg_rent_per_unit",
    },
  },

  title_report: {
    property_address: {
      label: "Property Address",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "property_address",
    },
    legal_description: {
      label: "Legal Description",
      target_table: "unified_deals",
      target_column: "property_data",
      target_json_path: "legal_description",
    },
    current_owner: {
      label: "Current Owner",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "vesting",
    },
    title_company: {
      label: "Title Company",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "title_company",
    },
    policy_amount: {
      label: "Title Policy Amount",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "title_policy_amount",
    },
  },

  insurance_policy: {
    carrier_name: {
      label: "Insurance Carrier",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_carrier",
    },
    policy_number: {
      label: "Policy Number",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_policy_number",
    },
    coverage_amount: {
      label: "Coverage Amount",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_coverage_amount",
    },
    deductible: {
      label: "Deductible",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_deductible",
    },
    annual_premium: {
      label: "Annual Premium",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_premium",
    },
    expiration_date: {
      label: "Policy Expiration",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "insurance_expiration",
    },
  },

  entity_document: {
    entity_name: {
      label: "Borrowing Entity Name",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "borrower_entity_name",
    },
    ein: {
      label: "EIN",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "borrower_ein",
    },
    formation_state: {
      label: "State of Formation",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "entity_formation_state",
    },
    formation_date: {
      label: "Formation Date",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "entity_formation_date",
    },
    managing_member: {
      label: "Managing Member",
      target_table: "unified_deals",
      target_column: "uw_data",
      target_json_path: "managing_member",
    },
  },

  other: {},
};

// ─── Constants ───

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

    // Clean up reviews stuck in "processing" for > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stuckReviews } = await supabase
      .from("document_reviews")
      .select("id, document_id")
      .eq("status", "processing")
      .lt("created_at", tenMinutesAgo);

    if (stuckReviews && stuckReviews.length > 0) {
      await supabase
        .from("document_reviews")
        .update({ status: "error", error_message: "Processing timed out" })
        .in("id", stuckReviews.map((r: { id: string }) => r.id));
      await supabase
        .from("unified_deal_documents")
        .update({ review_status: "error" })
        .in("id", stuckReviews.map((r: { document_id: string }) => r.document_id));
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

    // Convert to base64 (using Deno std — O(n) vs the old byte-by-byte O(n²))
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = encodeBase64(bytes);

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
