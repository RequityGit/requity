// Supabase Edge Function: process-intake-email
// Takes an email_intake_queue item, maps Claude-extracted fields into structured
// 4-entity format (contact, company, property, deal), runs matching engine against
// existing CRM records, and creates an intake_items record.
//
// Handles forwarded emails by using the original sender (broker) as the primary
// contact instead of the internal team member who forwarded it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ParsedData {
  // Broker / correspondent info
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  brokerLicense?: string;

  // Primary contact for CRM matching (resolved from broker > original sender > from header)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Borrower info (the actual buyer/borrower mentioned in the email)
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  borrowerEntityName?: string;

  // Company / entity
  companyName?: string;
  ein?: string;
  entityType?: string;
  stateOfFormation?: string;

  // Property
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  propertyCount?: number;
  units?: number;
  sqft?: number;
  arv?: number;
  yearBuilt?: number;
  zoning?: string;

  // Deal / loan
  purchasePrice?: number;
  loanAmount?: number;
  loanType?: string;
  ltv?: number;
  rate?: number;
  term?: string;
  dscr?: number;
  rehabBudget?: number;
  closingDate?: string;

  // Financial metrics
  noi?: number;
  cashFlow?: number;
  cocReturn?: number;
  debtService?: number;
  capRate?: number;

  // Other
  sellerFinancing?: string;
  existingDebt?: string;
  notes?: string;

  // Forwarding metadata
  isForwarded?: boolean;
  forwarderName?: string;
  forwarderEmail?: string;
}

interface MatchResult {
  match_id: string;
  confidence: number;
  matched_on: string[];
  snapshot: Record<string, unknown>;
}

// ─── Normalize helpers ───

