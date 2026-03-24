import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const VALID_COMPANY_TYPES = [
  "brokerage",
  "lender",
  "title_company",
  "law_firm",
  "insurance",
  "appraisal",
  "equity_investor",
  "software",
  "accounting_firm",
  "other",
] as const;

const STATE_NAME_TO_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

interface EnrichmentResult {
  name: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  company_types: string[];
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractContent(html: string): string {
  const footerMatch = html.match(/<footer[\s\S]*<\/footer>/i);
  const footerText = footerMatch ? stripTags(footerMatch[0]) : "";

  const bodyText = stripTags(html);

  if (footerText && !bodyText.slice(0, 15000).includes(footerText.slice(0, 100))) {
    return bodyText.slice(0, 14000) + "\n\nFOOTER CONTENT:\n" + footerText.slice(0, 2000);
  }
  return bodyText.slice(0, 16000);
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  let body: { url: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const url = normalizeUrl(body.url);

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const fetchOptions = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RequityBot/1.0; +https://requitygroup.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    };

    const fetchRawHtml = async (pageUrl: string, timeoutMs = 8000): Promise<string> => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(pageUrl, { ...fetchOptions, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) return "";
        return await res.text();
      } catch {
        clearTimeout(timer);
        return "";
      }
    };

    const homepageHtml = await fetchRawHtml(url);
    const homepageText = extractContent(homepageHtml);

    if (homepageText.length < 50) {
      return NextResponse.json(
        { error: "Not enough content found on website" },
        { status: 422 }
      );
    }

    const combinedText = homepageText;

    const systemPrompt = `You are a company research assistant. Given website content (including footer), extract structured company information.

Return ONLY valid JSON with these fields:
{
  "name": "Official company name as it appears on the website, or null if unclear",
  "description": "2-3 sentence professional description of the company. What they do, their focus areas, and location if apparent. Do not use em dashes.",
  "phone": "Main phone number in (XXX) XXX-XXXX format, or null if not found",
  "email": "Main contact or info email address, or null if not found",
  "company_types": ["array of matching types from the allowed list"],
  "address_line1": "Street address (e.g. '123 Main St Suite 200'), or null if not found",
  "city": "City name, or null if not found",
  "state": "MUST be a two-letter US state code like FL, NY, CA, TX. Never use the full state name.",
  "zip": "5-digit ZIP code, or null if not found"
}

The allowed company_types are: ${VALID_COMPANY_TYPES.join(", ")}.
Pick the most relevant type(s). Use "other" only if nothing else fits.
If you cannot determine a field, use null for strings or an empty array for company_types.`;

    const userMessage = body.name
      ? `Company name: ${body.name}\n\nWebsite content from ${url}:\n\n${combinedText}`
      : `Website content from ${url}:\n\n${combinedText}`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Anthropic API error:", aiResponse.status, errText);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const rawText =
      aiData.content?.[0]?.type === "text" ? aiData.content[0].text : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 502 }
      );
    }

    const parsed: EnrichmentResult = JSON.parse(jsonMatch[0]);

    let stateValue = parsed.state || null;
    if (stateValue && stateValue.length > 2) {
      const match = STATE_NAME_TO_ABBR[stateValue.toLowerCase()];
      if (match) stateValue = match;
      else stateValue = null;
    }

    const result: EnrichmentResult = {
      name: parsed.name || null,
      description: parsed.description || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      company_types: Array.isArray(parsed.company_types)
        ? parsed.company_types.filter((t) =>
            VALID_COMPANY_TYPES.includes(t as (typeof VALID_COMPANY_TYPES)[number])
          )
        : [],
      address_line1: parsed.address_line1 || null,
      city: parsed.city || null,
      state: stateValue ? stateValue.toUpperCase() : null,
      zip: parsed.zip || null,
    };

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Website took too long to respond" },
        { status: 504 }
      );
    }
    console.error("Company enrich error:", err);
    return NextResponse.json(
      { error: "Failed to enrich company data" },
      { status: 500 }
    );
  }
}
