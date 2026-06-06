import nodemailer from "nodemailer";
import { getEnv } from "../config/env.js";

function isSmtpConfigured() {
  const env = getEnv();
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.FROM_EMAIL);
}

function getTransporter() {
  const env = getEnv();
  if (!isSmtpConfigured()) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

export async function sendEmail(input: { to: string; subject: string; text: string; html?: string }) {
  const env = getEnv();
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`[email:dev] To: ${input.to}\nSubject: ${input.subject}\n${input.text}`);
    return;
  }

  await transporter.sendMail({
    from: env.FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export function getFrontendUrl() {
  const env = getEnv();
  const firstOrigin = env.CORS_ORIGIN.split(",")[0]?.trim();
  return env.APP_FRONTEND_URL ?? firstOrigin ?? "http://localhost:8080";
}