function normalizeStr(s: string | null | undefined): string {
  if (!s) return "";
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizePhone(p: string | null | undefined): string {
  if (!p) return "";
  return p.replace(/[^0-9]/g, "").slice(-10);
}

function normalizeAddress(a: string | null | undefined): string {
  if (!a) return "";
  return a
    .toLowerCase()
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\broad\b/g, "rd")
    .replace(/\bcourt\b/g, "ct")
    .replace(/\blane\b/g, "ln")
    .replace(/\bunit\b/g, "#")
    .replace(/\bapt\b/g, "#")
    .replace(/\bsuite\b/g, "#")
    .replace(/[^a-z0-9#]/g, "");
}

// ─── Field Mapping from Claude Extraction ───

function mapExtractedFields(
  extractedFields: Record<string, { value: unknown }>,
  fromEmail: string,
  fromName: string | null
): ParsedData {
  const parsed: ParsedData = {};

  const get = (key: string): string | undefined => {
    const f = extractedFields[key];
    return f?.value != null ? String(f.value) : undefined;
  };
  const getNum = (key: string): number | undefined => {
    const f = extractedFields[key];
    if (f?.value == null) return undefined;
    const n = Number(f.value);
    return isNaN(n) ? undefined : n;
  };

  // Broker info
  parsed.brokerName = get("broker_name");
  parsed.brokerEmail = get("broker_email");
  parsed.brokerPhone = get("broker_phone");
  parsed.brokerCompany = get("broker_company");
  parsed.brokerLicense = get("broker_license");

  // Borrower info
  parsed.borrowerName = get("borrower_name");
  parsed.borrowerEmail = get("borrower_email");
  parsed.borrowerPhone = get("borrower_phone");
  parsed.borrowerEntityName = get("borrower_entity_name");

  // Determine primary contact for CRM matching based on forwarding context
  const isForwarded = extractedFields["_is_forwarded"]?.value === true;

  if (isForwarded) {
    // Forwarder is internal team; use broker (original sender) as primary contact
    parsed.isForwarded = true;
    parsed.forwarderName = fromName || undefined;
    parsed.forwarderEmail = fromEmail;

    parsed.contactName =
      parsed.brokerName ||
      get("_original_sender_name") ||
      undefined;
    parsed.contactEmail =
      parsed.brokerEmail ||
      get("_original_sender_email") ||
      undefined;
    parsed.contactPhone = parsed.brokerPhone;
  } else {
    // Direct email: sender is likely the broker or borrower
    parsed.contactName = parsed.brokerName || parsed.borrowerName || fromName || undefined;
    parsed.contactEmail = parsed.brokerEmail || parsed.borrowerEmail || fromEmail;
    parsed.contactPhone = parsed.brokerPhone || parsed.borrowerPhone;
  }

  // Company / entity (prefer borrower entity over generic company)
  parsed.companyName = parsed.borrowerEntityName || get("company_name");

  // Property
  parsed.propertyAddress = get("property_address");
  parsed.propertyCity = get("property_city");
  parsed.propertyState = get("property_state");
  parsed.propertyType = get("property_type");
  parsed.propertyCount = getNum("property_count");
  parsed.units = getNum("units");
  parsed.sqft = getNum("sqft");
  parsed.arv = getNum("arv");
  parsed.yearBuilt = getNum("year_built");

  // Deal / loan
  parsed.purchasePrice = getNum("purchase_price");
  parsed.loanAmount = getNum("loan_amount");
  parsed.loanType = get("loan_type");
  parsed.ltv = getNum("ltv");
  parsed.dscr = getNum("dscr");
  parsed.rehabBudget = getNum("rehab_budget");
  parsed.closingDate = get("closing_date");

  // Financial metrics
  parsed.noi = getNum("noi");
  parsed.cashFlow = getNum("cash_flow");
  parsed.cocReturn = getNum("coc_return");
  parsed.debtService = getNum("debt_service");
  parsed.capRate = getNum("cap_rate");

  // Other
  parsed.sellerFinancing = get("seller_financing");
  parsed.existingDebt = get("existing_debt");
  parsed.notes = get("notes");

  return parsed;
}

// ─── Regex fallback for emails with no Claude extraction ───

function parseWithRegex(
  body: string,
  subject: string | null,
  extractionSummary: string | null,
  fromEmail: string,
  fromName: string | null
): ParsedData {
  const parsed: ParsedData = {};

  parsed.contactEmail = fromEmail;
  parsed.contactName = fromName || undefined;

  const phoneMatch = body.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) parsed.contactPhone = phoneMatch[1];

  // Dollar amounts: find the largest one as likely loan/purchase amount
  const dollarMatches = [...body.matchAll(/\$\s*([\d,]+(?:\.\d+)?)\s*(mil|million|m|k|thousand)?/gi)];
  if (dollarMatches.length > 0) {
    const amounts = dollarMatches.map((m) => {
      let val = parseFloat(m[1].replace(/,/g, ""));
      const suffix = (m[2] || "").toLowerCase();
      if (suffix === "k" || suffix === "thousand") val *= 1000;
      if (suffix === "m" || suffix === "mil" || suffix === "million") val *= 1000000;
      return val;
    });
    parsed.purchasePrice = Math.max(...amounts);
  }

  // Property type detection
  const typePatterns: Record<string, RegExp> = {
    SFR: /\b(sfr|single.?family|house)\b/i,
    Portfolio: /\b(portfolio|multiple.?propert)/i,
    Multifamily: /\b(multi.?family|apartment|units?\b)/i,
    Commercial: /\b(commercial|retail|office)\b/i,
    Industrial: /\b(industrial|warehouse)\b/i,
  };
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(body)) {
      parsed.propertyType = type;
      break;
    }
  }

  // Unit count
  const unitMatch = body.match(/(\d+)\s*(?:units?|doors?|properties)/i);
  if (unitMatch) parsed.units = parseInt(unitMatch[1]);

  // Loan type detection
  const loanPatterns: Record<string, RegExp> = {
    DSCR: /\b(dscr|rental|long.?term)\b/i,
    RTL: /\b(rtl|fix.?(?:and|&|n).?flip|rehab)\b/i,
    Bridge: /\b(bridge)\b/i,
    GroundUp: /\b(ground.?up|construction|new.?build)\b/i,
    "Comm Debt": /\b(commercial.?(?:loan|debt|mortgage))\b/i,
    Portfolio: /\b(portfolio.?(?:loan|purchase|financing))\b/i,
  };
  for (const [type, pattern] of Object.entries(loanPatterns)) {
    if (pattern.test(body)) {
      parsed.loanType = type;
      break;
    }
  }

  // NOI
  const noiMatch = body.match(/(?:noi|net operating income)[:\s]*\$?\s*([\d,]+(?:\.\d+)?)\s*(mil|million|m|k)?/i);
  if (noiMatch) {
    let noi = parseFloat(noiMatch[1].replace(/,/g, ""));
    const suffix = (noiMatch[2] || "").toLowerCase();
    if (suffix === "k") noi *= 1000;
    if (suffix === "m" || suffix === "mil" || suffix === "million") noi *= 1000000;
    parsed.noi = noi;
  }

  // ARV
  const arvMatch = body.match(/arv[:\s]*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:k|K|M|m)?/i);
  if (arvMatch) {
    let arv = parseFloat(arvMatch[1].replace(/,/g, ""));
    if (/[kK]/.test(arvMatch[0])) arv *= 1000;
    if (/[mM]/.test(arvMatch[0])) arv *= 1000000;
    parsed.arv = arv;
  }

  // Rehab budget
  const rehabMatch = body.match(/rehab[:\s]*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:k|K|M|m)?/i);
  if (rehabMatch) {
    let rehab = parseFloat(rehabMatch[1].replace(/,/g, ""));
    if (/[kK]/.test(rehabMatch[0])) rehab *= 1000;
    if (/[mM]/.test(rehabMatch[0])) rehab *= 1000000;
    parsed.rehabBudget = rehab;
  }

  parsed.notes = extractionSummary || subject || undefined;

  return parsed;
}

