// Supabase Edge Function: fetch-intake-emails
//
// Polls the intake@requitygroup.com Gmail account, runs Claude extraction on each
// new email, downloads attachments to Supabase Storage, inserts into
// email_intake_queue, then invokes process-intake-email to build the structured
// intake_items record with CRM matching.
//
// Gmail quirk: when the account owner sends to their own alias, Gmail skips the
// Inbox label and files the message under Sent/All Mail. The query therefore
// searches all mail (excluding trash/spam) instead of restricting to in:inbox.
//
// Forwarded email handling: when an internal team member forwards a broker email
// to intake@, the function detects the forward, parses the original sender from
// the forwarded headers, and passes both forwarder + original sender context to
// Claude so extraction focuses on the deal content, not the forwarder's info.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_DOMAIN = "requitygroup.com";
const STORAGE_BUCKET = "portal-documents";
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

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
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Gmail credentials: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN must be set."
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
  const q = `to:intake@requitygroup.com -in:trash -in:spam after:${afterEpochSecs}`;
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

async function downloadAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Uint8Array> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail attachment download failed: ${err}`);
  }

  const data = await res.json();
  const base64 = (data.data as string).replace(/-/g, "+").replace(/_/g, "/");
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
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
  attachment_id?: string;
  storage_path?: string;
  extraction_status: string;
}

function collectAttachments(part: GmailMessagePart): AttachmentMeta[] {
  const result: AttachmentMeta[] = [];

  function walk(p: GmailMessagePart) {
    if (p.filename && p.filename.length > 0 && p.body.size > 0) {
      result.push({
        filename: p.filename,
        mime_type: p.mimeType,
        size_bytes: p.body.size,
        attachment_id: p.body.attachmentId,
        extraction_status: "pending",
      });
    }
    if (p.parts) p.parts.forEach(walk);
  }

  walk(part);
  return result;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

async function uploadAttachmentToStorage(
  admin: ReturnType<typeof createClient>,
  queueId: string,
  filename: string,
  mimeType: string,
  data: Uint8Array
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `intake/${queueId}/${safeName}`;

  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, data, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed for ${safeName}: ${error.message}`);
  return storagePath;
}

// ---------------------------------------------------------------------------
// Internal user lookup
// ---------------------------------------------------------------------------

async function lookupInternalUserId(
  admin: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const domain = email.split("@")[1];
  if (domain !== INTERNAL_DOMAIN) return null;

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error || !data?.users) return null;

  const match = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  return match?.id ?? null;
}

// ---------------------------------------------------------------------------
// Name / header parsing
// ---------------------------------------------------------------------------

