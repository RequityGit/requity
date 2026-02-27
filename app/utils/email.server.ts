const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Requity Lending <portal@requitygroup.com>";
const PORTAL_URL = process.env.PORTAL_URL || "https://portal.requitygroup.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email:", subject);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Failed to send email:", body);
    }
  } catch (err) {
    console.error("Email send error:", err);
  }
}

function emailWrapper(content: string) {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="font-size: 24px; color: #0B1B3D;">
          <strong>Requity</strong> <span style="font-weight: 300;">Lending</span>
        </span>
        <br/>
        <span style="font-size: 11px; color: #64748B; letter-spacing: 0.5px;">A Requity Group Company</span>
      </div>
      <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid #E2E8F0;">
        ${content}
      </div>
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748B;">
        <p>Requity Lending &mdash; Commercial & Residential Bridge Lending</p>
      </div>
    </div>
  `;
}

function buttonHtml(text: string, url: string) {
  return `<a href="${url}" style="display: inline-block; background: #2563EB; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px;">${text}</a>`;
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  tempPassword: string
) {
  await sendEmail({
    to: email,
    subject: "Welcome to Your Requity Lending Portal",
    html: emailWrapper(`
      <h2 style="color: #0B1B3D; margin: 0 0 16px;">Welcome, ${fullName}!</h2>
      <p style="color: #334155; line-height: 1.6;">Your Requity Lending borrower portal is ready. You can log in to view your loan status, upload documents, and stay updated on your loan progress.</p>
      <p style="color: #334155; line-height: 1.6;">
        <strong>Email:</strong> ${email}<br/>
        <strong>Temporary Password:</strong> ${tempPassword}
      </p>
      <p style="color: #334155; line-height: 1.6;">Please change your password after your first login.</p>
      ${buttonHtml("Log In to Portal", PORTAL_URL + "/login")}
    `),
  });
}

export async function sendDocumentRequestEmail(
  email: string,
  documentName: string,
  propertyAddress: string,
  loanId: string
) {
  await sendEmail({
    to: email,
    subject: `Document Needed: ${documentName}`,
    html: emailWrapper(`
      <h2 style="color: #0B1B3D; margin: 0 0 16px;">Document Request</h2>
      <p style="color: #334155; line-height: 1.6;">Requity Lending needs the following document for your loan on <strong>${propertyAddress}</strong>:</p>
      <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <strong style="color: #0B1B3D;">${documentName}</strong>
      </div>
      <p style="color: #334155; line-height: 1.6;">Please log in to upload this document.</p>
      ${buttonHtml("Upload Document", `${PORTAL_URL}/dashboard/loan/${loanId}`)}
    `),
  });
}

export async function sendRevisionRequestEmail(
  email: string,
  documentName: string,
  propertyAddress: string,
  revisionNote: string,
  loanId: string
) {
  await sendEmail({
    to: email,
    subject: `Revision Needed: ${documentName}`,
    html: emailWrapper(`
      <h2 style="color: #0B1B3D; margin: 0 0 16px;">Revision Requested</h2>
      <p style="color: #334155; line-height: 1.6;">Your document <strong>${documentName}</strong> for the loan on <strong>${propertyAddress}</strong> needs an update:</p>
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="color: #991B1B; margin: 0;">${revisionNote}</p>
      </div>
      <p style="color: #334155; line-height: 1.6;">Please upload a revised version.</p>
      ${buttonHtml("Upload Revised Document", `${PORTAL_URL}/dashboard/loan/${loanId}`)}
    `),
  });
}

export async function sendDocumentApprovedEmail(
  email: string,
  documentName: string,
  propertyAddress: string,
  loanId: string
) {
  await sendEmail({
    to: email,
    subject: `Document Approved: ${documentName}`,
    html: emailWrapper(`
      <h2 style="color: #0B1B3D; margin: 0 0 16px;">Document Approved</h2>
      <p style="color: #334155; line-height: 1.6;">Your document <strong>${documentName}</strong> for the loan on <strong>${propertyAddress}</strong> has been approved.</p>
      <div style="background: #F0FDF4; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
        <span style="color: #10B981; font-size: 24px;">&#10003;</span>
        <p style="color: #166534; margin: 8px 0 0; font-weight: 500;">Approved</p>
      </div>
      ${buttonHtml("View Loan Details", `${PORTAL_URL}/dashboard/loan/${loanId}`)}
    `),
  });
}

export async function sendLoanStatusUpdateEmail(
  email: string,
  propertyAddress: string,
  newStatus: string,
  loanId: string
) {
  await sendEmail({
    to: email,
    subject: `Loan Update: ${propertyAddress} — ${newStatus}`,
    html: emailWrapper(`
      <h2 style="color: #0B1B3D; margin: 0 0 16px;">Loan Status Update</h2>
      <p style="color: #334155; line-height: 1.6;">Your loan for <strong>${propertyAddress}</strong> has been updated:</p>
      <div style="background: #EFF6FF; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
        <p style="color: #2563EB; margin: 0; font-weight: 600; font-size: 18px;">${newStatus}</p>
      </div>
      ${buttonHtml("View Loan Details", `${PORTAL_URL}/dashboard/loan/${loanId}`)}
    `),
  });
}

export async function sendDocumentUploadedAdminEmail(
  adminEmail: string,
  borrowerName: string,
  documentName: string,
  propertyAddress: string,
  loanId: string
) {
  await sendEmail({
    to: adminEmail,
    subject: `New Upload: ${documentName} — ${propertyAddress}`,
    html: emailWrapper(`
      <h2 style="color: #0B1B3D; margin: 0 0 16px;">New Document Uploaded</h2>
      <p style="color: #334155; line-height: 1.6;"><strong>${borrowerName}</strong> uploaded <strong>${documentName}</strong> for the loan on <strong>${propertyAddress}</strong>.</p>
      ${buttonHtml("Review Document", `${PORTAL_URL}/admin/loan/${loanId}`)}
    `),
  });
}
