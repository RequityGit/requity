// Supabase Edge Function: process-intake-email
// Takes an email_intake_queue item, parses it with AI into structured 4-entity format,
// runs matching engine against existing CRM records, and creates an intake_items record.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ParsedData {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  ein?: string;
  entityType?: string;
  stateOfFormation?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  units?: number;
  sqft?: number;
  arv?: number;
  yearBuilt?: number;
  zoning?: string;
  loanAmount?: number;
  loanType?: string;
  ltv?: number;
  rate?: number;
  term?: string;
  dscr?: number;
  rehabBudget?: number;
  closingDate?: string;
  notes?: string;
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

// ─── AI Parsing ───

async function parseEmailWithAI(
  subject: string | null,
  body: string | null,
  fromEmail: string,
  fromName: string | null,
  extractionSummary: string | null,
  extractedFields: Record<string, { value: unknown }> | null
): Promise<ParsedData> {
  // If we already have extracted fields from the email_intake_queue AI processing,
  // map them to our structured format
  const parsed: ParsedData = {};

  // Start with from email info
  parsed.contactEmail = fromEmail;
  parsed.contactName = fromName || undefined;

  if (extractedFields) {
    // Map existing extracted fields
    const get = (key: string) => {
      const f = extractedFields[key];
      return f?.value != null ? String(f.value) : undefined;
    };
    const getNum = (key: string) => {
      const f = extractedFields[key];
      return f?.value != null ? Number(f.value) : undefined;
    };

    parsed.contactName = get("borrower_name") || parsed.contactName;
    parsed.contactEmail = get("borrower_email") || parsed.contactEmail;
    parsed.propertyAddress = get("property_address");
    parsed.loanAmount = getNum("amount");
    parsed.loanType =
      get("deal_type_indicators") || get("asset_class") || undefined;
  }

  // If we have extraction summary but no structured fields, try to parse from body
  if (!extractedFields && body) {
    // Basic regex extraction as fallback
    const phoneMatch = body.match(
      /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/
    );
    if (phoneMatch) parsed.contactPhone = phoneMatch[1];

    const amountMatch = body.match(
      /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:k|K|M|m)?/
    );
    if (amountMatch) {
      let amount = parseFloat(amountMatch[1].replace(/,/g, ""));
      if (/[kK]/.test(amountMatch[0])) amount *= 1000;
      if (/[mM]/.test(amountMatch[0])) amount *= 1000000;
      parsed.loanAmount = amount;
    }

    // Property type detection
    const typePatterns: Record<string, RegExp> = {
      SFR: /\b(sfr|single.?family|house)\b/i,
      Multifamily: /\b(multi.?family|apartment|units?)\b/i,
      Commercial: /\b(commercial|retail|office)\b/i,
    };
    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(body)) {
        parsed.propertyType = type;
        break;
      }
    }

    // Loan type detection
    const loanPatterns: Record<string, RegExp> = {
      DSCR: /\b(dscr|rental|long.?term)\b/i,
      RTL: /\b(rtl|fix.?(?:and|&|n).?flip|rehab|bridge)\b/i,
      "Comm Debt": /\b(commercial.?(?:loan|debt|mortgage))\b/i,
    };
    for (const [type, pattern] of Object.entries(loanPatterns)) {
      if (pattern.test(body)) {
        parsed.loanType = type;
        break;
      }
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
    const rehabMatch = body.match(
      /rehab[:\s]*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:k|K|M|m)?/i
    );
    if (rehabMatch) {
      let rehab = parseFloat(rehabMatch[1].replace(/,/g, ""));
      if (/[kK]/.test(rehabMatch[0])) rehab *= 1000;
      if (/[mM]/.test(rehabMatch[0])) rehab *= 1000000;
      parsed.rehabBudget = rehab;
    }

    // Notes: use the extraction summary or subject as notes
    parsed.notes = extractionSummary || subject || undefined;
  }

  return parsed;
}

// ─── Matching Engine ───

