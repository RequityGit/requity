import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/intake/webhook
 *
 * Webhook endpoint for Make.com Inbox Machine to push deal emails into
 * the email_intake_queue. Called when is_deal=true in the triage output.
 *
 * Auth: Bearer token (INTAKE_WEBHOOK_SECRET or CRON_SECRET).
 *
 * Body: {
 *   message_id: string,       // Gmail message ID
 *   thread_id: string,        // Gmail thread ID
 *   from_name: string,
 *   from_email: string,
 *   subject: string,
 *   triage: string,           // red, yellow, green, delegate, archive
 *   deal_type?: string,
 *   deal_first_name?: string,
 *   deal_last_name?: string,
 *   deal_email?: string,
 *   deal_phone?: string,
 *   deal_company?: string,
 *   deal_loan_purpose?: string,
 *   deal_loan_amount?: string,
 *   deal_property_address?: string,
 *   deal_property_type?: string,
 *   deal_city?: string,
 *   deal_state?: string,
 *   deal_notes?: string,
 * }
 */
export async function POST(req: NextRequest) {
  // Auth check — accepts INTAKE_WEBHOOK_SECRET or CRON_SECRET
  const webhookSecret = process.env.INTAKE_WEBHOOK_SECRET || process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const messageId = body.message_id as string | undefined;
    const fromEmail = body.from_email as string | undefined;
    const subject = body.subject as string | undefined;

    if (!messageId || !fromEmail) {
      return NextResponse.json(
        { error: "message_id and from_email are required" },
        { status: 400 }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for duplicate (idempotent by gmail_message_id)
    const { data: existing } = await admin
      .from("email_intake_queue")
      .select("id, status")
      .eq("gmail_message_id", messageId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        intake_id: existing.id,
        status: existing.status,
        duplicate: true,
      });
    }

    // Build extracted deal fields from Make.com's Claude output
    const dealFields: Record<
      string,
      { value: string; confidence: number; source: string }
    > = {};

    const fieldMap: Record<string, string> = {
      deal_first_name: "borrower_first_name",
      deal_last_name: "borrower_last_name",
      deal_email: "borrower_email",
      deal_phone: "borrower_phone",
      deal_company: "borrower_company",
      deal_loan_purpose: "deal_type_indicators",
      deal_loan_amount: "amount",
      deal_property_address: "property_address",
      deal_property_type: "asset_class",
      deal_city: "city",
      deal_state: "state",
      deal_notes: "notes",
      deal_type: "deal_type_indicators",
    };

    for (const [srcKey, destKey] of Object.entries(fieldMap)) {
      const val = body[srcKey];
      if (val && String(val).trim()) {
        // If destKey already exists (e.g. deal_type_indicators from both deal_type and deal_loan_purpose),
        // concatenate the values
        if (dealFields[destKey]) {
          dealFields[destKey].value += `; ${String(val).trim()}`;
        } else {
          dealFields[destKey] = {
            value: String(val).trim(),
            confidence: 0.7,
            source: "make.com inbox machine",
          };
        }
      }
    }

    // Build borrower_name from first + last
    const firstName = body.deal_first_name
      ? String(body.deal_first_name).trim()
      : "";
    const lastName = body.deal_last_name
      ? String(body.deal_last_name).trim()
      : "";
    if (firstName || lastName) {
      dealFields.borrower_name = {
        value: `${firstName} ${lastName}`.trim(),
        confidence: 0.7,
        source: "make.com inbox machine",
      };
    }

    // Build a deal name from address or subject
    const propertyAddress = body.deal_property_address
      ? String(body.deal_property_address).trim()
      : "";
    if (propertyAddress) {
      dealFields.name = {
        value: propertyAddress,
        confidence: 0.6,
        source: "make.com inbox machine",
      };
    } else if (subject) {
      dealFields.name = {
        value: subject,
        confidence: 0.4,
        source: "email subject",
      };
    }

    const hasDealFields = Object.keys(dealFields).length > 0;

    // Match contact by email
    let matchedContactId: string | null = null;
    const dealEmail = body.deal_email
      ? String(body.deal_email).trim()
      : fromEmail;
    if (dealEmail) {
      const { data: matchData } = await admin.rpc("match_email_to_entities", {
        lookup_email: dealEmail,
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

    // Auto-detect card type
    let suggestedCardTypeId: string | null = null;
    const loanPurpose = (
      body.deal_loan_purpose ||
      body.deal_type ||
      ""
    )
      .toString()
      .toLowerCase();

    if (loanPurpose) {
      const { data: cardTypes } = await admin
        .from("unified_card_types")
        .select("id, label, slug");

      if (cardTypes && cardTypes.length > 0) {
        const labelMatch = (keywords: string[]) =>
          cardTypes.find((ct) =>
            keywords.some(
              (kw) =>
                ct.label.toLowerCase().includes(kw) ||
                ct.slug?.toLowerCase().includes(kw)
            )
          );

        if (
          loanPurpose.includes("fix") ||
          loanPurpose.includes("flip")
        ) {
          suggestedCardTypeId = labelMatch(["fix", "flip"])?.id || null;
        } else if (
          loanPurpose.includes("construction") ||
          loanPurpose.includes("ground")
        ) {
          suggestedCardTypeId =
            labelMatch(["construction", "ground"])?.id || null;
        } else if (loanPurpose.includes("bridge")) {
          suggestedCardTypeId = labelMatch(["bridge"])?.id || null;
        } else if (
          loanPurpose.includes("dscr") ||
          loanPurpose.includes("rental")
        ) {
          suggestedCardTypeId = labelMatch(["dscr", "rental"])?.id || null;
        } else if (loanPurpose.includes("multifamily")) {
          suggestedCardTypeId =
            labelMatch(["multifamily", "commercial"])?.id || null;
        }
      }
    }

    // Build summary
    const summaryParts: string[] = [];
    if (body.deal_loan_purpose) summaryParts.push(`Purpose: ${body.deal_loan_purpose}`);
    if (body.deal_loan_amount) summaryParts.push(`Amount: ${body.deal_loan_amount}`);
    if (propertyAddress) summaryParts.push(`Property: ${propertyAddress}`);
    if (body.deal_city && body.deal_state)
      summaryParts.push(`Location: ${body.deal_city}, ${body.deal_state}`);
    const summary =
      summaryParts.length > 0
        ? summaryParts.join(" | ")
        : `Deal email from ${body.from_name || fromEmail}`;

    // Insert into email_intake_queue
    const { data: inserted, error: insertError } = await admin
      .from("email_intake_queue")
      .insert({
        gmail_message_id: messageId,
        from_email: fromEmail,
        from_name: body.from_name || null,
        subject: subject || null,
        body_preview: body.deal_notes
          ? String(body.deal_notes).substring(0, 500)
          : null,
        received_at: new Date().toISOString(),
        status: hasDealFields ? "ready" : "pending",
        attachments: [],
        extraction_summary: summary,
        extracted_deal_fields: hasDealFields ? dealFields : null,
        suggested_card_type_id: suggestedCardTypeId,
        matched_contact_id: matchedContactId,
      })
      .select("id, status")
      .single();

    if (insertError) {
      console.error("[Intake Webhook] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create intake queue entry", detail: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      intake_id: inserted.id,
      status: inserted.status,
      deal_fields_count: Object.keys(dealFields).length,
      suggested_card_type_id: suggestedCardTypeId,
      matched_contact_id: matchedContactId,
    });
  } catch (error) {
    console.error("[Intake Webhook] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}
