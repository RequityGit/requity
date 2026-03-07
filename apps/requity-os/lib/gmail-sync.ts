/**
 * Gmail Inbound Email Sync Engine
 *
 * Syncs emails from connected team members' Gmail inboxes into the portal.
 * Only syncs emails where at least one participant matches a known contact,
 * borrower, investor, or team member in our system.
 *
 * Uses Gmail API history.list for incremental sync after initial load.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGmailToken } from "@/lib/gmail";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  headers?: GmailMessageHeader[];
  body?: { size: number; data?: string };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: {
    mimeType: string;
    headers?: GmailMessageHeader[];
    body?: { size: number; data?: string };
    parts?: GmailMessagePart[];
  };
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailHistoryResponse {
  history?: Array<{
    id: string;
    messagesAdded?: Array<{ message: { id: string; threadId: string; labelIds?: string[] } }>;
  }>;
  historyId?: string;
  nextPageToken?: string;
}

interface ParsedEmail {
  from: string;
  fromName: string | null;
  to: Array<{ email: string; name: string | null }>;
  cc: Array<{ email: string; name: string | null }>;
  bcc: Array<{ email: string; name: string | null }>;
  replyTo: string | null;
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  date: string;
  gmailMessageId: string;
  gmailThreadId: string;
  labels: string[];
  isRead: boolean;
}

interface EntityMatch {
  source_type: string;
  source_id: string;
  contact_id: string | null;
  borrower_id: string | null;
  investor_id: string | null;
  profile_id: string | null;
  linked_loan_id: string | null;
}

interface SyncResult {
  userId: string;
  email: string;
  messagesProcessed: number;
  messagesSkipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Gmail API helpers
// ---------------------------------------------------------------------------

async function gmailGet<T>(
  accessToken: string,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${GMAIL_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API ${path} failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Fetch a single Gmail message with full payload.
 */
async function fetchGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  return gmailGet<GmailMessage>(accessToken, `/messages/${messageId}`, {
    format: "full",
  });
}

/**
 * List messages matching a query. Returns up to maxResults message stubs.
 */
async function listGmailMessages(
  accessToken: string,
  query: string,
  maxResults: number = 100,
  pageToken?: string
): Promise<GmailListResponse> {
  const params: Record<string, string> = {
    q: query,
    maxResults: String(maxResults),
  };
  if (pageToken) params.pageToken = pageToken;
  return gmailGet<GmailListResponse>(accessToken, "/messages", params);
}

/**
 * Get history of changes since a given historyId.
 */
async function getGmailHistory(
  accessToken: string,
  startHistoryId: string,
  pageToken?: string
): Promise<GmailHistoryResponse> {
  const params: Record<string, string> = {
    startHistoryId,
    historyTypes: "messageAdded",
    maxResults: "500",
  };
  if (pageToken) params.pageToken = pageToken;
  return gmailGet<GmailHistoryResponse>(accessToken, "/history", params);
}

// ---------------------------------------------------------------------------
// Email parsing
// ---------------------------------------------------------------------------

/**
 * Parse a "Name <email@example.com>" string into name + email parts.
 */
function parseEmailAddress(raw: string): { email: string; name: string | null } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].replace(/^["']|["']$/g, "").trim(), email: match[2].toLowerCase() };
  }
  return { email: raw.trim().toLowerCase(), name: null };
}

/**
 * Parse a comma-separated list of email addresses.
 */
function parseEmailList(raw: string | null | undefined): Array<{ email: string; name: string | null }> {
  if (!raw) return [];
  // Split on commas that are outside of quotes
  return raw
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseEmailAddress);
}

/**
 * Get a header value from a Gmail message.
 */
function getHeader(headers: GmailMessageHeader[] | undefined, name: string): string | null {
  if (!headers) return null;
  const h = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return h?.value || null;
}

/**
 * Decode base64url-encoded Gmail body data.
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Recursively extract body parts from a MIME message.
 */
