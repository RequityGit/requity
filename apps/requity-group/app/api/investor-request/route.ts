import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://edhlkknvlczhbowasjna.supabase.co";

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone } = await request.json();

    if (!firstName || !lastName || !email || !phone) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 10) {
      return Response.json({ error: "Invalid phone number" }, { status: 400 });
    }

    /* ── CRM: create or find crm_contact ── */
    let contactId: string | null = null;
    let isExistingContact = false;
    const admin = getAdminClient();

    if (!admin) {
      console.error("[investor-request] SUPABASE_SERVICE_ROLE_KEY not configured. DB writes skipped.");
    }

    if (admin) {
      try {
        const normalizedEmail = email.trim().toLowerCase();
        const { data: existing } = await admin
          .from("crm_contacts")
          .select("id, contact_types")
          .ilike("email", normalizedEmail)
          .is("deleted_at", null)
          .maybeSingle();

        if (existing) {
          contactId = existing.id;
          isExistingContact = true;

          // Ensure "investor" is in contact_types
          const existingTypes: string[] = (existing.contact_types as string[]) || [];
          if (!existingTypes.includes("investor")) {
            await admin
              .from("crm_contacts")
              .update({ contact_types: [...existingTypes, "investor"] })
              .eq("id", contactId);
          }
        } else {
          const { data: created, error: createErr } = await admin
            .from("crm_contacts")
            .insert({
              first_name: firstName,
              last_name: lastName,
              name: `${firstName} ${lastName}`.trim(),
              email: normalizedEmail,
              phone,
              contact_type: "investor" as never,
              contact_types: ["investor"],
              source: "website" as never,
            } as never)
            .select("id")
            .single();

          if (createErr) {
            console.error("[investor-request] CRM contact error:", createErr.message, createErr.details);
          } else {
            contactId = created?.id ?? null;
          }
        }
      } catch (crmErr) {
        console.error("[investor-request] CRM contact creation error (non-fatal):", crmErr);
      }
    }

    /* ── Emails ── */
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const notifyEmail = process.env.NOTIFY_EMAIL || process.env.INVESTOR_NOTIFY_EMAIL;
    if (!notifyEmail) {
      console.error("NOTIFY_EMAIL is not set");
      return Response.json({ error: "Server configuration error." }, { status: 500 });
    }

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const crmLink = contactId
      ? `https://portal.requitygroup.com/admin/crm/${contactId}`
      : null;

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: notifyEmail,
      replyTo: email,
      subject: `New Investor Request: ${firstName} ${lastName}`,
      html: buildInternalEmail({ firstName, lastName, email, phone, timestamp, crmLink }),
    });

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank You for Your Interest \u2014 Requity Income Fund",
      html: buildConfirmationEmail({ firstName, contactEmail: notifyEmail, timestamp }),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Investor request error:", error);
    return Response.json({ error: "Failed to submit request." }, { status: 500 });
  }
}

function buildInternalEmail(d: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timestamp: string;
  crmLink: string | null;
}) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#081525;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#081525;">
  <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#fff;letter-spacing:1px;">REQUIT<span style="color:#C6A962;">Y</span> GROUP</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">New Investor Access Request</p>
  </div>
  <div style="padding:32px 40px;">
    <h2 style="margin:0 0 20px;font-size:16px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Contact Information</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Name</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#fff;font-weight:500;">${d.firstName} ${d.lastName}</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Email</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><a href="mailto:${d.email}" style="font-size:15px;color:#C6A962;text-decoration:none;">${d.email}</a></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Phone</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><a href="tel:${d.phone}" style="font-size:15px;color:#C6A962;text-decoration:none;">${d.phone}</a></td></tr>
    </table>
  </div>
  ${d.crmLink ? `<div style="padding:0 40px 24px;"><a href="${d.crmLink}" style="display:inline-block;padding:12px 24px;background:rgba(198,169,98,0.15);border:1px solid rgba(198,169,98,0.3);color:#C6A962;font-size:13px;font-weight:600;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">View in RequityOS CRM &rarr;</a></div>` : ""}
  <div style="padding:0 40px 32px;"><div style="padding:16px;background:rgba(198,169,98,0.06);border:1px solid rgba(198,169,98,0.15);"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">This investor has been prompted to complete their investor profile. You will receive a follow-up email if they submit additional details.</p></div></div>
  <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">Submitted via Requity Group Investor Request Form &middot; ${d.timestamp} ET</p></div>
</div></body></html>`;
}

function buildConfirmationEmail(d: { firstName: string; contactEmail: string; timestamp: string }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#081525;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#081525;">
  <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#fff;letter-spacing:1px;">REQUIT<span style="color:#C6A962;">Y</span> GROUP</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Income Fund</p>
  </div>
  <div style="padding:40px;">
    <p style="margin:0 0 20px;font-size:18px;color:#fff;font-weight:300;">Hi ${d.firstName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">Thank you for your interest in the Requity Income Fund. We have received your request and a member of our investor relations team will be in touch shortly to discuss the fund, answer any questions, and guide you through the next steps.</p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">In the meantime, if you have any immediate questions, please don't hesitate to reach out to us directly.</p>
    <div style="border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;"></div>
    <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.5);">Dylan Marma, Managing Partner</p>
    <p style="margin:0 0 4px;font-size:14px;"><a href="mailto:${d.contactEmail}" style="color:#C6A962;text-decoration:none;">${d.contactEmail}</a></p>
    <p style="margin:0;font-size:14px;"><a href="tel:+18132880636" style="color:#C6A962;text-decoration:none;">813.288.0636</a></p>
  </div>
  <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">&copy; ${new Date().getFullYear()} Requity Group &middot; 401 E Jackson St, Suite 3300, Tampa, FL 33602</p></div>
</div></body></html>`;
}
