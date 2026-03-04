import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const data = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
    } = data;

    if (!firstName || !lastName || !email || !phone) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (phone.replace(/\D/g, '').length < 10) {
      return Response.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const notifyEmail = process.env.INVESTOR_NOTIFY_EMAIL;
    if (!notifyEmail) {
      console.error('INVESTOR_NOTIFY_EMAIL environment variable is not set');
      return Response.json(
        { error: 'Server configuration error. Please try again later.' },
        { status: 500 }
      );
    }
    const contactEmail = process.env.INVESTOR_CONTACT_EMAIL || notifyEmail;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    // ─── Internal Notification Email ───
    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: notifyEmail,
      replyTo: email,
      subject: `New Investor Request: ${firstName} ${lastName}`,
      html: buildInternalEmail({ firstName, lastName, email, phone, timestamp }),
    });

    // ─── Investor Confirmation Email ───
    await transporter.sendMail({
      from: `"Requity Group" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Thank You for Your Interest — Requity Income Fund',
      html: buildConfirmationEmail({ firstName, contactEmail, timestamp }),
    });

    return Response.json({ success: true, message: 'Request submitted successfully' });
  } catch (error) {
    console.error('Investor request error:', error);
    return Response.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
}

/* ─── Internal Notification Email ─── */
function buildInternalEmail(d) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#081525;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background-color:#081525;">

    <!-- Header -->
    <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
      <h1 style="margin:0;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:1px;">
        REQUIT<span style="color:#C6A962;">Y</span> GROUP
      </h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">
        New Investor Access Request
      </p>
    </div>

    <!-- Contact Information -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 20px;font-size:16px;color:#C6A962;letter-spacing:2px;text-transform:uppercase;font-weight:500;">
        Contact Information
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);width:40%;">
            <span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Name</span>
          </td>
          <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:15px;color:#ffffff;font-weight:500;">${d.firstName} ${d.lastName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Email</span>
          </td>
          <td style="padding:12px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <a href="mailto:${d.email}" style="font-size:15px;color:#C6A962;text-decoration:none;">${d.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Phone</span>
          </td>
          <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
            <a href="tel:${d.phone}" style="font-size:15px;color:#C6A962;text-decoration:none;">${d.phone}</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Note -->
    <div style="padding:0 40px 32px;">
      <div style="padding:16px;background:rgba(198,169,98,0.06);border:1px solid rgba(198,169,98,0.15);">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
          This investor has been prompted to complete their investor profile. You will receive a follow-up email if they submit additional details.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
        Submitted via Requity Group Investor Request Form &middot; ${d.timestamp} ET
      </p>
    </div>

  </div>
</body>
</html>`;
}

/* ─── Investor Confirmation Email ─── */
function buildConfirmationEmail(d) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#081525;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background-color:#081525;">

    <!-- Header -->
    <div style="padding:40px 40px 32px;border-bottom:2px solid #C6A962;">
      <h1 style="margin:0;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:1px;">
        REQUIT<span style="color:#C6A962;">Y</span> GROUP
      </h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">
        Income Fund
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="margin:0 0 20px;font-size:18px;color:#ffffff;font-weight:300;">
        Hi ${d.firstName},
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">
        Thank you for your interest in the Requity Income Fund. We have received your request and a member of our investor relations team will be in touch shortly to discuss the fund, answer any questions, and guide you through the next steps.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;">
        In the meantime, if you have any immediate questions, please don&rsquo;t hesitate to reach out to us directly.
      </p>

      <!-- Divider -->
      <div style="border-top:1px solid rgba(255,255,255,0.08);margin:32px 0;"></div>

      <!-- Contact Info -->
      <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.5);">
        Dylan Marma, Managing Partner
      </p>
      <p style="margin:0 0 4px;font-size:14px;">
        <a href="mailto:${d.contactEmail}" style="color:#C6A962;text-decoration:none;">${d.contactEmail}</a>
      </p>
      <p style="margin:0;font-size:14px;">
        <a href="tel:+18132880636" style="color:#C6A962;text-decoration:none;">813.288.0636</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
        &copy; ${new Date().getFullYear()} Requity Group &middot; 401 E Jackson St, Suite 3300, Tampa, FL 33602
      </p>
    </div>

  </div>
</body>
</html>`;
}