function extractBody(
  payload: GmailMessage["payload"]
): { html: string | null; text: string | null } {
  let html: string | null = null;
  let text: string | null = null;

  if (!payload) return { html, text };

  function walk(part: GmailMessagePart) {
    if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64Url(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      text = decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  // If the top-level body has data directly
  if (payload.body?.data) {
    if (payload.mimeType === "text/html") {
      html = decodeBase64Url(payload.body.data);
    } else if (payload.mimeType === "text/plain") {
      text = decodeBase64Url(payload.body.data);
    }
  }

  // Walk nested parts
  if (payload.parts) {
    payload.parts.forEach(walk);
  }

  return { html, text };
}

/**
 * Parse a full Gmail API message into our structured format.
 */
function parseGmailMessage(msg: GmailMessage): ParsedEmail {
  const headers = msg.payload?.headers;
  const fromRaw = getHeader(headers, "From") || "";
  const parsed = parseEmailAddress(fromRaw);
  const { html, text } = extractBody(msg.payload);
  const labels = msg.labelIds || [];

  return {
    from: parsed.email,
    fromName: parsed.name,
    to: parseEmailList(getHeader(headers, "To")),
    cc: parseEmailList(getHeader(headers, "Cc")),
    bcc: parseEmailList(getHeader(headers, "Bcc")),
    replyTo: getHeader(headers, "Reply-To"),
    subject: getHeader(headers, "Subject"),
    bodyHtml: html,
    bodyText: text,
    date: msg.internalDate
      ? new Date(parseInt(msg.internalDate)).toISOString()
      : new Date().toISOString(),
    gmailMessageId: msg.id,
    gmailThreadId: msg.threadId,
    labels,
    isRead: !labels.includes("UNREAD"),
  };
}

// ---------------------------------------------------------------------------
// Contact matching
// ---------------------------------------------------------------------------

/**
 * Match an email address against all known entities in the system.
 * Uses the match_email_to_entities() database function.
 */
async function matchEmailAddress(
  admin: ReturnType<typeof createAdminClient>,
  emailAddress: string
): Promise<EntityMatch[]> {
  const { data, error } = await admin.rpc("match_email_to_entities", {
    lookup_email: emailAddress,
  });

  if (error) {
    console.error(`match_email_to_entities failed for ${emailAddress}:`, error);
    return [];
  }

  return (data || []) as EntityMatch[];
}

/**
 * Build a lookup cache for all email addresses in a batch of messages.
 * This reduces the number of DB calls by batching lookups.
 */
async function buildMatchCache(
  admin: ReturnType<typeof createAdminClient>,
  emails: string[]
): Promise<Map<string, EntityMatch[]>> {
  const cache = new Map<string, EntityMatch[]>();
  const unique = Array.from(new Set(emails.map((e) => e.toLowerCase())));

  // Process in parallel batches of 10
  const batchSize = 10;
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (email) => {
        const matches = await matchEmailAddress(admin, email);
        return { email, matches };
      })
    );
    for (const { email, matches } of results) {
      cache.set(email, matches);
    }
  }

  return cache;
}

// ---------------------------------------------------------------------------
// Sync logic
// ---------------------------------------------------------------------------

/**
 * Determine the direction of an email relative to a team member's mailbox.
 */
function determineDirection(
  parsed: ParsedEmail,
  teamMemberEmail: string
): "inbound" | "outbound" {
  // If the team member sent it, it's outbound
  if (parsed.from.toLowerCase() === teamMemberEmail.toLowerCase()) {
    return "outbound";
  }
  return "inbound";
}

/**
 * Check if a gmail_message_id already exists in crm_emails.
 */
async function emailExists(
  admin: ReturnType<typeof createAdminClient>,
  gmailMessageId: string
): Promise<boolean> {
  const { data } = await admin
    .from("crm_emails")
    .select("id")
    .eq("gmail_message_id", gmailMessageId)
    .maybeSingle();

  return !!data;
}

