const nodemailer = require('nodemailer');

let transporter;
let transporterConfig;

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Email delivery is not configured');
  }

  const configKey = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS].join('|');
  if (!transporter || configKey !== transporterConfig) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    transporterConfig = configKey;
  }
  return transporter;
};

const sendOtpEmail = async ({ to, code, purpose }) => {
  const isVerification = purpose === 'verification';
  const title = isVerification ? 'Verify your StudySync email' : 'Reset your StudySync password';
  const action = isVerification ? 'verify your email address' : 'reset your password';
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER;
  const from = sender.includes('<') ? sender : `StudySync <${sender}>`;

  await getTransporter().sendMail({
    from,
    to,
    subject: title,
    text: `Hello,\n\nUse this code to ${action}: ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.\n\nStudySync`,
    html: `<div style="background:#f3f6fa;padding:32px 16px;font-family:Arial,sans-serif;color:#1e3151"><div style="max-width:520px;margin:0 auto;padding:32px;background:#fff;border:1px solid #d9e2ef;border-radius:14px"><p style="margin:0 0 28px;color:#087eaa;font-size:15px;font-weight:700;letter-spacing:.4px">StudySync</p><h1 style="margin:0 0 12px;font-size:24px;line-height:1.3">${title}</h1><p style="margin:0 0 22px;color:#596b82;font-size:15px;line-height:1.6">Use this one-time code to ${action}:</p><div style="padding:18px;text-align:center;background:#f1f5fa;border:1px solid #e1e8f0;border-radius:10px;color:#087eaa;font-size:32px;font-weight:700;letter-spacing:8px">${code}</div><p style="margin:18px 0 0;color:#596b82;font-size:13px;line-height:1.6">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p><p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #e5ebf2;color:#596b82;font-size:13px">StudySync</p></div><p style="max-width:520px;margin:14px auto 0;color:#8290a3;font-size:11px;text-align:center">Course materials, classmates, and study conversations in one connected space.</p></div>`
  });
};

module.exports = { sendOtpEmail };
