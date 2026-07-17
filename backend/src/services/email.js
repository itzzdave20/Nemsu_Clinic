import nodemailer from 'nodemailer';

let transporter = null;
let transporterKey = '';

function configKey() {
  return [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_SECURE,
  ].join('|');
}

export function isEmailConfigured() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return !!(host && user && pass && !user.includes('your-email') && !pass.includes('your-app-password'));
}

export function getSmtpStatus() {
  const configured = isEmailConfigured();
  return {
    configured,
    host: configured ? process.env.SMTP_HOST : null,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: configured ? maskEmail(process.env.SMTP_USER) : null,
    from: process.env.SMTP_FROM || (configured ? `"NEMSU HealthHub" <${process.env.SMTP_USER}>` : null),
  };
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
}

function getTransporter() {
  if (!isEmailConfigured()) return null;

  const key = configKey();
  if (!transporter || transporterKey !== key) {
    transporterKey = key;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASS.trim(),
      },
      tls: {
        // Allow self-signed in campus/dev networks when needed
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

export function buildBrandedEmail({ title, bodyHtml, footerNote }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8F1FB;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#E8F1FB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d4e3f5;box-shadow:0 8px 24px rgba(11,61,145,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0B3D91,#1A6FBF);padding:20px 24px;">
            <p style="margin:0;color:#E8C547;font-size:12px;font-weight:600;letter-spacing:0.08em;">NEMSU CANTILAN CAMPUS</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;">HealthHub Clinic</h1>
          </td>
        </tr>
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#0B3D91,#C9A227,#0B3D91);"></td>
        </tr>
        <tr>
          <td style="padding:28px 24px;">
            <h2 style="margin:0 0 16px;color:#0B3D91;font-size:18px;">${title || 'Notification'}</h2>
            <div style="color:#334155;font-size:15px;line-height:1.65;">${bodyHtml}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px 24px;border-top:1px solid #e8eef6;">
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
              ${footerNote || 'North Eastern Mindanao State University — Cantilan Campus Clinic'}<br>
              This is an automated message. Please do not reply directly to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildAppointmentEmailHtml(appt, formattedDate, formattedTime) {
  return buildBrandedEmail({
    title: 'Appointment Reminder',
    bodyHtml: `
      <p style="margin:0 0 16px;">Dear <strong>${appt.patient_name || appt.school_id}</strong>,</p>
      <p style="margin:0 0 16px;">This is a friendly reminder of your upcoming clinic appointment:</p>
      <table role="presentation" width="100%" style="background:#F0F6FC;border-radius:12px;border:1px solid #d4e3f5;margin:0 0 16px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Date &amp; Time</p>
          <p style="margin:0 0 12px;font-size:16px;color:#0B3D91;font-weight:700;">${formattedDate} at ${formattedTime}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Reason</p>
          <p style="margin:0 0 12px;color:#1e293b;">${appt.reason || 'General consultation'}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Doctor</p>
          <p style="margin:0;color:#1e293b;">${appt.doctor_name || 'Clinic staff'}</p>
        </td></tr>
      </table>
      <p style="margin:0;padding:12px 14px;background:#FFF8E7;border-radius:10px;border-left:4px solid #C9A227;font-size:14px;color:#78590f;">
        Please arrive <strong>10 minutes early</strong> and bring your school ID.
      </p>
    `,
  });
}

/** Verify SMTP credentials / connection */
export async function verifySmtp() {
  if (!isEmailConfigured()) {
    return { success: false, error: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env' };
  }
  const transport = getTransporter();
  try {
    await transport.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (err) {
    console.error('[SMTP VERIFY]', err.message);
    return { success: false, error: friendlySmtpError(err) };
  }
}

/** Send a test email to the given address (or SMTP_USER) */
export async function sendTestEmail(to) {
  const recipient = (to || process.env.SMTP_USER || '').trim();
  if (!recipient) return { success: false, error: 'No recipient email provided' };

  const html = buildBrandedEmail({
    title: 'SMTP Test Successful',
    bodyHtml: `
      <p style="margin:0 0 12px;">Your NEMSU HealthHub email service is working correctly.</p>
      <p style="margin:0;color:#64748b;font-size:14px;">Sent at ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} (Asia/Manila)</p>
    `,
  });

  return sendEmail({
    to: recipient,
    subject: 'NEMSU HealthHub — SMTP Test',
    text: 'Your NEMSU HealthHub email service is working correctly.',
    html,
  });
}

export async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: 'SMTP not configured. Add SMTP settings in backend/.env' };
  }
  if (!to) return { success: false, error: 'No recipient email address' };

  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || `"NEMSU HealthHub" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || buildBrandedEmail({
        title: subject,
        bodyHtml: `<p style="margin:0;white-space:pre-line;">${escapeHtml(text)}</p>`,
      }),
    });
    return { success: true, messageId: info.messageId, accepted: info.accepted };
  } catch (err) {
    console.error('[EMAIL]', err.message);
    return { success: false, error: friendlySmtpError(err) };
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function friendlySmtpError(err) {
  const msg = err?.message || String(err);
  if (/Invalid login|EAUTH|535/i.test(msg)) {
    return 'SMTP authentication failed. For Gmail, use an App Password (not your normal password).';
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ESOCKET/i.test(msg)) {
    return 'Cannot reach SMTP server. Check SMTP_HOST, SMTP_PORT, and your network/firewall.';
  }
  if (/self[- ]signed|certificate/i.test(msg)) {
    return 'TLS certificate error. Set SMTP_REJECT_UNAUTHORIZED=false for campus/dev servers only.';
  }
  return msg;
}