/**
 * Process and store a single email message.
 * Returns true if the email was stored, false if skipped.
 */
async function processMessage(
  admin: ReturnType<typeof createAdminClient>,
  parsed: ParsedEmail,
  syncUserId: string,
  syncUserEmail: string,
  matchCache: Map<string, EntityMatch[]>
): Promise<boolean> {
  // Skip if already synced (dedup)
  const exists = await emailExists(admin, parsed.gmailMessageId);
  if (exists) return false;

  // Collect all participant email addresses
  const allParticipants = [
    { email: parsed.from, name: parsed.fromName, role: "from" as const },
    ...parsed.to.map((t) => ({ ...t, role: "to" as const })),
    ...parsed.cc.map((c) => ({ ...c, role: "cc" as const })),
    ...parsed.bcc.map((b) => ({ ...b, role: "bcc" as const })),
  ];

  // Check matches — at least one non-team-member participant must match
  let hasExternalMatch = false;
  const participantMatches: Array<{
    email: string;
    name: string | null;
    role: string;
    matches: EntityMatch[];
  }> = [];

  for (const p of allParticipants) {
    const matches = matchCache.get(p.email.toLowerCase()) || [];
    participantMatches.push({ ...p, matches });

    // Check if any match is NOT just a profile match (i.e., it's an external contact)
    const hasContactMatch = matches.some(
      (m) => m.source_type === "contact" || m.source_type === "borrower" || m.source_type === "investor"
    );
    if (hasContactMatch) {
      hasExternalMatch = true;
    }
  }

  // Skip if no external contacts matched
  if (!hasExternalMatch) return false;

  // Determine direction
  const direction = determineDirection(parsed, syncUserEmail);

  // Aggregate entity links from all participant matches
  let linkedContactId: string | null = null;
  let linkedBorrowerId: string | null = null;
  let linkedInvestorId: string | null = null;
  let linkedLoanId: string | null = null;

  for (const pm of participantMatches) {
    for (const match of pm.matches) {
      if (match.contact_id && !linkedContactId) linkedContactId = match.contact_id;
      if (match.borrower_id && !linkedBorrowerId) linkedBorrowerId = match.borrower_id;
      if (match.investor_id && !linkedInvestorId) linkedInvestorId = match.investor_id;
      if (match.linked_loan_id && !linkedLoanId) linkedLoanId = match.linked_loan_id;
    }
  }

  // Insert the email record
  const { data: emailRow, error: emailError } = await admin
    .from("crm_emails")
    .insert({
      gmail_message_id: parsed.gmailMessageId,
      gmail_thread_id: parsed.gmailThreadId,
      direction,
      from_email: parsed.from,
      from_name: parsed.fromName,
      to_email: parsed.to[0]?.email || null,
      to_name: parsed.to[0]?.name || null,
      to_emails: parsed.to.map((t) => t.email),
      to_names: parsed.to.map((t) => t.name || ""),
      cc_emails: parsed.cc.length > 0 ? parsed.cc.map((c) => c.email) : null,
      bcc_emails: parsed.bcc.length > 0 ? parsed.bcc.map((b) => b.email) : null,
      reply_to: parsed.replyTo,
      subject: parsed.subject || "(no subject)",
      body_html: parsed.bodyHtml,
      body_text: parsed.bodyText,
      created_at: parsed.date,
      synced_at: new Date().toISOString(),
      synced_by: syncUserId,
      is_read: parsed.isRead,
      gmail_labels: parsed.labels,
      linked_contact_id: linkedContactId,
      linked_borrower_id: linkedBorrowerId,
      linked_investor_id: linkedInvestorId,
      linked_loan_id: linkedLoanId,
      match_status: "auto",
      postmark_status: direction === "outbound" ? "sent" : null,
    })
    .select("id")
    .single();

  if (emailError) {
    // If it's a unique constraint violation, it was a race condition — skip
    if (emailError.code === "23505") return false;
    console.error("Failed to insert email:", emailError);
    return false;
  }

  if (!emailRow) return false;

  // Insert participants
  const participantInserts = participantMatches.map((pm) => {
    // Pick the best entity match for this participant
    const bestMatch = pm.matches[0];
    return {
      email_id: emailRow.id,
      email_address: pm.email,
      display_name: pm.name,
      participant_role: pm.role,
      contact_id: bestMatch?.contact_id || null,
      borrower_id: bestMatch?.borrower_id || null,
      investor_id: bestMatch?.investor_id || null,
      profile_id: bestMatch?.profile_id || null,
    };
  });

  const { error: participantError } = await admin
    .from("email_participants")
    .insert(participantInserts);

  if (participantError) {
    console.error("Failed to insert email participants:", participantError);
  }

  return true;
}

