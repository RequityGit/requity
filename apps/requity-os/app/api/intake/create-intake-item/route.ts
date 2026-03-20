import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/intake/create-intake-item
 *
 * Bridges email_intake_queue -> intake_items.
 * Takes a ready email_intake_queue item, maps its extracted fields to the
 * 4-entity parsed_data format, runs matching, and creates an intake_items record.
 *
 * Body: { email_intake_queue_id: string }
 */
export async function POST(req: NextRequest) {
  // Auth: require admin session
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!roleData || !["admin", "super_admin"].includes(roleData.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const queueId = body.email_intake_queue_id as string | null;
    if (!queueId) {
      return NextResponse.json({ error: "email_intake_queue_id is required" }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the queue item
    const { data: queueItem, error: fetchErr } = await admin
      .from("email_intake_queue")
      .select("*")
      .eq("id", queueId)
      .single();

    if (fetchErr || !queueItem) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    // Map extracted_deal_fields + extracted_uw_fields to parsed_data format
    type ExtField = { value: string | number | boolean; confidence: number; source: string };
    const dealFields = (queueItem.extracted_deal_fields || {}) as Record<string, ExtField>;
    const uwFields = (queueItem.extracted_uw_fields || {}) as Record<string, ExtField>;

    const get = (fields: Record<string, ExtField>, key: string) => {
      const f = fields[key];
      return f?.value != null ? String(f.value) : undefined;
    };
    const getNum = (fields: Record<string, ExtField>, key: string) => {
      const f = fields[key];
      if (f?.value == null) return undefined;
      const n = Number(f.value);
      return isNaN(n) ? undefined : n;
    };

    const parsedData = {
      contactName: get(dealFields, "borrower_name") || queueItem.from_name || undefined,
      contactEmail: get(dealFields, "borrower_email") || queueItem.from_email,
      contactPhone: undefined as string | undefined,
      companyName: undefined as string | undefined,
      propertyAddress: get(dealFields, "property_address") || get(dealFields, "name"),
      propertyType: get(dealFields, "asset_class") || get(uwFields, "property_type"),
      units: getNum(uwFields, "units"),
      sqft: getNum(uwFields, "square_footage"),
      arv: getNum(uwFields, "arv"),
      yearBuilt: getNum(uwFields, "year_built"),
      loanAmount: getNum(dealFields, "amount"),
      loanType: get(dealFields, "deal_type_indicators"),
      ltv: getNum(uwFields, "loan_to_value"),
      rate: getNum(uwFields, "interest_rate"),
      term: get(uwFields, "loan_term"),
      dscr: getNum(uwFields, "dscr"),
      rehabBudget: getNum(uwFields, "rehab_budget"),
      closingDate: get(dealFields, "expected_close_date"),
      notes: queueItem.extraction_summary || queueItem.subject || undefined,
    };

    // Run matching engine
    const autoMatches: Record<string, unknown> = {};

    // Contact matching
    if (parsedData.contactEmail) {
      const { data: contactMatches } = await admin
        .from("crm_contacts")
        .select("id, name, first_name, last_name, email, phone, address_line1, city, state, company_id, notes")
        .eq("email", parsedData.contactEmail)
        .is("deleted_at", null)
        .limit(1);

      if (contactMatches && contactMatches.length > 0) {
        autoMatches.contact = {
          match_id: contactMatches[0].id,
          confidence: 0.95,
          matched_on: ["email"],
          snapshot: contactMatches[0],
        };
      }
    }

    // If we found a matched contact with company_id, try company match
    const matchedContact = autoMatches.contact as { match_id: string; snapshot: Record<string, unknown> } | undefined;
    if (matchedContact?.snapshot?.company_id) {
      const { data: companyData } = await admin
        .from("companies")
        .select("id, name, email, phone, state")
        .eq("id", matchedContact.snapshot.company_id as string)
        .single();

      if (companyData) {
        autoMatches.company = {
          match_id: companyData.id,
          confidence: 0.85,
          matched_on: ["contact_link"],
          snapshot: companyData,
        };
      }
    }

    // Property matching by address
    if (parsedData.propertyAddress) {
      const normalizedAddr = parsedData.propertyAddress.toLowerCase().replace(/[^a-z0-9]/g, "");
      const { data: properties } = await admin
        .from("properties")
        .select("id, address_line1, city, state, property_type, number_of_units, gross_building_area_sqft, year_built, zoning")
        .is("deleted_at", null);

      if (properties) {
        for (const prop of properties) {
          const propAddr = (prop.address_line1 || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          if (propAddr && propAddr === normalizedAddr) {
            autoMatches.property = {
              match_id: prop.id,
              confidence: 0.95,
              matched_on: ["address"],
              snapshot: prop,
            };
            break;
          }
        }
      }
    }

    // Create intake_items record
    const { data: intakeItem, error: insertErr } = await admin
      .from("intake_items")
      .insert({
        email_intake_queue_id: queueId,
        received_at: queueItem.received_at,
        from_email: queueItem.from_email,
        from_name: queueItem.from_name,
        subject: queueItem.subject,
        raw_body: queueItem.body_preview,
        parsed_data: parsedData,
        auto_matches: autoMatches,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      intake_item_id: intakeItem.id,
    });
  } catch (error) {
    console.error("[Intake] Create intake item error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create intake item" },
      { status: 500 }
    );
  }
}
