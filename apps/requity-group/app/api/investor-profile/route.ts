import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

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

    /* ── Persist investor profile to CRM contact ── */
    const admin = getAdminClient();
    let contactId: string | null = null;

    if (!admin) {
      console.error("[investor-profile] SUPABASE_SERVICE_ROLE_KEY not configured. DB writes skipped.");
    }

    if (admin) {
      try {
        const normalizedEmail = email.trim().toLowerCase();

        // Find the contact created in step 1 (investor-request)
        const { data: existing } = await admin
          .from("crm_contacts")
          .select("id, notes, contact_types")
          .ilike("email", normalizedEmail)
          .is("deleted_at", null)
          .limit(1)
          .single();

        if (existing) {
          contactId = existing.id;

          // Ensure "investor" is in contact_types
          const existingTypes: string[] = (existing.contact_types as string[]) || [];
          const updatedTypes = existingTypes.includes("investor")
            ? existingTypes
            : [...existingTypes, "investor"];

          // Append any additional info to notes (structured fields go to dedicated columns)
          const existingNotes = (existing.notes as string) || "";
          const noteAddition = additionalInfo
            ? `--- Investor Note (${new Date().toISOString().split("T")[0]}) ---\n${additionalInfo}`
            : null;
          const updatedNotes = noteAddition
            ? existingNotes ? `${existingNotes}\n\n${noteAddition}` : noteAddition
            : existingNotes;

          // Write all profile fields to dedicated columns
          const updates: Record<string, unknown> = {
            contact_types: updatedTypes,
            notes: updatedNotes || undefined,
            state: state || undefined,
            accredited_status: accreditedStatus || undefined,
            target_investment: targetInvestment || undefined,
            private_offer_experience: privateOfferExperience || undefined,
            investment_interests: Array.isArray(investmentInterests) && investmentInterests.length > 0
              ? investmentInterests
              : undefined,
            investment_timeline: investmentTimeline || undefined,
            entity_type: entityType || undefined,
            referral_source: referralSource || undefined,
          };

          // Remove undefined keys so we don't overwrite with null
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
          );

          await admin.from("crm_contacts").update(cleanUpdates).eq("id", contactId);
        } else {
          // Contact not found (they may have skipped step 1 or used a different email)
          // Create a new contact with all profile fields in dedicated columns
          const { data: created } = await admin
            .from("crm_contacts")
            .insert({
              first_name: firstName,
              last_name: lastName,
              name: `${firstName} ${lastName}`.trim(),
              email: normalizedEmail,
              phone: phone || null,
              contact_type: "investor" as never,
              contact_types: ["investor"],
              source: "website" as never,
              state: state || null,
              accredited_status: accreditedStatus || null,
              target_investment: targetInvestment || null,
              private_offer_experience: privateOfferExperience || null,
              investment_interests: Array.isArray(investmentInterests) && investmentInterests.length > 0
                ? investmentInterests
                : [],
              investment_timeline: investmentTimeline || null,
              entity_type: entityType || null,
              referral_source: referralSource || null,
              notes: additionalInfo || null,
            } as never)
            .select("id")
            .single();

          contactId = created?.id ?? null;
        }
        // Ensure investor relationship type exists (CRM filters use this table)
        if (contactId) {
          const { data: existingRel } = await admin
            .from("contact_relationship_types")
            .select("id")
            .eq("contact_id", contactId)
            .eq("relationship_type", "investor")
            .maybeSingle();

          if (!existingRel) {
            await admin.from("contact_relationship_types").insert({
              contact_id: contactId,
              relationship_type: "investor",
              is_active: true,
              started_at: new Date().toISOString(),
            });
          }
        }

        // Log CRM contact activity (shows on contact timeline)
        if (contactId) {
          const profileDetails = [
            accreditedStatus ? `Accredited: ${accreditedStatus}` : null,
            targetInvestment ? `Target: ${targetInvestment}` : null,
            investmentTimeline ? `Timeline: ${investmentTimeline}` : null,
          ].filter(Boolean).join(", ");

          await admin.from("crm_activities").insert({
            contact_id: contactId,
            activity_type: "note",
            subject: "Investor profile submitted via website",
            description: `${firstName} ${lastName} completed the investor profile form via requitygroup.com.${profileDetails ? ` ${profileDetails}.` : ""}`,
            performed_by: null,
            performed_by_name: "Website",
          });
        }
      } catch (crmErr) {
        console.error("[investor-profile] CRM update error (non-fatal):", crmErr);
      }
    }

    /* ── Email notification ── */
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const notifyEmail = process.env.NOTIFY_EMAIL || process.env.INVESTOR_NOTIFY_EMAIL;

    if (smtpHost && smtpUser && smtpPass && notifyEmail) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: parseInt(process.env.SMTP_PORT || "587") === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
      const interests = Array.isArray(investmentInterests) && investmentInterests.length > 0
        ? investmentInterests.join(", ")
        : "Not specified";

      const crmLink = contactId
        ? `https://portal.requitygroup.com/admin/crm/${contactId}`
        : null;

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
        from: `"Requity Group" <${smtpUser}>`,
        to: notifyEmail,
        replyTo: email,
        subject: `Investor Profile Update: ${firstName} ${lastName}${targetInvestment ? ` - ${targetInvestment}` : ""}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#081525;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#081525;">
  <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
    <h1 style="margin:0;font-size:28px;font-weight:300;color:#fff;letter-spacing:1px;">REQUIT<span style="color:#C6A962;">Y</span> GROUP</h1>
    <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">Investor Profile Update</p>
  </div>
  ${crmLink ? `<div style="padding:24px 40px 0;"><a href="${crmLink}" style="display:inline-block;padding:12px 24px;background:rgba(198,169,98,0.15);border:1px solid rgba(198,169,98,0.3);color:#C6A962;font-size:13px;font-weight:600;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">View in RequityOS CRM &rarr;</a></div>` : ""}
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
    }

    return Response.json({ success: true, contactId });
  } catch (error) {
    console.error("[investor-profile] error:", error);
    return Response.json({ error: "Failed to submit profile." }, { status: 500 });
  }
}