// ---------------------------------------------------------------------------
// Main sync functions
// ---------------------------------------------------------------------------

/**
 * Perform initial sync for a user — fetch recent messages from Gmail.
 * Only fetches messages from the last 7 days to avoid overwhelming the system.
 */
async function initialSync(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  accessToken: string,
  gmailEmail: string
): Promise<{ messagesProcessed: number; messagesSkipped: number; historyId: string | null; errors: string[] }> {
  const errors: string[] = [];
  let messagesProcessed = 0;
  let messagesSkipped = 0;
  let latestHistoryId: string | null = null;

  try {
    // Fetch recent messages (last 7 days, max 200)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const afterDate = `${sevenDaysAgo.getFullYear()}/${String(sevenDaysAgo.getMonth() + 1).padStart(2, "0")}/${String(sevenDaysAgo.getDate()).padStart(2, "0")}`;
    const query = `after:${afterDate}`;

    let pageToken: string | undefined;
    const allMessageIds: Array<{ id: string; threadId: string }> = [];

    // Paginate through message list (max 200 messages for initial sync)
    do {
      const listRes = await listGmailMessages(accessToken, query, 100, pageToken);
      if (listRes.messages) {
        allMessageIds.push(...listRes.messages);
      }
      pageToken = listRes.nextPageToken;
    } while (pageToken && allMessageIds.length < 200);

    // Truncate to 200
    const messageStubs = allMessageIds.slice(0, 200);

    if (messageStubs.length === 0) {
      return { messagesProcessed: 0, messagesSkipped: 0, historyId: null, errors: [] };
    }

    // Fetch full messages in batches of 10
    const batchSize = 10;
    for (let i = 0; i < messageStubs.length; i += batchSize) {
      const batch = messageStubs.slice(i, i + batchSize);
      const fullMessages = await Promise.all(
        batch.map(async (stub) => {
          try {
            return await fetchGmailMessage(accessToken, stub.id);
          } catch (err) {
            errors.push(`Failed to fetch message ${stub.id}: ${err}`);
            return null;
          }
        })
      );

      // Parse all messages in this batch
      const parsedMessages = fullMessages
        .filter((m): m is GmailMessage => m !== null)
        .map(parseGmailMessage);

      // Collect all email addresses for batch matching
      const allEmails: string[] = [];
      for (const parsed of parsedMessages) {
        allEmails.push(parsed.from);
        parsed.to.forEach((t) => allEmails.push(t.email));
        parsed.cc.forEach((c) => allEmails.push(c.email));
        parsed.bcc.forEach((b) => allEmails.push(b.email));
      }

      const matchCache = await buildMatchCache(admin, allEmails);

      // Process each message
      for (const parsed of parsedMessages) {
        try {
          const stored = await processMessage(admin, parsed, userId, gmailEmail, matchCache);
          if (stored) {
            messagesProcessed++;
          } else {
            messagesSkipped++;
          }
        } catch (err) {
          errors.push(`Failed to process message ${parsed.gmailMessageId}: ${err}`);
          messagesSkipped++;
        }
      }

      // Track the latest historyId
      for (const msg of fullMessages) {
        if (msg?.historyId) {
          const hid = msg.historyId;
          if (!latestHistoryId || hid > latestHistoryId) {
            latestHistoryId = hid;
          }
        }
      }
    }
  } catch (err) {
    errors.push(`Initial sync error: ${err}`);
  }

  return { messagesProcessed, messagesSkipped, historyId: latestHistoryId, errors };
}