// ─── Combined parser ───

async function parseEmailWithAI(
  subject: string | null,
  body: string | null,
  fromEmail: string,
  fromName: string | null,
  extractionSummary: string | null,
  extractedFields: Record<string, { value: unknown }> | null
): Promise<ParsedData> {
  // Check if we have real extracted fields (not just metadata keys starting with _)
  const hasRealFields =
    extractedFields != null &&
    Object.keys(extractedFields).some(
      (k) => !k.startsWith("_") && extractedFields[k]?.value != null
    );

  if (hasRealFields && extractedFields) {
    return mapExtractedFields(extractedFields, fromEmail, fromName);
  }

  // Fallback to regex-based parsing when Claude extraction failed or returned empty
  if (body) {
    return parseWithRegex(body, subject, extractionSummary, fromEmail, fromName);
  }

  // Absolute fallback
  return {
    contactEmail: fromEmail,
    contactName: fromName || undefined,
    notes: extractionSummary || subject || undefined,
  };
}

// ─── Matching Engine ───

async function matchContact(
  admin: ReturnType<typeof createClient>,
  parsed: ParsedData
): Promise<MatchResult | null> {
  if (!parsed.contactEmail && !parsed.contactPhone && !parsed.contactName)
    return null;

  if (parsed.contactEmail) {
    const { data: emailMatches } = await admin
      .from("crm_contacts")
      .select("id, name, first_name, last_name, email, phone, address_line1, city, state, notes, company_id")
      .eq("email", parsed.contactEmail)
      .is("deleted_at", null)
      .limit(1);

    if (emailMatches && emailMatches.length > 0) {
      const c = emailMatches[0];
      const matchedOn = ["email"];
      let confidence = 0.95;

      if (parsed.contactName && c.name) {
        const incName = normalizeStr(parsed.contactName);
        const extName = normalizeStr(c.name);
        if (incName === extName || incName.includes(extName) || extName.includes(incName)) {
          matchedOn.push("name");
          confidence = 0.97;
        }
      }

      return {
        match_id: c.id,
        confidence,
        matched_on: matchedOn,
        snapshot: c,
      };
    }
  }

  // Try broker email if different from contact email
  if (parsed.brokerEmail && parsed.brokerEmail !== parsed.contactEmail) {
    const { data: brokerMatches } = await admin
      .from("crm_contacts")
      .select("id, name, first_name, last_name, email, phone, address_line1, city, state, notes, company_id")
      .eq("email", parsed.brokerEmail)
      .is("deleted_at", null)
      .limit(1);

    if (brokerMatches && brokerMatches.length > 0) {
      return {
        match_id: brokerMatches[0].id,
        confidence: 0.9,
        matched_on: ["broker_email"],
        snapshot: brokerMatches[0],
      };
    }
  }

  if (parsed.contactPhone) {
    const normalizedPhone = normalizePhone(parsed.contactPhone);
    if (normalizedPhone.length >= 10) {
      const { data: phoneMatches } = await admin
        .from("crm_contacts")
        .select("id, name, first_name, last_name, email, phone, address_line1, city, state, notes, company_id")
        .is("deleted_at", null);

      if (phoneMatches) {
        const match = phoneMatches.find(
          (c: Record<string, unknown>) =>
            normalizePhone(c.phone as string) === normalizedPhone
        );
        if (match) {
          const matchedOn = ["phone"];
          let confidence = 0.85;
          if (
            parsed.contactName &&
            match.name &&
            normalizeStr(parsed.contactName).includes(
              normalizeStr(match.name as string)
            )
          ) {
            matchedOn.push("name");
            confidence = 0.9;
          }
          return {
            match_id: match.id as string,
            confidence,
            matched_on: matchedOn,
            snapshot: match as Record<string, unknown>,
          };
        }
      }
    }
  }

  return null;
}

