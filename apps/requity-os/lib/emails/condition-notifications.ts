import nodemailer from "nodemailer";

/* ------------------------------------------------------------------ */
/*  Transporter (reusable across calls)                                */
/* ------------------------------------------------------------------ */

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error(
      "[condition-notifications] Missing SMTP env vars (SMTP_HOST, SMTP_USER, SMTP_PASS)"
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

interface BorrowerContext {
  firstName: string;
  email: string;
  dealName: string;
  uploadLinkUrl: string | null;
}

/**
 * Look up borrower contact info and active upload link for a deal.
 * Shared across all notification emails.
 */
async function getBorrowerContext(
  adminClient: AdminClient,
  dealId: string
): Promise<{ data?: BorrowerContext; error?: string }> {
  const { data: deal } = await adminClient
    .from("unified_deals" as never)
    .select("primary_contact_id, name" as never)
    .eq("id" as never, dealId as never)
    .single();

  const dealRow = deal as { primary_contact_id: string | null; name: string } | null;
  if (!dealRow?.primary_contact_id) {
    return { error: "No primary contact on deal" };
  }

  const { data: contact } = await adminClient
    .from("crm_contacts" as never)
    .select("first_name, last_name, email" as never)
    .eq("id" as never, dealRow.primary_contact_id as never)
    .single();

  const contactRow = contact as { first_name: string; last_name: string; email: string } | null;
  if (!contactRow?.email) {
    return { error: "Primary contact has no email" };
  }

  // Find active upload link
  const { data: linkRows } = await adminClient
    .from("secure_upload_links" as never)
    .select("token, expires_at, status" as never)
    .eq("deal_id" as never, dealId as never)
    .eq("status" as never, "active" as never)
    .order("created_at" as never, { ascending: false } as never)
    .limit(1);

  let uploadLinkUrl: string | null = null;
  const links = linkRows as { token: string; expires_at: string; status: string }[] | null;
  if (links && links.length > 0) {
    const link = links[0];
    if (new Date(link.expires_at) > new Date()) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.requitygroup.com";
      uploadLinkUrl = `${baseUrl}/upload/${link.token}`;
    }
  }

  return {
    data: {
      firstName: contactRow.first_name,
      email: contactRow.email,
      dealName: dealRow.name || "Your Loan",
      uploadLinkUrl,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Email wrapper                                                      */
/* ------------------------------------------------------------------ */

const LOGO_URL = "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20Color.svg";

function emailShell(innerContent: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <img src="${LOGO_URL}" alt="Requity Group" style="height:36px" />
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px">
      ${innerContent}
    </div>
    <div style="text-align:center;margin-top:24px">
      <p style="font-size:11px;color:#94a3b8;margin:0">
        Secured by Requity Group
      </p>
    </div>
  </div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Email templates                                                    */
/* ------------------------------------------------------------------ */

function buildRevisionRequestedEmail(params: {
  borrowerFirstName: string;
  dealName: string;
  conditionName: string;
  feedback: string;
  uploadLinkUrl: string | null;
}): string {
  const { borrowerFirstName, dealName, conditionName, feedback, uploadLinkUrl } =
    params;

  const uploadButton = uploadLinkUrl
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${uploadLinkUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          Upload Revised Document
        </a>
      </div>`
    : `<p style="color:#64748b;font-size:13px;margin-top:16px">
        Please contact your loan officer for a link to upload your revised document.
      </p>`;

  return emailShell(`
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
        Action Needed: Document Revision
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b">
        ${dealName}
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px">
        Hi ${borrowerFirstName},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
        We reviewed <strong>${conditionName}</strong> and need a revised document. Here is what we need:
      </p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="margin:0;font-size:13px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">
          What to fix
        </p>
        <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6">
          ${feedback}
        </p>
      </div>
      ${uploadButton}
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
        If you have questions, reply to this email or reach out to your loan officer directly.
      </p>`);
}

function buildConditionApprovedEmail(params: {
  borrowerFirstName: string;
  dealName: string;
  conditionName: string;
  clearedCount: number;
  totalCount: number;
  uploadLinkUrl: string | null;
}): string {
  const { borrowerFirstName, dealName, conditionName, clearedCount, totalCount, uploadLinkUrl } =
    params;

  const progressPct = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

  const portalButton = uploadLinkUrl
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${uploadLinkUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          View Your Portal
        </a>
      </div>`
    : "";

  return emailShell(`
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
        Condition Approved
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b">
        ${dealName}
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px">
        Hi ${borrowerFirstName},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
        <strong>${conditionName}</strong> has been reviewed and approved.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px">
          Progress
        </p>
        <div style="background:#dcfce7;border-radius:100px;height:8px;overflow:hidden;margin:0 0 8px">
          <div style="background:#22c55e;height:100%;width:${progressPct}%;border-radius:100px"></div>
        </div>
        <p style="margin:0;font-size:14px;color:#166534">
          ${clearedCount} of ${totalCount} conditions cleared (${progressPct}%)
        </p>
      </div>
      ${portalButton}
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
        If you have questions, reply to this email or reach out to your loan officer directly.
      </p>`);
}

function buildAllConditionsClearedEmail(params: {
  borrowerFirstName: string;
  dealName: string;
}): string {
  const { borrowerFirstName, dealName } = params;

  return emailShell(`
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
        All Conditions Cleared
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b">
        ${dealName}
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px">
        Hi ${borrowerFirstName},
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 20px;text-align:center">
        <p style="margin:0 0 4px;font-size:24px">&#10003;</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#166534">
          All conditions have been satisfied
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#15803d">
          Your loan is moving forward to the next stage.
        </p>
      </div>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
        All required documentation for <strong>${dealName}</strong> has been reviewed and approved. Our team is progressing your loan to the next step. We will be in touch with updates.
      </p>
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
        If you have questions, reply to this email or reach out to your loan officer directly.
      </p>`);
}

function buildStaleConditionReminderEmail(params: {
  borrowerFirstName: string;
  dealName: string;
  conditions: { name: string; status: string }[];
  uploadLinkUrl: string | null;
}): string {
  const { borrowerFirstName, dealName, conditions, uploadLinkUrl } = params;

  const conditionRows = conditions
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 12px;font-size:14px;color:#334155;border-bottom:1px solid #f1f5f9">${c.name}</td>
          <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f1f5f9;text-align:right">
            <span style="display:inline-block;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;${
              c.status === "rejected"
                ? "background:#fef2f2;color:#991b1b"
                : "background:#fefce8;color:#854d0e"
            }">
              ${c.status === "rejected" ? "Revision Needed" : "Awaiting Upload"}
            </span>
          </td>
        </tr>`
    )
    .join("");

  const uploadButton = uploadLinkUrl
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${uploadLinkUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          Upload Documents
        </a>
      </div>`
    : `<p style="color:#64748b;font-size:13px;margin-top:16px">
        Please contact your loan officer for a link to upload your documents.
      </p>`;

  return emailShell(`
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
        Outstanding Items for Your Loan
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b">
        ${dealName}
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px">
        Hi ${borrowerFirstName},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
        We still need the following ${conditions.length === 1 ? "item" : `${conditions.length} items`} to keep your loan on track:
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:0 0 20px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.5px">Condition</th>
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#64748b;text-align:right;text-transform:uppercase;letter-spacing:0.5px">Status</th>
          </tr>
        </thead>
        <tbody>
          ${conditionRows}
        </tbody>
      </table>
      ${uploadButton}
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
        If you have questions, reply to this email or reach out to your loan officer directly.
      </p>`);
}

/* ------------------------------------------------------------------ */
/*  Digest email templates (settling period)                           */
/* ------------------------------------------------------------------ */

interface DigestChange {
  condition_id: string;
  condition_name: string;
  new_status: string;
  feedback?: string;
  changed_at: string;
}

interface SubmissionChange {
  condition_id: string;
  condition_name: string;
  doc_count: number;
  doc_names: string[];
  submitted_at: string;
}

function buildConditionStatusDigestEmail(params: {
  borrowerFirstName: string;
  dealName: string;
  approvals: { conditionName: string }[];
  revisions: { conditionName: string; feedback: string }[];
  clearedCount: number;
  totalCount: number;
  uploadLinkUrl: string | null;
}): string {
  const {
    borrowerFirstName,
    dealName,
    approvals,
    revisions,
    clearedCount,
    totalCount,
    uploadLinkUrl,
  } = params;

  const progressPct =
    totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

  // "Verified & Approved" section
  let approvedSection = "";
  if (approvals.length > 0) {
    const approvalRows = approvals
      .map(
        (a) =>
          `<tr>
            <td style="padding:8px 12px;font-size:14px;color:#166534;border-bottom:1px solid #dcfce7">
              &#10003; ${a.conditionName}
            </td>
          </tr>`
      )
      .join("");

    approvedSection = `
      <div style="margin:0 0 20px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px">
          Verified &amp; Approved
        </p>
        <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;overflow:hidden">
          <tbody>${approvalRows}</tbody>
        </table>
      </div>`;
  }

  // "Action Required" section
  let revisionSection = "";
  if (revisions.length > 0) {
    const revisionRows = revisions
      .map(
        (r) =>
          `<tr>
            <td style="padding:10px 12px;border-bottom:1px solid #fecaca">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#991b1b">${r.conditionName}</p>
              <p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.5">${r.feedback}</p>
            </td>
          </tr>`
      )
      .join("");

    revisionSection = `
      <div style="margin:0 0 20px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px">
          Action Required
        </p>
        <table style="width:100%;border-collapse:collapse;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;overflow:hidden">
          <tbody>${revisionRows}</tbody>
        </table>
      </div>`;
  }

  // Progress bar
  const progressSection = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 20px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#334155;text-transform:uppercase;letter-spacing:0.5px">
        Overall Progress
      </p>
      <div style="background:#e2e8f0;border-radius:100px;height:8px;overflow:hidden;margin:0 0 8px">
        <div style="background:#22c55e;height:100%;width:${progressPct}%;border-radius:100px"></div>
      </div>
      <p style="margin:0;font-size:14px;color:#334155">
        ${clearedCount} of ${totalCount} conditions cleared (${progressPct}%)
      </p>
    </div>`;

  const uploadButton = uploadLinkUrl
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${uploadLinkUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          ${revisions.length > 0 ? "Upload Revised Documents" : "View Your Portal"}
        </a>
      </div>`
    : "";

  const changeCount = approvals.length + revisions.length;
  const subtitle =
    changeCount === 1
      ? "1 condition updated"
      : `${changeCount} conditions updated`;

  return emailShell(`
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:600;color:#0f172a">
        Condition Update
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b">
        ${dealName} &mdash; ${subtitle}
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
        Hi ${borrowerFirstName},
      </p>
      ${revisionSection}
      ${approvedSection}
      ${progressSection}
      ${uploadButton}
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
        If you have questions, reply to this email or reach out to your loan officer directly.
      </p>`);
}

function buildSubmissionConfirmDigestEmail(params: {
  borrowerFirstName: string;
  dealName: string;
  submissions: { conditionName: string; docCount: number; docNames: string[] }[];
  uploadLinkUrl: string | null;
}): string {
  const { borrowerFirstName, dealName, submissions, uploadLinkUrl } = params;

  const totalDocs = submissions.reduce((sum, s) => sum + s.docCount, 0);

  const conditionRows = submissions
    .map(
      (s) =>
        `<tr>
          <td style="padding:8px 12px;font-size:14px;color:#334155;border-bottom:1px solid #f1f5f9">
            ${s.conditionName}
          </td>
          <td style="padding:8px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;text-align:right">
            ${s.docCount} file${s.docCount === 1 ? "" : "s"}
          </td>
        </tr>`
    )
    .join("");

  const portalButton = uploadLinkUrl
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${uploadLinkUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          View Your Portal
        </a>
      </div>`
    : "";

  return emailShell(`
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:600;color:#0f172a">
        Documents Received
      </h2>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b">
        ${dealName}
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px">
        Hi ${borrowerFirstName},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
        We received ${totalDocs} document${totalDocs === 1 ? "" : "s"} across ${submissions.length} condition${submissions.length === 1 ? "" : "s"}. Our team will review them shortly.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:0 0 20px">
        <thead>
          <tr style="background:#f0fdf4">
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#166534;text-align:left;text-transform:uppercase;letter-spacing:0.5px">Condition</th>
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#166534;text-align:right;text-transform:uppercase;letter-spacing:0.5px">Files</th>
          </tr>
        </thead>
        <tbody>
          ${conditionRows}
        </tbody>
      </table>
      ${portalButton}
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
        If you have questions, reply to this email or reach out to your loan officer directly.
      </p>`);
}

/* ------------------------------------------------------------------ */
/*  Batch queue helper (settling period)                               */
/* ------------------------------------------------------------------ */

const SETTLE_MINUTES = 15;

/**
 * Queue a condition status change into a notification batch.
 * If an active batch exists for this deal + type, append and reset the timer.
 * Otherwise, create a new batch with a 15-minute send_after.
 */
export async function queueNotificationBatch(params: {
  adminClient: AdminClient;
  dealId: string;
  batchType: "condition_status" | "submission_confirm";
  change: Record<string, unknown>;
}): Promise<{ queued: boolean; error?: string }> {
  const { adminClient, dealId, batchType, change } = params;

  try {
    const sendAfter = new Date(
      Date.now() + SETTLE_MINUTES * 60 * 1000
    ).toISOString();

    // Find existing pending batch for this deal + type
    const { data: existing } = await adminClient
      .from("notification_batches" as never)
      .select("id, changes" as never)
      .eq("deal_id" as never, dealId as never)
      .eq("batch_type" as never, batchType as never)
      .is("sent_at" as never, null as never)
      .limit(1)
      .single();

    const existingRow = existing as { id: string; changes: Record<string, unknown>[] } | null;

    if (existingRow) {
      // Append change and reset timer
      const updatedChanges = [...(existingRow.changes || []), change];
      await adminClient
        .from("notification_batches" as never)
        .update({
          changes: updatedChanges,
          send_after: sendAfter,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id" as never, existingRow.id as never);
    } else {
      // Create new batch
      await adminClient
        .from("notification_batches" as never)
        .insert({
          deal_id: dealId,
          batch_type: batchType,
          changes: [change],
          send_after: sendAfter,
        } as never);
    }

    return { queued: true };
  } catch (err) {
    console.error(`[notification-batch] Failed to queue ${batchType} for deal ${dealId}:`, err);
    return { queued: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ------------------------------------------------------------------ */
/*  Digest email sender (called by CRON processor)                     */
/* ------------------------------------------------------------------ */

/**
 * Process a condition_status batch: send consolidated digest with
 * approved and revision sections.
 */
export async function sendConditionStatusDigest(params: {
  dealId: string;
  changes: DigestChange[];
  adminClient: AdminClient;
}): Promise<{ sent: boolean; allCleared?: boolean; error?: string }> {
  const { dealId, changes, adminClient } = params;

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, error: "SMTP not configured" };

    const ctx = await getBorrowerContext(adminClient, dealId);
    if (!ctx.data) return { sent: false, error: ctx.error };

    // Deduplicate: take latest status per condition_id
    const latestByCondition = new Map<string, DigestChange>();
    for (const c of changes) {
      const existing = latestByCondition.get(c.condition_id);
      if (!existing || c.changed_at > existing.changed_at) {
        latestByCondition.set(c.condition_id, c);
      }
    }

    const deduped = Array.from(latestByCondition.values());
    const clearedStatuses = new Set(["approved", "waived", "not_applicable"]);

    const approvals = deduped
      .filter((c) => clearedStatuses.has(c.new_status))
      .map((c) => ({ conditionName: c.condition_name }));

    const revisions = deduped
      .filter((c) => c.new_status === "rejected")
      .map((c) => ({
        conditionName: c.condition_name,
        feedback: c.feedback || "Please upload a revised document.",
      }));

    // If no actionable changes after dedup, skip
    if (approvals.length === 0 && revisions.length === 0) {
      return { sent: false, error: "No actionable changes after dedup" };
    }

    // Count all conditions for progress
    const { data: allConditions } = await adminClient
      .from("unified_deal_conditions" as never)
      .select("id, status, is_borrower_facing" as never)
      .eq("deal_id" as never, dealId as never);

    const conditions =
      (allConditions as { id: string; status: string; is_borrower_facing: boolean }[] | null) ?? [];
    const relevant = conditions.filter((c) => c.is_borrower_facing !== false);
    const clearedCount = relevant.filter((c) => clearedStatuses.has(c.status)).length;
    const totalCount = relevant.length;
    const allCleared = totalCount > 0 && clearedCount === totalCount;

    let html: string;
    let subject: string;

    if (allCleared) {
      html = buildAllConditionsClearedEmail({
        borrowerFirstName: ctx.data.firstName,
        dealName: ctx.data.dealName,
      });
      subject = `All conditions cleared for ${ctx.data.dealName}`;
    } else {
      html = buildConditionStatusDigestEmail({
        borrowerFirstName: ctx.data.firstName,
        dealName: ctx.data.dealName,
        approvals,
        revisions,
        clearedCount,
        totalCount,
        uploadLinkUrl: ctx.data.uploadLinkUrl,
      });

      if (revisions.length > 0 && approvals.length > 0) {
        subject = `${ctx.data.dealName}: ${approvals.length} approved, ${revisions.length} need revision`;
      } else if (revisions.length > 0) {
        subject = `Action Needed: ${revisions.length} condition${revisions.length === 1 ? "" : "s"} need revision`;
      } else {
        subject = `${approvals.length} condition${approvals.length === 1 ? "" : "s"} approved - ${clearedCount}/${totalCount} cleared`;
      }
    }

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: ctx.data.email,
      subject,
      html,
    });

    return { sent: true, allCleared };
  } catch (err) {
    console.error("[condition-notifications] sendConditionStatusDigest error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Process a submission_confirm batch: send consolidated "documents received" email.
 */
export async function sendSubmissionConfirmDigest(params: {
  dealId: string;
  changes: SubmissionChange[];
  adminClient: AdminClient;
}): Promise<{ sent: boolean; error?: string }> {
  const { dealId, changes, adminClient } = params;

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, error: "SMTP not configured" };

    const ctx = await getBorrowerContext(adminClient, dealId);
    if (!ctx.data) return { sent: false, error: ctx.error };

    // Aggregate by condition (in case same condition submitted multiple times in window)
    const byCondition = new Map<string, { conditionName: string; docCount: number; docNames: string[] }>();
    for (const c of changes) {
      const existing = byCondition.get(c.condition_id);
      if (existing) {
        existing.docCount += c.doc_count;
        existing.docNames.push(...c.doc_names);
      } else {
        byCondition.set(c.condition_id, {
          conditionName: c.condition_name,
          docCount: c.doc_count,
          docNames: [...c.doc_names],
        });
      }
    }

    const submissions = Array.from(byCondition.values());
    const totalDocs = submissions.reduce((sum, s) => sum + s.docCount, 0);

    const html = buildSubmissionConfirmDigestEmail({
      borrowerFirstName: ctx.data.firstName,
      dealName: ctx.data.dealName,
      submissions,
      uploadLinkUrl: ctx.data.uploadLinkUrl,
    });

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: ctx.data.email,
      subject: `Documents received for ${ctx.data.dealName} (${totalDocs} file${totalDocs === 1 ? "" : "s"})`,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[condition-notifications] sendSubmissionConfirmDigest error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/* ------------------------------------------------------------------ */
/*  Public API (individual emails - kept for backwards compat)         */
/* ------------------------------------------------------------------ */

/**
 * Send a "revision requested" email to the borrower.
 * Non-blocking: failures are logged but do not throw.
 */
export async function sendRevisionRequestedEmail(params: {
  dealId: string;
  dealName: string;
  conditionName: string;
  feedback: string;
  adminClient: AdminClient;
}): Promise<{ sent: boolean; error?: string }> {
  const { dealId, dealName, conditionName, feedback, adminClient } = params;

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, error: "SMTP not configured" };

    const ctx = await getBorrowerContext(adminClient, dealId);
    if (!ctx.data) return { sent: false, error: ctx.error };

    const html = buildRevisionRequestedEmail({
      borrowerFirstName: ctx.data.firstName,
      dealName: ctx.data.dealName || dealName,
      conditionName,
      feedback,
      uploadLinkUrl: ctx.data.uploadLinkUrl,
    });

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: ctx.data.email,
      subject: `Action Needed: ${conditionName} requires revision`,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[condition-notifications] sendRevisionRequestedEmail error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send a "condition approved" email to the borrower with progress.
 * Also detects if ALL conditions are cleared and sends the celebratory email instead.
 * Non-blocking.
 */
export async function sendConditionApprovedEmail(params: {
  dealId: string;
  conditionId: string;
  conditionName: string;
  adminClient: AdminClient;
}): Promise<{ sent: boolean; allCleared?: boolean; error?: string }> {
  const { dealId, conditionId, conditionName, adminClient } = params;

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, error: "SMTP not configured" };

    const ctx = await getBorrowerContext(adminClient, dealId);
    if (!ctx.data) return { sent: false, error: ctx.error };

    // Count conditions to show progress
    const { data: allConditions } = await adminClient
      .from("unified_deal_conditions" as never)
      .select("id, status, is_borrower_facing" as never)
      .eq("deal_id" as never, dealId as never);

    const conditions = (allConditions as { id: string; status: string; is_borrower_facing: boolean }[] | null) ?? [];
    // Only count borrower-facing conditions for progress (if the flag exists), otherwise count all
    const relevant = conditions.filter((c) => c.is_borrower_facing !== false);
    const clearedStatuses = new Set(["approved", "waived", "not_applicable"]);
    const clearedCount = relevant.filter((c) => clearedStatuses.has(c.status)).length;
    const totalCount = relevant.length;
    const allCleared = totalCount > 0 && clearedCount === totalCount;

    let html: string;
    let subject: string;

    if (allCleared) {
      html = buildAllConditionsClearedEmail({
        borrowerFirstName: ctx.data.firstName,
        dealName: ctx.data.dealName,
      });
      subject = `All conditions cleared for ${ctx.data.dealName}`;
    } else {
      html = buildConditionApprovedEmail({
        borrowerFirstName: ctx.data.firstName,
        dealName: ctx.data.dealName,
        conditionName,
        clearedCount,
        totalCount,
        uploadLinkUrl: ctx.data.uploadLinkUrl,
      });
      subject = `${conditionName} approved - ${clearedCount}/${totalCount} conditions cleared`;
    }

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: ctx.data.email,
      subject,
      html,
    });

    return { sent: true, allCleared };
  } catch (err) {
    console.error("[condition-notifications] sendConditionApprovedEmail error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send a stale condition reminder email with a list of outstanding items.
 * Non-blocking.
 */
export async function sendStaleConditionReminderEmail(params: {
  dealId: string;
  conditions: { name: string; status: string }[];
  adminClient: AdminClient;
}): Promise<{ sent: boolean; error?: string }> {
  const { dealId, conditions, adminClient } = params;

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, error: "SMTP not configured" };

    if (conditions.length === 0) return { sent: false, error: "No conditions to remind" };

    const ctx = await getBorrowerContext(adminClient, dealId);
    if (!ctx.data) return { sent: false, error: ctx.error };

    const html = buildStaleConditionReminderEmail({
      borrowerFirstName: ctx.data.firstName,
      dealName: ctx.data.dealName,
      conditions,
      uploadLinkUrl: ctx.data.uploadLinkUrl,
    });

    const count = conditions.length;
    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: ctx.data.email,
      subject: `${count} outstanding ${count === 1 ? "item" : "items"} for ${ctx.data.dealName}`,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[condition-notifications] sendStaleConditionReminderEmail error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send the secure upload link email to the borrower via system SMTP.
 * Uses the HTML template stored in email_templates (slug: upload_link_sent).
 * Falls back to a hardcoded HTML template if the DB template is not found.
 * Non-blocking.
 */
export async function sendUploadLinkEmail(params: {
  dealId: string;
  uploadUrl: string;
  expiresAt: string | null;
  adminClient: AdminClient;
}): Promise<{ sent: boolean; error?: string }> {
  const { dealId, uploadUrl, expiresAt, adminClient } = params;

  try {
    const transporter = getTransporter();
    if (!transporter) return { sent: false, error: "SMTP not configured" };

    const ctx = await getBorrowerContext(adminClient, dealId);
    if (!ctx.data) return { sent: false, error: ctx.error };

    const expiryDate = expiresAt
      ? new Date(expiresAt).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

    // Try to load the template from DB
    let html: string;
    const { data: tplRow } = await adminClient
      .from("email_templates" as never)
      .select("html_body_template, is_active" as never)
      .eq("slug" as never, "upload_link_sent" as never)
      .single();

    const tpl = tplRow as { html_body_template: string; is_active: boolean } | null;

    if (tpl?.is_active && tpl.html_body_template) {
      // Use DB template with variable substitution
      html = tpl.html_body_template
        .replace(/\{\{borrower_first_name\}\}/g, ctx.data.firstName)
        .replace(/\{\{deal_name\}\}/g, ctx.data.dealName)
        .replace(/\{\{upload_link_url\}\}/g, uploadUrl)
        .replace(/\{\{link_expiry_date\}\}/g, expiryDate);
    } else {
      // Fallback: hardcoded HTML
      html = emailShell(`
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
          Document Upload Portal
        </h2>
        <p style="margin:0 0 20px;font-size:14px;color:#64748b">
          ${ctx.data.dealName}
        </p>
        <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px">
          Hi ${ctx.data.firstName},
        </p>
        <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
          We have set up a secure portal for you to upload your loan documents. Please use the link below to get started.
        </p>
        <div style="text-align:center;margin:24px 0">
          <a href="${uploadUrl}" style="display:inline-block;padding:14px 32px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
            Upload Documents
          </a>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 20px">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">
            Link Details
          </p>
          <p style="margin:0;font-size:13px;color:#334155;line-height:1.6">
            This link expires on ${expiryDate}. If you need a new link, please contact your loan officer.
          </p>
        </div>
        <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 20px">
          Once you upload your documents, our team will review them and follow up if anything else is needed. You can track your progress directly in the portal.
        </p>
        <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:20px 0 0">
          If you have questions, reply to this email or reach out to your loan officer directly.
        </p>`);
    }

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: ctx.data.email,
      subject: `Document upload link for ${ctx.data.dealName}`,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[condition-notifications] sendUploadLinkEmail error:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
