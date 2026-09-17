import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter = null;

if (ENV.SMTP_HOST && ENV.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD,
    },
  });
}

/**
 * Sends an email or logs in development
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to) return null;

  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"${ENV.SMTP_FROM}" <${ENV.SMTP_FROM}>`,
        to,
        subject,
        text,
        html,
      });
      return info;
    } else {
      // In development or when SMTP is not configured, log email receipt
      console.log(`[EMAIL DISPATCH - DEV] To: ${to} | Subject: ${subject}`);
      return { messageId: 'simulated-dev-id' };
    }
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    return null;
  }
}
