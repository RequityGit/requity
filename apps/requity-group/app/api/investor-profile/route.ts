import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      firstName, lastName, email, phone,
      accreditedStatus, targetInvestment, privateOfferExperience,
      investmentInterests, state, investmentTimeline, entityType,
      referralSource, additionalInfo,
    } = data;

    if (!firstName || !lastName || !email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const notifyEmail = process.env.NOTIFY_EMAIL || process.env.INVESTOR_NOTIFY_EMAIL;
    if (!notifyEmail) {
      return Response.json({ error: "Server configuration error." }, { status: 500 });
    }

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const interests = Array.isArray(investmentInterests) && investmentInterests.length > 0
      ? investmentInterests.join(", ")
      : "Not specified";

    const rows = [
      { label: "Accredited Status", value: accreditedStatus, highlight: true },
      { label: "Target Investment", value: targetInvestment },
      { label: "Private Offer Experience", value: privateOfferExperience },
      { label: "Investment Interests", value: interests },
      { label: "State", value: state },
      { label: "Investment Timeline", value: investmentTimeline },
      { label: "Entity Type", value: entityType },
      { label: "Referral Source", value: referralSource },
    ].filter((r) => r.value);

    const detailRows = rows
      .map((r, i) => {
        const bg = r.highlight
          ? "background:rgba(198,169,98,0.08);border:1px solid rgba(198,169,98,0.2);"
          : i % 2 === 0
            ? "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"
            : "background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);";
        const vc = r.highlight ? "color:#C6A962;font-weight:700;" : "color:#ffffff;";
        return `<tr><td style="padding:12px 16px;${bg}width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">${r.label}</span></td><td style="padding:12px 16px;${bg}"><span style="font-size:15px;${vc}">${r.value}</span></td></tr>`;
      })
      .join("");

    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: notifyEmail,
      replyTo: email,
      subject: `Investor Profile Update: ${firstName} ${lastName}${targetInvestment ? ` \u2014 ${targetInvestment}` : ""}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#081525;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#081525;">
  <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#fff;letter-spacing:1px;">REQUIT<span style="color:#C6A962;">Y</span> GROUP</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Investor Profile Update</p>
  </div>
  ${targetInvestment ? `<div style="padding:32px 40px 0;"><div style="display:inline-block;padding:10px 24px;background:rgba(198,169,98,0.15);border:1px solid rgba(198,169,98,0.3);border-radius:4px;"><span style="font-size:14px;font-weight:600;color:#C6A962;letter-spacing:1px;text-transform:uppercase;">${targetInvestment}</span></div></div>` : ""}
  <div style="padding:32px 40px;">
    <h2 style="margin:0 0 20px;font-size:16px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Contact Information</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:40%;"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Name</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:15px;color:#fff;font-weight:500;">${firstName} ${lastName}</span></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Email</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"><a href="mailto:${email}" style="font-size:15px;color:#C6A962;text-decoration:none;">${email}</a></td></tr>
      <tr><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Phone</span></td><td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><a href="tel:${phone}" style="font-size:15px;color:#C6A962;text-decoration:none;">${phone}</a></td></tr>
    </table>
  </div>
  ${detailRows ? `<div style="padding:0 40px 32px;"><h2 style="margin:0 0 20px;font-size:16px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Investor Profile</h2><table style="width:100%;border-collapse:collapse;">${detailRows}</table></div>` : ""}
  ${additionalInfo ? `<div style="padding:0 40px 32px;"><h2 style="margin:0 0 20px;font-size:16px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">Additional Information</h2><div style="padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);"><p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;white-space:pre-wrap;">${additionalInfo}</p></div></div>` : ""}
  <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">Submitted via Requity Group Investor Profile Form &middot; ${timestamp} ET</p></div>
</div></body></html>`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Investor profile error:", error);
    return Response.json({ error: "Failed to submit profile." }, { status: 500 });
  }
}
