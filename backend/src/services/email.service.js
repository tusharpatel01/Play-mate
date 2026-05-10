const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};

// ─── Email templates ──────────────────────────────────────
const emailVerificationTemplate = (name, url) => `
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
  <h2 style="color:#16a34a;">Welcome to PlayMate, ${name}! 🏏</h2>
  <p>Please verify your email address to get started.</p>
  <a href="${url}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
    Verify Email
  </a>
  <p style="color:#64748b;font-size:13px;">This link expires in 24 hours.</p>
</div>`;

const passwordResetTemplate = (name, url) => `
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
  <h2 style="color:#16a34a;">Password Reset — PlayMate</h2>
  <p>Hi ${name}, you requested a password reset.</p>
  <a href="${url}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
    Reset Password
  </a>
  <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
</div>`;

const joinRequestNotificationTemplate = (organizerName, playerName, matchTitle, url) => `
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
  <h2 style="color:#16a34a;">New Join Request 🎯</h2>
  <p>Hi ${organizerName},</p>
  <p><strong>${playerName}</strong> wants to join your match: <strong>${matchTitle}</strong></p>
  <a href="${url}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
    View Request
  </a>
</div>`;

module.exports = {
  sendEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
  joinRequestNotificationTemplate,
};
