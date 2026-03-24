import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/forms/deal-token
 * Validates a deal application token and returns prefill data + deal context.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, reason: "No token provided" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createAdminClient();

    // Look up the deal application link
    const { data: link, error } = await supabase
      .from("deal_application_links")
      .select(
        `
        id,
        token,
        deal_id,
        form_id,
        contact_id,
        label,
        message,
        prefill_data,
        expires_at,
        status,
        submission_id
      `
      )
      .eq("token", token)
      .single();

    if (error || !link) {
      return NextResponse.json(
        { valid: false, reason: "Invalid or expired link" },
        { status: 404 }
      );
    }

    // Check status
    if (link.status === "revoked") {
      return NextResponse.json(
        { valid: false, reason: "This application link has been revoked" },
        { status: 403 }
      );
    }

    if (link.status === "completed") {
      return NextResponse.json(
        { valid: false, reason: "This application has already been submitted" },
        { status: 403 }
      );
    }

    // Check expiration
    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, reason: "This application link has expired" },
        { status: 403 }
      );
    }

    // Fetch deal info for context
    const { data: deal } = await supabase
      .from("unified_deals")
      .select("id, name, deal_number, loan_type, amount, asset_class, uw_data, property_id")
      .eq("id", link.deal_id)
      .single();

    // Fetch contact info for pre-fill
    let contactPrefill: Record<string, unknown> = {};
    if (link.contact_id) {
      const { data: contact } = await supabase
        .from("crm_contacts")
        .select("first_name, last_name, email, phone, company_name, state, city")
        .eq("id", link.contact_id)
        .single();

      if (contact) {
        contactPrefill = {
          full_name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
          email: contact.email,
          phone: contact.phone,
          entity_name: contact.company_name,
        };
      }
    }

    // Fetch property info for pre-fill
    let propertyPrefill: Record<string, unknown> = {};
    if (deal?.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("address, city, state, zip, property_type")
        .eq("id", deal.property_id)
        .single();

      if (property) {
        const addressParts = [property.address, property.city, property.state, property.zip].filter(Boolean);
        propertyPrefill = {
          property_address: addressParts.join(", "),
          property_type: property.property_type,
        };
      }
    }

    // Build deal-level pre-fill from uw_data
    const dealPrefill: Record<string, unknown> = {};
    if (deal) {
      if (deal.amount) dealPrefill.loan_amount = deal.amount;
      if (deal.loan_type) dealPrefill.loan_type = deal.loan_type;
      if (deal.asset_class) dealPrefill.asset_class = deal.asset_class;

      // Pull additional fields from uw_data
      const uwData = (deal.uw_data || {}) as Record<string, unknown>;
      if (uwData.purchase_price) dealPrefill.purchase_price = uwData.purchase_price;
      if (uwData.after_repair_value) dealPrefill.arv = uwData.after_repair_value;
      if (uwData.rehab_budget) dealPrefill.rehab_budget = uwData.rehab_budget;
    }

    // Merge all prefill sources (explicit prefill_data from link takes priority)
    const prefillData = {
      ...contactPrefill,
      ...propertyPrefill,
      ...dealPrefill,
      ...(link.prefill_data || {}),
    };

    // If there's an existing submission, return the session token for resume
    let existingSessionToken: string | null = null;
    if (link.submission_id) {
      const { data: existingSub } = await supabase
        .from("form_submissions")
        .select("session_token, status, token_expires_at")
        .eq("id", link.submission_id)
        .single();

      if (
        existingSub &&
        existingSub.status !== "submitted" &&
        new Date(existingSub.token_expires_at) > new Date()
      ) {
        existingSessionToken = existingSub.session_token;
      }
    }

    return NextResponse.json({
      valid: true,
      link_id: link.id,
      deal_id: link.deal_id,
      form_id: link.form_id,
      deal_name: deal?.name || null,
      deal_number: deal?.deal_number || null,
      message: link.message,
      prefill_data: prefillData,
      existing_session_token: existingSessionToken,
    });
  } catch (err) {
    console.error("[deal-token] validation error:", err);
    return NextResponse.json(
      { valid: false, reason: "Internal server error" },
      { status: 500 }
    );
  }
}
