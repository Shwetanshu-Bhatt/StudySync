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

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: title,
    text: `Use this code to ${action}: ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;color:#172b4d;max-width:520px;margin:24px auto;padding:28px;border:1px solid #d9e2ef;border-radius:12px"><p style="color:#087eaa;font-size:12px;font-weight:700;letter-spacing:1.5px">STUDYSYNC</p><h1 style="font-size:23px">${title}</h1><p>Use this one-time code to ${action}:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f1f5fa;padding:16px;text-align:center;border-radius:8px">${code}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p></div>`
  });
};

module.exports = { sendOtpEmail };
