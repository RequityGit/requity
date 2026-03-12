// Supabase Edge Function: fetch-intake-emails
//
// Polls the intake@requitygroup.com Gmail inbox, runs Claude extraction on each
// new email, inserts into email_intake_queue, then invokes process-intake-email
// to build the structured intake_items record with CRM matching.
//
// Required Supabase secrets (set via dashboard or `supabase secrets set`):
//   GMAIL_CLIENT_ID
//   GMAIL_CLIENT_SECRET
//   GMAIL_INTAKE_REFRESH_TOKEN   <- refresh token for intake@requitygroup.com
//   ANTHROPIC_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Gmail auth helpers
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_INTAKE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Gmail credentials: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_INTAKE_REFRESH_TOKEN must be set."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail token refresh failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ---------------------------------------------------------------------------
// Gmail API helpers
// ---------------------------------------------------------------------------

interface GmailMessageStub {
  id: string;
  threadId: string;
}

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  filename?: string;
  body: { data?: string; size: number; attachmentId?: string };
  parts?: GmailMessagePart[];
  headers?: GmailMessageHeader[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  internalDate: string;
  payload: GmailMessagePart & { headers: GmailMessageHeader[] };
}

async function listMessages(
  accessToken: string,
  afterEpochSecs: number
): Promise<GmailMessageStub[]> {
  // after: is a Gmail search operator accepting epoch seconds
  const q = `in:inbox after:${afterEpochSecs}`;
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail list messages failed: ${err}`);
  }

  const data = await res.json();
  return (data.messages as GmailMessageStub[]) || [];
}

async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail get message ${messageId} failed: ${err}`);
  }

  return res.json() as Promise<GmailMessage>;
}

// ---------------------------------------------------------------------------
// MIME helpers
// ---------------------------------------------------------------------------

function getHeader(headers: GmailMessageHeader[], name: string): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
    ""
  );
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(base64);
  } catch {
    return "";
  }
}

function extractTextBody(part: GmailMessagePart): string {
  if (part.mimeType === "text/plain" && part.body.data) {
    return decodeBase64Url(part.body.data);
  }

  if (part.mimeType === "text/html" && part.body.data) {
    // Strip HTML tags for a plain-text preview
    const raw = decodeBase64Url(part.body.data);
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (part.parts) {
    for (const child of part.parts) {
      const text = extractTextBody(child);
      if (text) return text;
    }
  }

  return "";
}

interface AttachmentMeta {
  filename: string;
  mime_type: string;
  size_bytes: number;
}

function collectAttachments(part: GmailMessagePart): AttachmentMeta[] {
  const result: AttachmentMeta[] = [];

  function walk(p: GmailMessagePart) {
    if (p.filename && p.filename.length > 0 && p.body.size > 0) {
      result.push({
        filename: p.filename,
        mime_type: p.mimeType,
        size_bytes: p.body.size,
      });
    }
    if (p.parts) p.parts.forEach(walk);
  }

  walk(part);
  return result;
}

// ---------------------------------------------------------------------------
// Name parsing
// ---------------------------------------------------------------------------

function parseFromHeader(raw: string): { email: string; name: string | null } {
  // Handles: "John Doe <john@example.com>" or "john@example.com"
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, "").trim() || null,
      email: match[2].trim().toLowerCase(),
    };
  }
  return { email: raw.trim().toLowerCase(), name: null };
}

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------

interface ExtractedFields {
  [key: string]: { value: unknown; confidence: number; source: string };
}

interface ExtractionResult {
  summary: string;
  deal_fields: ExtractedFields;
}