async function matchCompany(
  admin: ReturnType<typeof createClient>,
  parsed: ParsedData,
  contactCompanyId?: string | null
): Promise<MatchResult | null> {
  // Try both borrower entity and broker company
  const candidateNames = [
    parsed.companyName,
    parsed.brokerCompany,
    parsed.borrowerEntityName,
  ].filter(Boolean) as string[];

  if (candidateNames.length === 0 && !contactCompanyId) return null;

  const { data: companies } = await admin
    .from("companies")
    .select("id, name, email, phone, state")
    .is("deleted_at", null);

  if (!companies) return null;

  for (const candidate of candidateNames) {
    const normalizedName = normalizeStr(candidate)
      .replace(/llc|inc|corp|ltd|co/g, "")
      .trim();

    if (!normalizedName) continue;

    for (const co of companies) {
      const extName = normalizeStr((co as Record<string, unknown>).name as string)
        .replace(/llc|inc|corp|ltd|co/g, "")
        .trim();

      if (extName && extName === normalizedName) {
        return {
          match_id: (co as Record<string, unknown>).id as string,
          confidence: 0.9,
          matched_on: ["name"],
          snapshot: co as Record<string, unknown>,
        };
      }
    }
  }

  if (contactCompanyId) {
    const match = companies.find(
      (co: Record<string, unknown>) => co.id === contactCompanyId
    );
    if (match) {
      return {
        match_id: (match as Record<string, unknown>).id as string,
        confidence: 0.85,
        matched_on: ["contact_link"],
        snapshot: match as Record<string, unknown>,
      };
    }
  }

  return null;
}

async function matchProperty(
  admin: ReturnType<typeof createClient>,
  parsed: ParsedData
): Promise<MatchResult | null> {
  if (!parsed.propertyAddress) return null;

  const normalizedAddr = normalizeAddress(parsed.propertyAddress);
  if (!normalizedAddr) return null;

  const { data: properties } = await admin
    .from("properties")
    .select(
      "id, address_line1, city, state, zip, property_type, number_of_units, gross_building_area_sqft, year_built, zoning"
    )
    .is("deleted_at", null);

  if (!properties) return null;

  for (const prop of properties) {
    const p = prop as Record<string, unknown>;
    const extAddr = normalizeAddress(p.address_line1 as string);
    if (extAddr && extAddr === normalizedAddr) {
      return {
        match_id: p.id as string,
        confidence: 0.95,
        matched_on: ["address"],
        snapshot: p,
      };
    }
  }

  return null;
}