async function matchContact(
  admin: ReturnType<typeof createClient>,
  parsed: ParsedData
): Promise<MatchResult | null> {
  if (!parsed.contactEmail && !parsed.contactPhone && !parsed.contactName)
    return null;

  // Try email match first (highest confidence)
  if (parsed.contactEmail) {
    const { data: emailMatches } = await admin
      .from("crm_contacts")
      .select("id, name, first_name, last_name, email, phone, address_line1, city, state, notes")
      .eq("email", parsed.contactEmail)
      .is("deleted_at", null)
      .limit(1);

    if (emailMatches && emailMatches.length > 0) {
      const c = emailMatches[0];
      const matchedOn = ["email"];
      let confidence = 0.95;

      // Boost if name also matches
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

  // Try phone match
  if (parsed.contactPhone) {
    const normalizedPhone = normalizePhone(parsed.contactPhone);
    if (normalizedPhone.length >= 10) {
      const { data: phoneMatches } = await admin
        .from("crm_contacts")
        .select("id, name, first_name, last_name, email, phone, address_line1, city, state, notes")
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
  if (!parsed.companyName) return null;

  const normalizedName = normalizeStr(parsed.companyName)
    .replace(/llc|inc|corp|ltd|co/g, "")
    .trim();

  if (!normalizedName) return null;

  const { data: companies } = await admin
    .from("companies")
    .select("id, name, email, phone, state")
    .is("deleted_at", null);

  if (!companies) return null;

  // Exact name match
  for (const co of companies) {
    const extName = normalizeStr((co as Record<string, unknown>).name as string)
      .replace(/llc|inc|corp|ltd|co/g, "")
      .trim();

    if (extName === normalizedName) {
      return {
        match_id: (co as Record<string, unknown>).id as string,
        confidence: 0.9,
        matched_on: ["name"],
        snapshot: co as Record<string, unknown>,
      };
    }
  }

  // If the matched contact belongs to a company, boost that
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

async function matchOpportunity(
  admin: ReturnType<typeof createClient>,
  parsed: ParsedData,
  contactId: string | null,
  propertyId: string | null
): Promise<MatchResult | null> {
  if (!contactId && !propertyId) return null;

  // Look for existing deals matching contact + property
  let query = admin
    .from("unified_deals")
    .select("id, name, amount, primary_contact_id, property_id")
    .in("status", ["active", "on_hold"]);

  if (contactId) {
    query = query.eq("primary_contact_id", contactId);
  }

  const { data: deals } = await query;
  if (!deals || deals.length === 0) return null;

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

    // Amount within 5%
    if (parsed.loanAmount && deal.amount) {
      const diff =
        Math.abs((deal.amount as number) - parsed.loanAmount) /
        parsed.loanAmount;
      if (diff <= 0.05) {
        matchedOn.push("amount");
        confidence += 0.1;
      }
    }

    if (confidence >= 0.5) {
      return {
        match_id: deal.id as string,
        confidence: Math.min(confidence, 0.95),
        matched_on: matchedOn,
        snapshot: deal,
      };
    }
  }

  return null;
}

// ─── Main Handler ───

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify bearer token: accept either SUPABASE_SERVICE_ROLE_KEY or CRON_SECRET.
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

    // Idempotency guard: skip if intake_items already exists for this queue item
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

    // Fetch the email intake queue item
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

    // Parse email into structured 4-entity format
    const parsed = await parseEmailWithAI(
      queueItem.subject,
      queueItem.body_preview,
      queueItem.from_email,
      queueItem.from_name,
      queueItem.extraction_summary,
      queueItem.extracted_deal_fields
    );

    // Run matching engine
    const contactMatch = await matchContact(admin, parsed);

    const contactCompanyId = contactMatch?.snapshot?.company_id as
      | string
      | null;
    const companyMatch = await matchCompany(admin, parsed, contactCompanyId);

    const propertyMatch = await matchProperty(admin, parsed);

    const opportunityMatch = await matchOpportunity(
      admin,
      parsed,
      contactMatch?.match_id || null,
      propertyMatch?.match_id || null
    );

    const autoMatches: Record<string, MatchResult | null> = {
      contact: contactMatch,
      company: companyMatch,
      property: propertyMatch,
      opportunity: opportunityMatch,
    };

    // Create intake_items record
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
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) {
      // Update queue item with error
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

    // Update queue item on success: clear error, increment attempts
    await admin
      .from("email_intake_queue")
      .update({
        error_message: null,
        processing_attempts: currentAttempts + 1,
      })
      .eq("id", email_intake_queue_id);

    return new Response(
      JSON.stringify({
        success: true,
        intake_item_id: intakeItem.id,
        matches: {
          contact: contactMatch ? { confidence: contactMatch.confidence } : null,
          company: companyMatch ? { confidence: companyMatch.confidence } : null,
          property: propertyMatch
            ? { confidence: propertyMatch.confidence }
            : null,
          opportunity: opportunityMatch
            ? { confidence: opportunityMatch.confidence }
            : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-intake-email error:", err);

    // Update queue item with error details
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