async function extractWithClaude(
  subject: string,
  body: string
): Promise<ExtractionResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set; skipping extraction.");
    return { summary: `[EXTRACTION SKIPPED - API key not configured] ${subject}`, deal_fields: {} };
  }

  const prompt = `You are a mortgage origination assistant. Extract deal information from this incoming email.

Subject: ${subject}

Body:
${body.slice(0, 4000)}

Return a JSON object with two keys:
1. "summary" - one sentence describing the deal request
2. "deal_fields" - an object where each key is a field name and value is {value, confidence (0-1), source: "email_body"}

Extract these fields when present (use null if not found):
- borrower_name (string)
- borrower_email (string)
- borrower_phone (string)
- company_name (string)
- property_address (string)
- property_type (sfr|multifamily|commercial|industrial|land|mixed_use)
- loan_amount (number, dollars)
- loan_type (DSCR|RTL|Bridge|GroundUp|CommDebt|Other)
- ltv (number, 0-100)
- arv (number, dollars)
- rehab_budget (number, dollars)
- dscr (number)
- closing_date (ISO date string)
- notes (string, anything else relevant)

Return only valid JSON. No markdown, no explanation.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic API error:", await res.text());
      return { summary: subject, deal_fields: {} };
    }

    const data = await res.json();
    const text =
      data.content?.[0]?.type === "text" ? data.content[0].text : "";

    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || subject,
      deal_fields: parsed.deal_fields || {},
    };
  } catch (err) {
    console.error("Claude extraction error:", err);
    return { summary: subject, deal_fields: {} };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify bearer token: accept either CRON_SECRET or the service_role key.
  // pg_cron sends the service_role key from Vault; manual calls can use either.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const cronSecret = Deno.env.get("CRON_SECRET");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const isAuthorized =
    (cronSecret && token === cronSecret) ||
    (serviceRoleKey && token === serviceRoleKey);

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results = {
    checked: 0,
    inserted: 0,
    skipped_duplicate: 0,
    errors: [] as string[],
  };

  try {
    // ------------------------------------------------------------------
    // Determine the lookback window.
    // Use the most recent email in email_intake_queue as the floor,
    // otherwise look back 24 hours to catch anything missed.
    // ------------------------------------------------------------------
    const { data: latest } = await admin
      .from("email_intake_queue")
      .select("received_at")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let afterEpochSecs: number;
    if (latest?.received_at) {
      // Subtract 60 seconds to account for clock skew
      afterEpochSecs =
        Math.floor(new Date(latest.received_at).getTime() / 1000) - 60;
    } else {
      // First run: look back 24 hours
      afterEpochSecs = Math.floor(Date.now() / 1000) - 86400;
    }

    // ------------------------------------------------------------------
    // Authenticate with Gmail
    // ------------------------------------------------------------------
    const accessToken = await getAccessToken();

    // ------------------------------------------------------------------
    // Fetch message stubs
    // ------------------------------------------------------------------
    const stubs = await listMessages(accessToken, afterEpochSecs);
    results.checked = stubs.length;

    if (stubs.length === 0) {
      return new Response(JSON.stringify({ ...results, message: "No new messages." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------------
    // Process each message
    // ------------------------------------------------------------------
    for (const stub of stubs) {
      try {
        // Dedup check
        const { data: existing } = await admin
          .from("email_intake_queue")
          .select("id")
          .eq("gmail_message_id", stub.id)
          .maybeSingle();

        if (existing) {
          results.skipped_duplicate++;
          continue;
        }

        // Fetch full message
        const msg = await getMessage(accessToken, stub.id);
        const headers = msg.payload.headers;

        const fromRaw = getHeader(headers, "From");
        const subject = getHeader(headers, "Subject") || "(no subject)";
        const { email: fromEmail, name: fromName } = parseFromHeader(fromRaw);
        const receivedAt = new Date(parseInt(msg.internalDate)).toISOString();

        // Extract body text (first 2000 chars for preview)
        const bodyText = extractTextBody(msg.payload);
        const bodyPreview = bodyText.slice(0, 2000);

        // Collect attachment metadata (no download; admin can pull later)
        const attachments = collectAttachments(msg.payload).map((a) => ({
          ...a,
          extraction_status: "pending" as const,
        }));

        // Match sender email to an existing CRM contact
        const { data: contactMatch } = await admin
          .from("crm_contacts")
          .select("id")
          .eq("email", fromEmail)
          .is("deleted_at", null)
          .maybeSingle();

        // Run Claude extraction on email body
        const extraction = await extractWithClaude(subject, bodyText);

        // Insert into email_intake_queue
        const { data: queued, error: insertErr } = await admin
          .from("email_intake_queue")
          .insert({
            gmail_message_id: stub.id,
            from_email: fromEmail,
            from_name: fromName,
            subject,
            body_preview: bodyPreview,
            received_at: receivedAt,
            status: "ready",
            attachments: attachments.length > 0 ? attachments : null,
            extraction_summary: extraction.summary,
            extracted_deal_fields: extraction.deal_fields,
            matched_contact_id: contactMatch?.id ?? null,
          })
          .select("id")
          .single();

        if (insertErr) {
          // Could be a race-condition duplicate; treat as skip
          if (insertErr.code === "23505") {
            results.skipped_duplicate++;
          } else {
            results.errors.push(`Insert failed for ${stub.id}: ${insertErr.message}`);
          }
          continue;
        }

        results.inserted++;

        // Invoke process-intake-email to build intake_items + CRM matching
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const fnUrl = `${supabaseUrl}/functions/v1/process-intake-email`;

        try {
          const processRes = await fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ email_intake_queue_id: queued.id }),
          });

          if (!processRes.ok) {
            const errText = await processRes.text().catch(() => "");
            console.error(`process-intake-email failed for ${queued.id}: ${processRes.status} ${errText}`);
            await admin
              .from("email_intake_queue")
              .update({ error_message: `process-intake-email returned ${processRes.status}: ${errText.slice(0, 500)}` })
              .eq("id", queued.id);
          }
        } catch (invokeErr) {
          const errDetail = invokeErr instanceof Error ? invokeErr.message : String(invokeErr);
          console.error(`process-intake-email invoke error for ${queued.id}:`, invokeErr);
          await admin
            .from("email_intake_queue")
            .update({ error_message: `invoke failed: ${errDetail}` })
            .eq("id", queued.id);
        }
      } catch (msgErr) {
        const errMsg = msgErr instanceof Error ? msgErr.message : String(msgErr);
        console.error(`Error processing message ${stub.id}:`, errMsg);
        results.errors.push(`${stub.id}: ${errMsg}`);
      }
    }

    // ------------------------------------------------------------------
    // Retry sweep: find "ready" queue items that have no intake_items
    // record yet (missed processing). Cap at 3 attempts per item, 10
    // items per sweep to stay within edge function timeout.
    // ------------------------------------------------------------------
    const retryResults = { retried: 0, retry_errors: 0 };
    try {
      const { data: stuckItems } = await admin
        .from("email_intake_queue")
        .select("id, processing_attempts")
        .eq("status", "ready")
        .lt("processing_attempts", 3)
        .order("created_at", { ascending: true })
        .limit(10);

      if (stuckItems && stuckItems.length > 0) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const fnUrl = `${supabaseUrl}/functions/v1/process-intake-email`;

        for (const item of stuckItems) {
          // Check if intake_items already exists (may have been created by another path)
          const { data: hasIntake } = await admin
            .from("intake_items")
            .select("id")
            .eq("email_intake_queue_id", item.id)
            .maybeSingle();

          if (hasIntake) continue;

          try {
            const retryRes = await fetch(fnUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({ email_intake_queue_id: item.id }),
            });

            if (retryRes.ok) {
              retryResults.retried++;
            } else {
              retryResults.retry_errors++;
              const errText = await retryRes.text().catch(() => "");
              await admin
                .from("email_intake_queue")
                .update({
                  error_message: `retry failed (${retryRes.status}): ${errText.slice(0, 500)}`,
                  processing_attempts: (item.processing_attempts || 0) + 1,
                })
                .eq("id", item.id);
            }
          } catch (retryErr) {
            retryResults.retry_errors++;
            await admin
              .from("email_intake_queue")
              .update({
                error_message: `retry invoke failed: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
                processing_attempts: (item.processing_attempts || 0) + 1,
              })
              .eq("id", item.id);
          }
        }
      }
    } catch (sweepErr) {
      console.error("Retry sweep error:", sweepErr);
    }

    return new Response(JSON.stringify({ ...results, ...retryResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("fetch-intake-emails fatal error:", errMsg);
    return new Response(
      JSON.stringify({ error: errMsg, ...results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
