"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  runPricing,
  type DealInput,
  type LenderProduct,
  type BaseRate,
  type FicoLtvAdjustment,
  type PriceAdjustment,
} from "@/lib/dscr/pricing-engine";

import type { Json } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Lender CRUD
// ---------------------------------------------------------------------------

export interface LenderInput {
  name: string;
  short_name: string;
  nmls_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  account_executive?: string;
  ae_email?: string;
  ae_phone?: string;
  notes?: string;
}

export async function addLenderAction(input: LenderInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dscr_lenders")
      .insert({
        name: input.name,
        short_name: input.short_name,
        nmls_id: input.nmls_id || null,
        contact_name: input.contact_name || null,
        contact_email: input.contact_email || null,
        contact_phone: input.contact_phone || null,
        account_executive: input.account_executive || null,
        ae_email: input.ae_email || null,
        ae_phone: input.ae_phone || null,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    // Record version history
    const lenderId = data.id;
    await admin.from("dscr_pricing_versions").insert({
      lender_id: lenderId,
      lender_name: input.short_name || input.name,
      version: 1,
      change_type: "lender_added",
      change_description: `New lender added: ${input.name} (${input.short_name})`,
      changed_by: auth.user.id,
    });

    return { success: true, lenderId };
  } catch (err: unknown) {
    console.error("addLenderAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to add lender" };
  }
}

export async function updateLenderAction(id: string, input: LenderInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("dscr_lenders")
      .update({
        name: input.name,
        short_name: input.short_name,
        nmls_id: input.nmls_id || null,
        contact_name: input.contact_name || null,
        contact_email: input.contact_email || null,
        contact_phone: input.contact_phone || null,
        account_executive: input.account_executive || null,
        ae_email: input.ae_email || null,
        ae_phone: input.ae_phone || null,
        notes: input.notes || null,
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err: unknown) {
    console.error("updateLenderAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function toggleLenderActiveAction(id: string, isActive: boolean) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("dscr_lenders")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err: unknown) {
    console.error("toggleLenderActiveAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------------------------

export interface ProductInput {
  lender_id: string;
  product_name: string;
  product_type?: string;
  lock_period_days?: number;
  floor_rate?: number;
  max_price?: number;
  min_price?: number;
  max_ltv_purchase?: number;
  max_ltv_rate_term?: number;
  max_ltv_cashout?: number;
  max_loan_amount?: number;
  min_loan_amount?: number;
  funding_fee?: number;
  underwriting_fee?: number;
  processing_fee?: number;
  desk_review_fee?: number;
  entity_review_fee?: number;
  state_restrictions?: string[];
  eligible_property_types?: string[];
  eligible_borrower_types?: string[];
}

export async function addProductAction(input: ProductInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dscr_lender_products")
      .insert({
        lender_id: input.lender_id,
        product_name: input.product_name,
        product_type: input.product_type || "dscr",
        lock_period_days: input.lock_period_days ?? 45,
        floor_rate: input.floor_rate ?? null,
        max_price: input.max_price ?? null,
        min_price: input.min_price ?? null,
        max_ltv_purchase: input.max_ltv_purchase ?? null,
        max_ltv_rate_term: input.max_ltv_rate_term ?? null,
        max_ltv_cashout: input.max_ltv_cashout ?? null,
        max_loan_amount: input.max_loan_amount ?? null,
        min_loan_amount: input.min_loan_amount ?? null,
        funding_fee: input.funding_fee ?? null,
        underwriting_fee: input.underwriting_fee ?? null,
        processing_fee: input.processing_fee ?? null,
        desk_review_fee: input.desk_review_fee ?? null,
        entity_review_fee: input.entity_review_fee ?? null,
        state_restrictions: input.state_restrictions || [],
        eligible_property_types: input.eligible_property_types || [],
        eligible_borrower_types: input.eligible_borrower_types || [],
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    // Record version history
    const productId = data.id;
    const { data: lender } = await admin
      .from("dscr_lenders")
      .select("name, short_name")
      .eq("id", input.lender_id)
      .single();

    if (lender) {
      await admin.from("dscr_pricing_versions").insert({
        lender_id: input.lender_id,
        product_id: productId,
        lender_name: lender.short_name || lender.name,
        product_name: input.product_name,
        version: 1,
        change_type: "product_added",
        change_description: `New product added: ${input.product_name}`,
        changed_by: auth.user.id,
      });
    }

    return { success: true, productId };
  } catch (err: unknown) {
    console.error("addProductAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function updateProductAction(id: string, input: Omit<ProductInput, "lender_id">) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("dscr_lender_products")
      .update({
        product_name: input.product_name,
        product_type: input.product_type || "dscr",
        lock_period_days: input.lock_period_days ?? 45,
        floor_rate: input.floor_rate ?? null,
        max_price: input.max_price ?? null,
        min_price: input.min_price ?? null,
        max_ltv_purchase: input.max_ltv_purchase ?? null,
        max_ltv_rate_term: input.max_ltv_rate_term ?? null,
        max_ltv_cashout: input.max_ltv_cashout ?? null,
        max_loan_amount: input.max_loan_amount ?? null,
        min_loan_amount: input.min_loan_amount ?? null,
        funding_fee: input.funding_fee ?? null,
        underwriting_fee: input.underwriting_fee ?? null,
        processing_fee: input.processing_fee ?? null,
        desk_review_fee: input.desk_review_fee ?? null,
        entity_review_fee: input.entity_review_fee ?? null,
        state_restrictions: input.state_restrictions || [],
        eligible_property_types: input.eligible_property_types || [],
        eligible_borrower_types: input.eligible_borrower_types || [],
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err: unknown) {
    console.error("updateProductAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function toggleProductActiveAction(id: string, isActive: boolean) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("dscr_lender_products")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) return { error: error.message };

    // Record version history
    const { data: product } = await admin
      .from("dscr_lender_products")
      .select("*, dscr_lenders(name, short_name)")
      .eq("id", id)
      .single();

    if (product) {
      const lenderInfo = product.dscr_lenders as { name: string; short_name: string } | null;
      await admin.from("dscr_pricing_versions").insert({
        lender_id: product.lender_id,
        product_id: id,
        lender_name: lenderInfo?.short_name || lenderInfo?.name || "Unknown",
        product_name: product.product_name,
        version: 0,
        change_type: isActive ? "product_added" : "product_deactivated",
        change_description: `Product ${isActive ? "activated" : "deactivated"}: ${product.product_name}`,
        changed_by: auth.user.id,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("toggleProductActiveAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Rate sheet data commit (from parsed data)
// ---------------------------------------------------------------------------

export interface CommitRateSheetInput {
  product_id: string;
  rate_sheet_date: string;
  base_rates: { note_rate: number; base_price: number }[];
  fico_ltv_adjustments: {
    loan_purpose: string;
    fico_min: number;
    fico_max: number | null;
    fico_label: string;
    ltv_min: number;
    ltv_max: number;
    ltv_label: string;
    adjustment: number | null;
  }[];
  price_adjustments: {
    category: string;
    condition_label: string;
    condition_key: string;
    adj_ltv_0_50: number | null;
    adj_ltv_50_55: number | null;
    adj_ltv_55_60: number | null;
    adj_ltv_60_65: number | null;
    adj_ltv_65_70: number | null;
    adj_ltv_70_75: number | null;
    adj_ltv_75_80: number | null;
    adj_ltv_80_85: number | null;
    adj_ltv_85_90: number | null;
    sort_order?: number;
  }[];
  upload_id?: string;
}

export async function commitRateSheetAction(input: CommitRateSheetInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Delete existing rate data for this product
    await admin.from("dscr_base_rates").delete().eq("product_id", input.product_id);
    await admin.from("dscr_fico_ltv_adjustments").delete().eq("product_id", input.product_id);
    await admin.from("dscr_price_adjustments").delete().eq("product_id", input.product_id);

    // Insert base rates
    if (input.base_rates.length > 0) {
      const { error: rateErr } = await admin
        .from("dscr_base_rates")
        .insert(
          input.base_rates.map((r) => ({
            product_id: input.product_id,
            note_rate: r.note_rate,
            base_price: r.base_price,
          }))
        );
      if (rateErr) return { error: `Base rates: ${rateErr.message}` };
    }

    // Insert FICO/LTV adjustments
    if (input.fico_ltv_adjustments.length > 0) {
      const { error: ficoErr } = await admin
        .from("dscr_fico_ltv_adjustments")
        .insert(
          input.fico_ltv_adjustments.map((a) => ({
            product_id: input.product_id,
            loan_purpose: a.loan_purpose,
            fico_min: a.fico_min,
            fico_max: a.fico_max,
            fico_label: a.fico_label,
            ltv_min: a.ltv_min,
            ltv_max: a.ltv_max,
            ltv_label: a.ltv_label,
            adjustment: a.adjustment,
          }))
        );
      if (ficoErr) return { error: `FICO/LTV: ${ficoErr.message}` };
    }

    // Insert price adjustments
    if (input.price_adjustments.length > 0) {
      const { error: adjErr } = await admin
        .from("dscr_price_adjustments")
        .insert(
          input.price_adjustments.map((a, idx) => ({
            product_id: input.product_id,
            category: a.category,
            condition_label: a.condition_label,
            condition_key: a.condition_key,
            adj_ltv_0_50: a.adj_ltv_0_50,
            adj_ltv_50_55: a.adj_ltv_50_55,
            adj_ltv_55_60: a.adj_ltv_55_60,
            adj_ltv_60_65: a.adj_ltv_60_65,
            adj_ltv_65_70: a.adj_ltv_65_70,
            adj_ltv_70_75: a.adj_ltv_70_75,
            adj_ltv_75_80: a.adj_ltv_75_80,
            adj_ltv_80_85: a.adj_ltv_80_85,
            adj_ltv_85_90: a.adj_ltv_85_90,
            sort_order: a.sort_order ?? idx,
          }))
        );
      if (adjErr) return { error: `LLPAs: ${adjErr.message}` };
    }

    // Update product rate sheet date
    await admin
      .from("dscr_lender_products")
      .update({ rate_sheet_date: input.rate_sheet_date })
      .eq("id", input.product_id);

    // Update upload record if provided
    if (input.upload_id) {
      await admin
        .from("dscr_rate_sheet_uploads")
        .update({ parsing_status: "success", parsed_at: new Date().toISOString() })
        .eq("id", input.upload_id);
    }

    // Record version history
    const { data: product } = await admin
      .from("dscr_lender_products")
      .select("*, dscr_lenders(name, short_name)")
      .eq("id", input.product_id)
      .single();

    if (product) {
      const lenderInfo = product.dscr_lenders as { name: string; short_name: string } | null;
      // Get next version number
      const { data: lastVersion } = await admin
        .from("dscr_pricing_versions")
        .select("version")
        .eq("product_id", input.product_id)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (lastVersion?.version ?? 0) + 1;

      await admin.from("dscr_pricing_versions").insert({
        lender_id: product.lender_id,
        product_id: input.product_id,
        lender_name: lenderInfo?.short_name || lenderInfo?.name || "Unknown",
        product_name: product.product_name,
        version: nextVersion,
        change_type: "rate_sheet_commit",
        change_description: `Rate sheet committed (${input.base_rates.length} rates, ${input.price_adjustments.length} LLPAs, effective ${input.rate_sheet_date})`,
        changed_by: auth.user.id,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("commitRateSheetAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Pricing Engine — Run pricing for a deal
// ---------------------------------------------------------------------------

export interface PricingRunInput {
  borrower_name?: string;
  borrower_entity?: string;
  property_address?: string;
  property_city?: string;
  property_state: string;
  property_zip?: string;
  property_type: string;
  property_value: number;
  monthly_rent: number;
  num_units?: number;
  loan_purpose: string;
  loan_amount: number;
  fico_score: number;
  borrower_type?: string;
  income_doc_type?: string;
  is_interest_only?: boolean;
  is_short_term_rental?: boolean;
  escrow_waiver?: boolean;
  prepay_preference?: string;
  monthly_taxes?: number;
  monthly_insurance?: number;
  monthly_hoa?: number;
  monthly_flood?: number;
  lock_period_days?: number;
  broker_points?: number;
}

export async function runPricingAction(input: PricingRunInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const ltv =
      input.property_value > 0
        ? (input.loan_amount / input.property_value) * 100
        : 0;

    const dealInput: DealInput = {
      loan_amount: input.loan_amount,
      property_value: input.property_value,
      ltv,
      loan_purpose: input.loan_purpose as "purchase" | "rate_term" | "cashout",
      borrower_fico: input.fico_score,
      property_type: input.property_type,
      property_state: input.property_state,
      monthly_rent: input.monthly_rent,
      monthly_taxes: input.monthly_taxes || 0,
      monthly_insurance: input.monthly_insurance || 0,
      monthly_hoa: input.monthly_hoa || 0,
      monthly_flood: input.monthly_flood || 0,
      interest_only: input.is_interest_only || false,
      escrow_waiver: input.escrow_waiver || false,
      is_short_term_rental: input.is_short_term_rental || false,
      borrower_type: input.borrower_type || "us_citizen",
      income_doc_type: input.income_doc_type || "dscr_only",
      lock_period_days: input.lock_period_days || 45,
      prepay_preference: input.prepay_preference || "flexible",
      broker_points: input.broker_points ?? 2.0,
      num_units: input.num_units || 1,
    };

    // Fetch all active products with their lender info
    const { data: products, error: prodErr } = await admin
      .from("dscr_lender_products")
      .select("*, dscr_lenders!inner(name, short_name)")
      .eq("is_active", true);

    if (prodErr) return { error: prodErr.message };
    if (!products || products.length === 0) {
      return { error: "No active lender products found. Upload rate sheets first." };
    }

    // Build product data for the pricing engine
    const productData = await Promise.all(
      products.map(async (p) => {
        const [baseRatesRes, ficoRes, adjRes] = await Promise.all([
          admin
            .from("dscr_base_rates")
            .select("note_rate, base_price")
            .eq("product_id", p.id)
            .order("note_rate"),
          admin
            .from("dscr_fico_ltv_adjustments")
            .select("*")
            .eq("product_id", p.id),
          admin
            .from("dscr_price_adjustments")
            .select("*")
            .eq("product_id", p.id)
            .order("sort_order"),
        ]);

        const lenderInfo = p.dscr_lenders as { name: string; short_name: string } | null;
        const product: LenderProduct = {
          id: p.id,
          lender_id: p.lender_id,
          lender_name: lenderInfo?.name || "Unknown",
          lender_short_name: lenderInfo?.short_name || "?",
          product_name: p.product_name,
          product_type: p.product_type ?? "dscr",
          lock_period_days: p.lock_period_days ?? 45,
          floor_rate: p.floor_rate,
          max_price: p.max_price,
          min_price: p.min_price,
          max_ltv_purchase: p.max_ltv_purchase,
          max_ltv_rate_term: p.max_ltv_rate_term,
          max_ltv_cashout: p.max_ltv_cashout,
          max_loan_amount: p.max_loan_amount,
          min_loan_amount: p.min_loan_amount,
          state_restrictions: (p.state_restrictions as string[]) || [],
          eligible_property_types: (p.eligible_property_types as string[]) || [],
          eligible_borrower_types: (p.eligible_borrower_types as string[]) || [],
          funding_fee: p.funding_fee,
          underwriting_fee: p.underwriting_fee,
          processing_fee: p.processing_fee,
          desk_review_fee: p.desk_review_fee,
          entity_review_fee: p.entity_review_fee,
          other_fees: (p.other_fees as Record<string, number>) || {},
          rate_sheet_date: p.rate_sheet_date,
        };

        return {
          product,
          baseRates: (baseRatesRes.data || []) as unknown as BaseRate[],
          ficoLtvAdj: (ficoRes.data || []) as unknown as FicoLtvAdjustment[],
          priceAdj: (adjRes.data || []) as unknown as PriceAdjustment[],
        };
      })
    );

    // Run the pricing engine
    const pricingResult = runPricing(productData, dealInput);

    // Save the pricing run
    const { data: run, error: runErr } = await admin
      .from("dscr_pricing_runs")
      .insert({
        run_by: auth.user.id,
        borrower_name: input.borrower_name || null,
        borrower_entity: input.borrower_entity || null,
        property_address: input.property_address || null,
        property_city: input.property_city || null,
        property_state: input.property_state,
        property_zip: input.property_zip || null,
        property_type: input.property_type,
        property_value: input.property_value,
        monthly_rent: input.monthly_rent,
        num_units: input.num_units || 1,
        loan_purpose: input.loan_purpose,
        loan_amount: input.loan_amount,
        fico_score: input.fico_score,
        borrower_type: input.borrower_type || "us_citizen",
        income_doc_type: input.income_doc_type || "dscr_only",
        is_interest_only: input.is_interest_only || false,
        is_short_term_rental: input.is_short_term_rental || false,
        escrow_waiver: input.escrow_waiver || false,
        prepay_preference: input.prepay_preference || "flexible",
        monthly_taxes: input.monthly_taxes || 0,
        monthly_insurance: input.monthly_insurance || 0,
        monthly_hoa: input.monthly_hoa || 0,
        monthly_flood: input.monthly_flood || 0,
        lock_period_days: input.lock_period_days || 45,
        broker_points: input.broker_points ?? 2.0,
        ltv,
        results: pricingResult as unknown as Json,
        best_execution_lender: pricingResult.best_execution?.lender_name || null,
        best_execution_rate: pricingResult.best_execution?.best_par_rate?.note_rate || null,
        best_execution_price: pricingResult.best_execution?.best_par_rate?.net_price || null,
        status: "quoted",
        quoted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runErr) return { error: runErr.message };

    return {
      success: true,
      pricingRunId: run.id,
      result: pricingResult,
    };
  } catch (err: unknown) {
    console.error("runPricingAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Rate Sheet PDF Parsing
// ---------------------------------------------------------------------------

export async function parseRateSheetAction(uploadId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get upload record
    const { data: upload, error: uploadErr } = await admin
      .from("dscr_rate_sheet_uploads")
      .select("*")
      .eq("id", uploadId)
      .single();

    if (uploadErr || !upload) return { error: "Upload not found" };

    // Update status to parsing
    await admin
      .from("dscr_rate_sheet_uploads")
      .update({ parsing_status: "parsing" })
      .eq("id", uploadId);

    // Download the PDF from storage
    const { data: fileData, error: fileErr } = await admin
      .storage
      .from("rate-sheets")
      .download(upload.file_path);

    if (fileErr || !fileData) {
      await admin
        .from("dscr_rate_sheet_uploads")
        .update({ parsing_status: "error", parsing_notes: "Could not download file" })
        .eq("id", uploadId);
      return { error: "Could not download rate sheet file" };
    }

    // Convert to base64
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mediaType = "application/pdf";

    // Call Anthropic Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      await admin
        .from("dscr_rate_sheet_uploads")
        .update({ parsing_status: "error", parsing_notes: "ANTHROPIC_API_KEY not configured" })
        .eq("id", uploadId);
      return { error: "ANTHROPIC_API_KEY not configured" };
    }

    const systemPrompt = `You are a DSCR mortgage rate sheet parser. You receive PDF rate sheets from wholesale mortgage lenders and extract all pricing data into structured JSON.

CRITICAL RULES:
- Extract EVERY number exactly as shown. Do not round, interpolate, or estimate.
- Negative adjustments shown in parentheses (0.250) should be stored as -0.250.
- Blank cells or dashes mean the combination is INELIGIBLE — mark as null.
- Parse ALL products/pages in the PDF. Each page may be a different product.
- Preserve the exact FICO band boundaries.
- Preserve exact LTV band boundaries.
- State restrictions must be captured verbatim.

Return ONLY valid JSON with this structure:
{
  "lender_name": "string",
  "effective_date": "YYYY-MM-DD",
  "products": [
    {
      "product_name": "string",
      "lock_period_days": 45,
      "floor_rate": 6.000,
      "max_price": 102.000,
      "max_ltv": {"purchase": 80, "rate_term": 80, "cashout": 75},
      "lender_fees": {
        "underwriting_fee": 1699,
        "processing_fee": 695,
        "funding_fee": 735,
        "desk_review_fee": 125,
        "entity_review_fee": 450
      },
      "state_restrictions": ["ND", "SD"],
      "base_rates": [
        {"rate": 6.000, "price": 99.125},
        {"rate": 6.125, "price": 99.625}
      ],
      "fico_ltv_grids": {
        "purchase": [
          {"fico_label": "≥780", "fico_min": 780, "fico_max": null, "adjustments": {
            "0-50": 1.125, "50.01-55": 1.125, "55.01-60": 1.000, "60.01-65": 0.875,
            "65.01-70": 0.750, "70.01-75": 0.500, "75.01-80": 0.125, "80.01-85": null, "85.01-90": null
          }}
        ],
        "rate_term": [...],
        "cashout": [...]
      },
      "price_adjustments": [
        {
          "category": "property_type",
          "label": "2-4 Units",
          "key": "property_type:2_4_unit",
          "adjustments": {"0-50": -0.500, "50.01-55": -0.500, "55.01-60": -0.500}
        }
      ],
      "prepay_adjustments": [
        {"label": "5yr Fixed", "key": "prepay_penalty:fixed_5yr", "adjustments": {"0-50": 0.750, "50.01-55": 0.750}}
      ]
    }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 16000,
        system: systemPrompt,
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
                text: "Parse this DSCR rate sheet into structured JSON. Extract every rate, adjustment, and restriction exactly as shown.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await admin
        .from("dscr_rate_sheet_uploads")
        .update({ parsing_status: "error", parsing_notes: `API error: ${response.status}` })
        .eq("id", uploadId);
      return { error: `Claude API error: ${response.status} — ${errorText}` };
    }

    const apiResult = await response.json() as { content?: { type: string; text: string }[] };
    const textContent = apiResult.content?.find((c) => c.type === "text");
    if (!textContent) {
      await admin
        .from("dscr_rate_sheet_uploads")
        .update({ parsing_status: "error", parsing_notes: "No text response from API" })
        .eq("id", uploadId);
      return { error: "No response from Claude API" };
    }

    // Extract JSON from response (may be wrapped in markdown code block)
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    let parsedData: Json;
    try {
      parsedData = JSON.parse(jsonStr.trim());
    } catch {
      await admin
        .from("dscr_rate_sheet_uploads")
        .update({
          parsing_status: "error",
          parsing_notes: "Failed to parse JSON from API response",
          raw_parsed_data: { raw_text: textContent.text } as unknown as Json,
        })
        .eq("id", uploadId);
      return { error: "Failed to parse JSON from Claude response" };
    }

    // Store parsed data
    await admin
      .from("dscr_rate_sheet_uploads")
      .update({
        parsing_status: "review_needed",
        parsed_at: new Date().toISOString(),
        parsed_by: auth.user.id,
        raw_parsed_data: parsedData,
      })
      .eq("id", uploadId);

    return { success: true, parsedData };
  } catch (err: unknown) {
    console.error("parseRateSheetAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Rate Sheet Upload
// ---------------------------------------------------------------------------

export async function createRateSheetUploadAction(
  lenderId: string,
  productId: string | null,
  fileName: string,
  filePath: string,
  effectiveDate: string | null
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dscr_rate_sheet_uploads")
      .insert({
        lender_id: lenderId,
        product_id: productId,
        file_name: fileName,
        file_path: filePath,
        effective_date: effectiveDate,
        parsing_status: "pending",
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { success: true, uploadId: data.id };
  } catch (err: unknown) {
    console.error("createRateSheetUploadAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Save quote
// ---------------------------------------------------------------------------

export async function saveQuoteAction(input: {
  pricing_run_id: string;
  borrower_name?: string;
  borrower_email?: string;
  selected_lender_product_id: string;
  selected_rate: number;
  selected_price: number;
  broker_points: number;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dscr_quotes")
      .insert({
        pricing_run_id: input.pricing_run_id,
        borrower_name: input.borrower_name || null,
        borrower_email: input.borrower_email || null,
        selected_lender_product_id: input.selected_lender_product_id,
        selected_rate: input.selected_rate,
        selected_price: input.selected_price,
        broker_points: input.broker_points,
        status: "draft",
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { success: true, quoteId: data.id };
  } catch (err: unknown) {
    console.error("saveQuoteAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