function parseFromHeader(raw: string): { email: string; name: string | null } {
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
// Forwarded email detection
// ---------------------------------------------------------------------------

interface ForwardedEmailInfo {
  is_forwarded: boolean;
  original_from_name: string | null;
  original_from_email: string | null;
  original_subject: string | null;
  original_date: string | null;
}

function detectForwardedEmail(subject: string, body: string): ForwardedEmailInfo {
  const result: ForwardedEmailInfo = {
    is_forwarded: false,
    original_from_name: null,
    original_from_email: null,
    original_subject: null,
    original_date: null,
  };

  const isFwd = /^(fwd?|fw):/i.test(subject.trim());

  // Gmail-style: "---------- Forwarded message ---------\nFrom: Name <email>"
  const gmailFwd = body.match(
    /-{5,}\s*Forwarded message\s*-{5,}\s*\n\s*From:\s*(.+)/i
  );
  // Outlook-style: "-----Original Message-----\nFrom: Name [email]"
  const outlookFwd = body.match(
    /-{5,}\s*Original Message\s*-{5,}\s*\n\s*From:\s*(.+)/i
  );
  // Apple-style: "Begin forwarded message:\n> From: Name <email>"
  const appleFwd = body.match(
    /Begin forwarded message:\s*\n>?\s*From:\s*(.+)/i
  );

  const fromLine = gmailFwd?.[1] || outlookFwd?.[1] || appleFwd?.[1];

  if (isFwd || fromLine) {
    result.is_forwarded = true;
  }

  if (fromLine) {
    const parsed = parseFromHeader(fromLine.trim());
    result.original_from_email = parsed.email;
    result.original_from_name = parsed.name;
  }

  // Try to extract original subject from forwarded headers
  const subjMatch = body.match(/Subject:\s*(.+?)(?:\n|$)/i);
  if (subjMatch && result.is_forwarded) {
    result.original_subject = subjMatch[1].trim();
  }

  // Try to extract original date
  const dateMatch = body.match(/Date:\s*(.+?)(?:\n|$)/i);
  if (dateMatch && result.is_forwarded) {
    result.original_date = dateMatch[1].trim();
  }

  return result;
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
  body: string,
  fromEmail: string,
  fromName: string | null,
  forwardInfo: ForwardedEmailInfo,
  attachmentNames: string[]
): Promise<ExtractionResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not set; skipping extraction.");
    return { summary: `[NO API KEY] ${subject}`, deal_fields: {} };
  }

  const forwardContext = forwardInfo.is_forwarded
    ? `
IMPORTANT - THIS IS A FORWARDED EMAIL:
- The email was FORWARDED by: ${fromName || "unknown"} <${fromEmail}> (an internal Requity Group team member, NOT the broker or borrower)
- The ORIGINAL sender (likely the broker) is: ${forwardInfo.original_from_name || "unknown"} <${forwardInfo.original_from_email || "unknown"}>
- Focus on extracting deal info from the FORWARDED CONTENT, not the forwarder's signature
- The broker is the original sender. The borrower is whoever is mentioned IN the email body as the buyer/borrower.
- Ignore any signature block from the forwarder at the bottom of the email.
`
    : `
Email sender: ${fromName || "unknown"} <${fromEmail}>
The sender may be the broker submitting this deal, or the borrower directly. Determine from context.
`;

  const attachmentContext = attachmentNames.length > 0
    ? `\nAttached files: ${attachmentNames.join(", ")}\nUse attachment names as clues (e.g. "Rent Roll" suggests rental property, "PFS" suggests personal financial statement).`
    : "";

  const prompt = `You are an AI intake assistant for Requity Group, a commercial and residential mortgage lender. Your job is to extract EVERY piece of deal information from the email below.

${forwardContext}
${attachmentContext}

---
Subject: ${subject}

${body.slice(0, 8000)}
---

Return a JSON object with exactly two keys:

1. "summary" - 1-2 sentences describing this deal opportunity. Include property type, unit count, approximate loan amount, and location if available.

2. "deal_fields" - an object where EVERY key maps to {"value": <extracted_value>, "confidence": <0.0-1.0>, "source": "email_body"}

Extract ALL of the following fields. For any field not found in the email, still include the key but set value to null:

CONTACT/BROKER INFO:
- broker_name (the person submitting the deal, usually the original email sender)
- broker_email
- broker_phone
- broker_company (their company/firm name)
- broker_license (any license numbers mentioned, e.g. NMLS, DRE)

BORROWER INFO:
- borrower_name (the actual buyer/borrower mentioned in the email body)
- borrower_email
- borrower_phone
- borrower_entity_name (LLC or company name the borrower operates under)

PROPERTY INFO:
- property_address (full address if provided)
- property_city
- property_state
- property_type (one of: SFR, Multifamily, Commercial, Industrial, Land, Mixed Use, Portfolio)
- property_count (number of separate properties if a portfolio)
- units (total residential unit count)
- sqft (square footage if mentioned)
- year_built

DEAL/LOAN INFO:
- purchase_price (in dollars)
- loan_amount (in dollars, the amount they want to borrow)
- loan_type (one of: DSCR, RTL, Bridge, GroundUp, CommDebt, Portfolio, Other)
- ltv (loan-to-value ratio, 0-100)
- arv (after-repair value in dollars)
- rehab_budget (renovation budget in dollars)
- closing_date (target close date, ISO format if possible)

FINANCIAL METRICS:
- noi (net operating income, annual, in dollars)
- dscr (debt service coverage ratio, a number like 1.25)
- cash_flow (annual or monthly cash flow in dollars)
- coc_return (cash-on-cash return, as a percentage like 10)
- debt_service (annual debt service in dollars)
- cap_rate (capitalization rate, as percentage)

OTHER:
- seller_financing (any seller carry/hold-back details as a string)
- existing_debt (any existing liens or debt info)
- notes (any other relevant deal details, context, or special circumstances not captured above)

CRITICAL RULES:
- Parse dollar amounts as raw numbers without $ signs or commas (e.g. 14400000 not "$14.4M")
- For abbreviated amounts like "$14.4 mil" or "$3.5M", convert to full number (14400000, 3500000)
- For percentage values (LTV, COC), use the number only (e.g. 67 not "67%")
- If the email mentions a previous deal or property by name, include it in notes
- Extract the broker's signature block for their contact info (phone, company, license)

Return ONLY valid JSON. No markdown fences, no explanation, no text outside the JSON object.`;

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
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", res.status, errText);
      return { summary: `[EXTRACTION FAILED: ${res.status}] ${subject}`, deal_fields: {} };
    }

    const data = await res.json();
    const text =
      data.content?.[0]?.type === "text" ? data.content[0].text : "";

    if (!text) {
      console.error("Anthropic returned empty text content:", JSON.stringify(data));
      return { summary: `[EMPTY RESPONSE] ${subject}`, deal_fields: {} };
    }

    // Strip markdown fences if Claude included them despite instructions
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const fields = parsed.deal_fields || {};

    // Count how many non-null fields we extracted
    const nonNullCount = Object.values(fields).filter(
      (f: unknown) => (f as { value: unknown }).value != null
    ).length;
    console.log(`Claude extracted ${nonNullCount} non-null fields from: ${subject}`);

    return {
      summary: parsed.summary || subject,
      deal_fields: fields,
    };
  } catch (err) {
    console.error("Claude extraction error:", err);
    return { summary: `[PARSE ERROR] ${subject}`, deal_fields: {} };
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    attachments_uploaded: 0,
    errors: [] as string[],
  };

  try {
    const { data: latest } = await admin
      .from("email_intake_queue")
      .select("received_at")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let afterEpochSecs: number;
    if (latest?.received_at) {
      afterEpochSecs =
        Math.floor(new Date(latest.received_at).getTime() / 1000) - 60;
    } else {
      afterEpochSecs = Math.floor(Date.now() / 1000) - 86400;
    }

    const accessToken = await getAccessToken();
    const stubs = await listMessages(accessToken, afterEpochSecs);
    results.checked = stubs.length;

    if (stubs.length === 0) {
      return new Response(JSON.stringify({ ...results, message: "No new messages." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const stub of stubs) {
      try {
        const { data: existing } = await admin
          .from("email_intake_queue")
          .select("id")
          .eq("gmail_message_id", stub.id)
          .maybeSingle();

        if (existing) {
          results.skipped_duplicate++;
          continue;
        }

        const msg = await getMessage(accessToken, stub.id);
        const headers = msg.payload.headers;

        const fromRaw = getHeader(headers, "From");
        const subject = getHeader(headers, "Subject") || "(no subject)";
        const { email: fromEmail, name: fromName } = parseFromHeader(fromRaw);
        const receivedAt = new Date(parseInt(msg.internalDate)).toISOString();

        const bodyText = extractTextBody(msg.payload);
        const bodyPreview = bodyText.slice(0, 5000);

        const rawAttachments = collectAttachments(msg.payload);
        const attachmentNames = rawAttachments.map((a) => a.filename);

        // Detect if this is a forwarded email and parse original sender
        const forwardInfo = detectForwardedEmail(subject, bodyText);

        // For CRM matching, prefer the original sender (broker) over the forwarder
        const contactEmail = forwardInfo.is_forwarded && forwardInfo.original_from_email
          ? forwardInfo.original_from_email
          : fromEmail;

        const { data: contactMatch } = await admin
          .from("crm_contacts")
          .select("id")
          .eq("email", contactEmail)
          .is("deleted_at", null)
          .maybeSingle();

        const internalSenderId = await lookupInternalUserId(admin, fromEmail);

        // Run Claude extraction with full forwarding context
        const extraction = await extractWithClaude(
          subject, bodyText, fromEmail, fromName, forwardInfo, attachmentNames
        );

        // Inject metadata into extracted fields for downstream processing
        if (internalSenderId) {
          extraction.deal_fields["_internal_sender_user_id"] = {
            value: internalSenderId,
            confidence: 1,
            source: "auth_lookup",
          };
        }

        if (forwardInfo.is_forwarded) {
          extraction.deal_fields["_is_forwarded"] = {
            value: true,
            confidence: 1,
            source: "header_detection",
          };
          if (forwardInfo.original_from_email) {
            extraction.deal_fields["_original_sender_email"] = {
              value: forwardInfo.original_from_email,
              confidence: 0.95,
              source: "forwarded_header",
            };
          }
          if (forwardInfo.original_from_name) {
            extraction.deal_fields["_original_sender_name"] = {
              value: forwardInfo.original_from_name,
              confidence: 0.95,
              source: "forwarded_header",
            };
          }
        }

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
            attachments: [],
            extraction_summary: extraction.summary,
            extracted_deal_fields: extraction.deal_fields,
            matched_contact_id: contactMatch?.id ?? null,
          })
          .select("id")
          .single();

        if (insertErr) {
          if (insertErr.code === "23505") {
            results.skipped_duplicate++;
          } else {
            results.errors.push(`Insert failed for ${stub.id}: ${insertErr.message}`);
          }
          continue;
        }

        results.inserted++;

        const processedAttachments: AttachmentMeta[] = [];
        for (const att of rawAttachments) {
          if (!att.attachment_id) {
            processedAttachments.push({ ...att, extraction_status: "no_attachment_id" });
            continue;
          }
          if (att.size_bytes > MAX_ATTACHMENT_BYTES) {
            processedAttachments.push({ ...att, extraction_status: "skipped_too_large" });
            continue;
          }

          try {
            const fileData = await downloadAttachment(accessToken, stub.id, att.attachment_id);
            const storagePath = await uploadAttachmentToStorage(
              admin, queued.id, att.filename, att.mime_type, fileData
            );
            processedAttachments.push({
              ...att,
              storage_path: storagePath,
              extraction_status: "uploaded",
            });
            results.attachments_uploaded++;
          } catch (attErr) {
            const errMsg = attErr instanceof Error ? attErr.message : String(attErr);
            console.error(`Attachment upload failed for ${att.filename}:`, errMsg);
            processedAttachments.push({ ...att, extraction_status: `upload_failed: ${errMsg.slice(0, 200)}` });
          }
        }

        if (processedAttachments.length > 0) {
          await admin
            .from("email_intake_queue")
            .update({ attachments: processedAttachments })
            .eq("id", queued.id);
        }

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

    // Retry sweep for stuck queue items
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