/**
 * Perform incremental sync using Gmail history API.
 */
async function incrementalSync(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  accessToken: string,
  gmailEmail: string,
  startHistoryId: string
): Promise<{ messagesProcessed: number; messagesSkipped: number; historyId: string | null; errors: string[] }> {
  const errors: string[] = [];
  let messagesProcessed = 0;
  let messagesSkipped = 0;
  let latestHistoryId: string | null = null;

  try {
    // Get history since the last sync
    let pageToken: string | undefined;
    const newMessageIds: string[] = [];

    do {
      const historyRes = await getGmailHistory(accessToken, startHistoryId, pageToken);

      if (historyRes.history) {
        for (const entry of historyRes.history) {
          if (entry.messagesAdded) {
            for (const added of entry.messagesAdded) {
              // Only sync INBOX messages (skip drafts, spam, trash)
              const labels = added.message.labelIds || [];
              if (labels.includes("INBOX") || labels.includes("SENT")) {
                newMessageIds.push(added.message.id);
              }
            }
          }
        }
      }

      latestHistoryId = historyRes.historyId || null;
      pageToken = historyRes.nextPageToken;
    } while (pageToken);

    if (newMessageIds.length === 0) {
      return { messagesProcessed: 0, messagesSkipped: 0, historyId: latestHistoryId, errors: [] };
    }

    // Deduplicate message IDs
    const uniqueIds = Array.from(new Set(newMessageIds));

    // Fetch and process in batches
    const batchSize = 10;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const fullMessages = await Promise.all(
        batch.map(async (id) => {
          try {
            return await fetchGmailMessage(accessToken, id);
          } catch (err) {
            errors.push(`Failed to fetch message ${id}: ${err}`);
            return null;
          }
        })
      );

      const parsedMessages = fullMessages
        .filter((m): m is GmailMessage => m !== null)
        .map(parseGmailMessage);

      const allEmails: string[] = [];
      for (const parsed of parsedMessages) {
        allEmails.push(parsed.from);
        parsed.to.forEach((t) => allEmails.push(t.email));
        parsed.cc.forEach((c) => allEmails.push(c.email));
        parsed.bcc.forEach((b) => allEmails.push(b.email));
      }

      const matchCache = await buildMatchCache(admin, allEmails);

      for (const parsed of parsedMessages) {
        try {
          const stored = await processMessage(admin, parsed, userId, gmailEmail, matchCache);
          if (stored) {
            messagesProcessed++;
          } else {
            messagesSkipped++;
          }
        } catch (err) {
          errors.push(`Failed to process message ${parsed.gmailMessageId}: ${err}`);
          messagesSkipped++;
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // If historyId is invalid (expired), fall back to initial sync
    if (message.includes("404") || message.includes("historyId")) {
      console.warn(`History ID expired for user ${userId}, falling back to initial sync`);
      return initialSync(admin, userId, accessToken, gmailEmail);
    }
    errors.push(`Incremental sync error: ${message}`);
  }

  return { messagesProcessed, messagesSkipped, historyId: latestHistoryId, errors };
}

/**
 * Sync a single user's Gmail inbox.
 * Handles both initial and incremental sync.
 */
export async function syncUserGmail(userId: string): Promise<SyncResult> {
  const admin = createAdminClient();
  const errors: string[] = [];

  // Get the user's Gmail token
  let accessToken: string;
  let gmailEmail: string;
  try {
    const token = await getValidGmailToken(userId);
    accessToken = token.accessToken;
    gmailEmail = token.email;
  } catch (err) {
    return {
      userId,
      email: "",
      messagesProcessed: 0,
      messagesSkipped: 0,
      errors: [`Token error: ${err}`],
    };
  }

  // Check if user has gmail.readonly scope
  const { data: tokenRecord } = await admin
    .from("gmail_tokens")
    .select("scopes")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  const scopes = (tokenRecord?.scopes as string[]) || [];
  const hasReadScope = scopes.some(
    (s) =>
      s.includes("gmail.readonly") || s.includes("mail.google.com")
  );

  if (!hasReadScope) {
    return {
      userId,
      email: gmailEmail,
      messagesProcessed: 0,
      messagesSkipped: 0,
      errors: ["Missing gmail.readonly scope — user needs to re-authorize"],
    };
  }

  // Get or create sync state
  let { data: syncState } = await admin
    .from("gmail_sync_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!syncState) {
    const { data: newState, error: createError } = await admin
      .from("gmail_sync_state")
      .insert({
        user_id: userId,
        gmail_email: gmailEmail,
        sync_status: "syncing",
      })
      .select()
      .single();

    if (createError) {
      return {
        userId,
        email: gmailEmail,
        messagesProcessed: 0,
        messagesSkipped: 0,
        errors: [`Failed to create sync state: ${createError.message}`],
      };
    }
    syncState = newState;
  } else {
    // Mark as syncing
    await admin
      .from("gmail_sync_state")
      .update({ sync_status: "syncing", updated_at: new Date().toISOString() })
      .eq("id", syncState.id);
  }

  // Perform sync
  let result: { messagesProcessed: number; messagesSkipped: number; historyId: string | null; errors: string[] };

  if (syncState.history_id) {
    // Incremental sync
    result = await incrementalSync(
      admin,
      userId,
      accessToken,
      gmailEmail,
      String(syncState.history_id)
    );
  } else {
    // Initial sync
    result = await initialSync(admin, userId, accessToken, gmailEmail);
  }

  // Update sync state
  const updateData: Record<string, unknown> = {
    sync_status: result.errors.length > 0 ? "error" : "idle",
    error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
    last_sync_at: new Date().toISOString(),
    messages_synced: (syncState.messages_synced || 0) + result.messagesProcessed,
    updated_at: new Date().toISOString(),
  };

  if (result.historyId) {
    updateData.history_id = parseInt(result.historyId);
  }

  if (!syncState.history_id) {
    updateData.last_full_sync_at = new Date().toISOString();
  }

  await admin
    .from("gmail_sync_state")
    .update(updateData)
    .eq("id", syncState.id);

  return {
    userId,
    email: gmailEmail,
    messagesProcessed: result.messagesProcessed,
    messagesSkipped: result.messagesSkipped,
    errors: result.errors,
  };
}

/**
 * Sync all connected team members' Gmail inboxes.
 * Called by the cron/scheduled endpoint.
 */
export async function syncAllConnectedUsers(): Promise<SyncResult[]> {
  const admin = createAdminClient();

  // Find all active Gmail tokens
  const { data: tokens, error } = await admin
    .from("gmail_tokens")
    .select("user_id, email, scopes")
    .eq("is_active", true);

  if (error || !tokens) {
    console.error("Failed to fetch active Gmail tokens:", error);
    return [];
  }

  // Sync each user sequentially to avoid rate limits
  const results: SyncResult[] = [];
  for (const token of tokens) {
    try {
      console.error(`[Gmail Sync] Syncing Gmail for user ${token.user_id} (${token.email})`);
      const result = await syncUserGmail(token.user_id);
      results.push(result);
      console.error(
        `[Gmail Sync] Synced ${result.messagesProcessed} messages for ${result.email} (${result.errors.length} errors)`
      );
    } catch (err) {
      console.error(`Sync failed for user ${token.user_id}:`, err);
      results.push({
        userId: token.user_id,
        email: token.email,
        messagesProcessed: 0,
        messagesSkipped: 0,
        errors: [`Unexpected error: ${err}`],
      });
    }
  }

  return results;
}
