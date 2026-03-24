import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildCreditMemoPrompt,
  buildInvestorDeckPrompt,
  buildSectionPrompt,
} from "@/lib/docgen/prompts";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/deals/[dealId]/draft-document
 *
 * AI-assisted narrative drafting for credit memos and investor decks.
 *
 * Body: {
 *   document_type: "credit_memo" | "investor_deck",
 *   section?: string  // Optional: regenerate only this section
 * }
 *
 * Auth: Bearer service role key OR authenticated admin/super_admin
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // ── Auth ──
    const auth = req.headers.get("authorization");
    const isServiceRole = auth === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    if (!isServiceRole) {
      // Use SSR-compatible client for cookie-based auth (matches @/lib/supabase/server pattern)
      const { createClient: createServerClient } = await import(
        "@/lib/supabase/server"
      );
      const userClient = await createServerClient();
      const {
        data: { user },
      } = await userClient.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

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

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI drafting not configured. Missing ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { document_type, section } = body as {
      document_type: "credit_memo" | "investor_deck";
      section?: string;
    };

    if (!document_type || !["credit_memo", "investor_deck"].includes(document_type)) {
      return NextResponse.json(
        { error: "Invalid document_type. Must be 'credit_memo' or 'investor_deck'." },
        { status: 400 }
      );
    }

    // ── Fetch deal data ──
    const { data: deal, error: dealError } = await supabase
      .from("unified_deals")
      .select("*, primary_contact:crm_contacts!primary_contact_id(id, first_name, last_name, email)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    // Build deal data context for the prompt
    const dealData: Record<string, unknown> = {
      name: deal.name,
      amount: deal.amount,
      asset_class: deal.asset_class,
      capital_side: deal.capital_side,
      stage: deal.stage,
      property_data: deal.property_data,
      uw_data: deal.uw_data,
      primary_contact: deal.primary_contact,
    };

    // If credit memo, also include existing memo data
    if (document_type === "credit_memo") {
      const { data: memoData } = await supabase
        .from("deal_credit_memos")
        .select("loan_terms, operating_statement, sources_and_uses, sponsor_profile, guarantor_details")
        .eq("deal_id", dealId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (memoData) {
        dealData.existing_memo = memoData;
      }
    }

    // ── Build prompt ──
    let prompt: string;
    if (section) {
      prompt = buildSectionPrompt(section, document_type, dealData);
    } else if (document_type === "credit_memo") {
      prompt = buildCreditMemoPrompt(dealData);
    } else {
      prompt = buildInvestorDeckPrompt(dealData);
    }

    // ── Call Anthropic API ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[draft-document] Anthropic API error:", response.status, errorBody);
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const aiResponse = await response.json();
    const rawText =
      aiResponse.content?.[0]?.type === "text"
        ? aiResponse.content[0].text
        : "";

    // If single section, return plain text
    if (section) {
      return NextResponse.json({ [section]: rawText.trim() });
    }

    // Parse JSON response
    try {
      // Strip code fences if present
      const cleaned = rawText
        .replace(/^```json?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      console.error("[draft-document] Failed to parse AI JSON response:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[draft-document] Unexpected error:", message, error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
