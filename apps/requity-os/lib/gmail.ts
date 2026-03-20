import { createAdminClient } from "@/lib/supabase/admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

interface GmailTokenRecord {
  id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  email: string;
}

interface RefreshResult {
  access_token: string;
  expires_in: number;
}

/**
 * Refresh a Google OAuth access token using the stored refresh token.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResult> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured on the server.");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
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
    const errText = await res.text();
    console.error("Gmail token refresh failed:", errText);
    throw new Error("Failed to refresh Gmail access token.");
  }

  return res.json();
}

/**
 * Get a valid (non-expired) Gmail access token for a user.
 * Refreshes automatically if expired.
 */
export async function getValidGmailToken(
  userId: string
): Promise<{ accessToken: string; email: string }> {
  const admin = createAdminClient();

  const { data: token, error } = await admin
    .from("gmail_tokens")
    .select("id, access_token, refresh_token, token_expires_at, email")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to fetch Gmail token.");
  }
  if (!token) {
    throw new Error("No active Gmail connection found.");
  }

  const record = token as GmailTokenRecord;
  const expiresAt = new Date(record.token_expires_at).getTime();
  const now = Date.now();
  // Refresh if token expires within 5 minutes
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt - now > bufferMs) {
    return { accessToken: record.access_token, email: record.email };
  }

  // Token expired or expiring soon — refresh it
  const refreshed = await refreshAccessToken(record.refresh_token);

  const newExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000
  ).toISOString();

  await admin
    .from("gmail_tokens")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  return { accessToken: refreshed.access_token, email: record.email };
}

export interface MimeAttachment {
  /** File name for the attachment (e.g. "Broker_Fee_Agreement.pdf") */
  filename: string;
  /** MIME type (e.g. "application/pdf") */
  mimeType: string;
  /** Raw file content as a Buffer */
  content: Buffer;
}

interface MimeMessageOptions {
  from: string;
  to: string;
  subject: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  cc?: string[] | null;
  bcc?: string[] | null;
  attachments?: MimeAttachment[];
}

/** Build the body portion of a MIME message (text, html, or multipart/alternative). */
function buildBodyParts(
  bodyText: string | null | undefined,
  bodyHtml: string | null | undefined,
  boundary: string
): string[] {
  const lines: string[] = [];

  if (bodyHtml && bodyText) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push("");
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(bodyText).toString("base64"));
    lines.push(`--${boundary}`);
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(bodyHtml).toString("base64"));
    lines.push(`--${boundary}--`);
  } else if (bodyHtml) {
    lines.push("Content-Type: text/html; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(bodyHtml).toString("base64"));
  } else {
    lines.push("Content-Type: text/plain; charset=UTF-8");
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(Buffer.from(bodyText || "").toString("base64"));
  }

  return lines;
}

/**
 * Build an RFC 2822 MIME message and return it as a base64url-encoded string
 * suitable for the Gmail API `messages.send` endpoint.
 *
 * When attachments are provided, wraps everything in a multipart/mixed envelope.
 */
export function buildMimeMessage(options: MimeMessageOptions): string {
  const { from, to, subject, bodyText, bodyHtml, cc, bcc, attachments } = options;
  const hasAttachments = attachments && attachments.length > 0;

  const lines: string[] = [];

  // Headers
  lines.push(`From: ${from}`);
  lines.push(`To: ${to}`);
  if (cc && cc.length > 0) {
    lines.push(`Cc: ${cc.join(", ")}`);
  }
  if (bcc && bcc.length > 0) {
    lines.push(`Bcc: ${bcc.join(", ")}`);
  }
  lines.push(`Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`);
  lines.push("MIME-Version: 1.0");

  if (hasAttachments) {
    // Wrap body + attachments in multipart/mixed
    const mixedBoundary = `mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
    lines.push("");

    // Body part
    lines.push(`--${mixedBoundary}`);
    lines.push(...buildBodyParts(bodyText, bodyHtml, altBoundary));

    // Attachment parts
    for (const att of attachments) {
      lines.push(`--${mixedBoundary}`);
      lines.push(
        `Content-Type: ${att.mimeType}; name="${att.filename}"`
      );
      lines.push("Content-Transfer-Encoding: base64");
      lines.push(
        `Content-Disposition: attachment; filename="${att.filename}"`
      );
      lines.push("");
      // Split base64 into 76-char lines per RFC 2045
      const b64 = att.content.toString("base64");
      for (let i = 0; i < b64.length; i += 76) {
        lines.push(b64.slice(i, i + 76));
      }
    }

    lines.push(`--${mixedBoundary}--`);
  } else {
    // No attachments: inline body (backward compatible)
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    lines.push(...buildBodyParts(bodyText, bodyHtml, boundary));
  }

  const raw = lines.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send a message via the Gmail API.
 * Returns the Gmail message ID on success.
 */
export async function sendViaGmailApi(
  accessToken: string,
  rawMessage: string
): Promise<string> {
  const res = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gmail API send failed:", errText);
    throw new Error(`Gmail send failed: ${res.status}`);
  }

  const data = await res.json();
  return data.id;
}