async function matchDeal(
  admin: ReturnType<typeof createClient>,
  parsed: ParsedData,
  contactId: string | null,
  propertyId: string | null,
  subject: string | null,
  body: string | null
): Promise<MatchResult | null> {
  const { data: deals } = await admin
    .from("unified_deals")
    .select("id, name, deal_number, amount, primary_contact_id, property_id, company_id, stage, loan_type")
    .in("status", ["active", "on_hold"]);

  if (!deals || deals.length === 0) return null;

  const searchText = normalizeStr(`${subject || ""} ${(body || "").slice(0, 3000)}`);
  let bestMatch: MatchResult | null = null;
  let bestConfidence = 0;

  for (const d of deals) {
    const deal = d as Record<string, unknown>;
    const matchedOn: string[] = [];
    let confidence = 0;

    if (contactId && deal.primary_contact_id === contactId) {
      matchedOn.push("contact");
      confidence += 0.5;
    }

    if (propertyId && deal.property_id === propertyId) {
      matchedOn.push("property");
      confidence += 0.35;
    }

    const dealAmount = parsed.loanAmount || parsed.purchasePrice;
    if (dealAmount && deal.amount) {
      const diff =
        Math.abs((deal.amount as number) - dealAmount) / dealAmount;
      if (diff <= 0.05) {
        matchedOn.push("amount");
        confidence += 0.1;
      }
    }

    const dealName = normalizeStr(deal.name as string);
    if (dealName && dealName.length > 3 && searchText.includes(dealName)) {
      matchedOn.push("deal_name");
      confidence += 0.4;
    }

    if (deal.deal_number && searchText.includes(normalizeStr(deal.deal_number as string))) {
      matchedOn.push("deal_number");
      confidence += 0.5;
    }

    if (confidence > bestConfidence && confidence >= 0.4) {
      bestConfidence = confidence;
      bestMatch = {
        match_id: deal.id as string,
        confidence: Math.min(confidence, 0.98),
        matched_on: matchedOn,
        snapshot: deal,
      };
    }
  }

  return bestMatch;
}

