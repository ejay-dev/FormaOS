import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Resend] Missing RESEND_API_KEY.");
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

export function getFromEmail() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  const fromName = process.env.RESEND_FROM_NAME?.trim() || "FormaOS";

  if (configured) {
    if (configured.includes("<")) return configured;
    return `${fromName} <${configured}>`;
  }

  return `${fromName} <no-reply@formaos.com.au>`;
}