// ─── Main Handler ───

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cronSecret = Deno.env.get("CRON_SECRET");

  const isAuthorized =
    (serviceRoleKey && token === serviceRoleKey) ||
    (cronSecret && token === cronSecret);

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let email_intake_queue_id: string | null = null;

  try {
    const body = await req.json();
    email_intake_queue_id = body.email_intake_queue_id;

    if (!email_intake_queue_id) {
      return new Response(
        JSON.stringify({ error: "email_intake_queue_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey!
    );

    const { data: existingIntake } = await admin
      .from("intake_items")
      .select("id")
      .eq("email_intake_queue_id", email_intake_queue_id)
      .maybeSingle();

    if (existingIntake) {
      return new Response(
        JSON.stringify({ success: true, intake_item_id: existingIntake.id, already_processed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: queueItem, error: fetchErr } = await admin
      .from("email_intake_queue")
      .select("*")
      .eq("id", email_intake_queue_id)
      .single();

    if (fetchErr || !queueItem) {
      return new Response(
        JSON.stringify({ error: "Queue item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentAttempts = (queueItem.processing_attempts as number) || 0;

    const parsed = await parseEmailWithAI(
      queueItem.subject,
      queueItem.body_preview,
      queueItem.from_email,
      queueItem.from_name,
      queueItem.extraction_summary,
      queueItem.extracted_deal_fields
    );

    // Run matching engine using the resolved contact (broker for forwards)
    const contactMatch = await matchContact(admin, parsed);

    const contactCompanyId = contactMatch?.snapshot?.company_id as string | null;
    const companyMatch = await matchCompany(admin, parsed, contactCompanyId);

    const propertyMatch = await matchProperty(admin, parsed);

    const dealMatch = await matchDeal(
      admin,
      parsed,
      contactMatch?.match_id || null,
      propertyMatch?.match_id || null,
      queueItem.subject,
      queueItem.body_preview
    );

    const autoMatches: Record<string, MatchResult | null> = {
      contact: contactMatch,
      company: companyMatch,
      property: propertyMatch,
      deal: dealMatch,
    };

    const isAutoMatched = dealMatch && dealMatch.confidence >= 0.8;

    const internalSenderId =
      queueItem.extracted_deal_fields?._internal_sender_user_id?.value as string | undefined;

    const { data: intakeItem, error: insertErr } = await admin
      .from("intake_items")
      .insert({
        email_intake_queue_id,
        received_at: queueItem.received_at,
        from_email: queueItem.from_email,
        from_name: queueItem.from_name,
        subject: queueItem.subject,
        raw_body: queueItem.body_preview,
        parsed_data: parsed,
        auto_matches: autoMatches,
        status: isAutoMatched ? "auto_matched" : "pending",
        auto_matched_deal_id: dealMatch?.match_id || null,
        match_confidence: dealMatch?.confidence || 0,
        match_details: dealMatch
          ? { matched_on: dealMatch.matched_on, snapshot: dealMatch.snapshot }
          : {},
        ...(internalSenderId ? { processed_by: internalSenderId } : {}),
      })
      .select("id")
      .single();

    if (insertErr) {
      await admin
        .from("email_intake_queue")
        .update({
          error_message: `intake_items insert failed: ${insertErr.message}`,
          processing_attempts: currentAttempts + 1,
        })
        .eq("id", email_intake_queue_id);

      return new Response(
        JSON.stringify({ error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create document records for uploaded attachments
    const attachments = (queueItem.attachments as { filename: string; mime_type: string; size_bytes: number; storage_path?: string; extraction_status: string }[]) || [];
    const uploadedAttachments = attachments.filter((a) => a.storage_path);
    let documentsCreated = 0;

    for (const att of uploadedAttachments) {
      try {
        await admin.from("documents").insert({
          file_name: att.filename,
          file_path: att.storage_path,
          file_size: att.size_bytes,
          mime_type: att.mime_type,
          source: "email_intake",
          uploaded_by: internalSenderId || null,
          description: `Intake attachment from: ${queueItem.subject || "(no subject)"}`,
          status: "pending_review",
        });
        documentsCreated++;
      } catch (docErr) {
        console.error(`Document record creation failed for ${att.filename}:`, docErr);
      }
    }

    await admin
      .from("email_intake_queue")
      .update({
        error_message: null,
        processing_attempts: currentAttempts + 1,
      })
      .eq("id", email_intake_queue_id);

    // Log extraction quality for debugging
    const fieldsWithValues = Object.entries(parsed).filter(
      ([, v]) => v != null && v !== undefined
    ).length;
    console.log(`Intake item ${intakeItem.id}: ${fieldsWithValues} fields populated, ` +
      `${documentsCreated} docs created, forwarded=${parsed.isForwarded || false}`);

    return new Response(
      JSON.stringify({
        success: true,
        intake_item_id: intakeItem.id,
        auto_matched: isAutoMatched,
        documents_created: documentsCreated,
        fields_populated: fieldsWithValues,
        internal_sender: internalSenderId || null,
        is_forwarded: parsed.isForwarded || false,
        matches: {
          contact: contactMatch ? { confidence: contactMatch.confidence, matched_on: contactMatch.matched_on } : null,
          company: companyMatch ? { confidence: companyMatch.confidence } : null,
          property: propertyMatch ? { confidence: propertyMatch.confidence } : null,
          deal: dealMatch
            ? { confidence: dealMatch.confidence, deal_id: dealMatch.match_id, matched_on: dealMatch.matched_on }
            : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-intake-email error:", err);

    if (email_intake_queue_id) {
      try {
        const adminForError = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await adminForError
          .from("email_intake_queue")
          .update({
            error_message: err instanceof Error ? err.message : String(err),
          })
          .eq("id", email_intake_queue_id);
      } catch {
        // Don't mask the original error
      }
    }

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
