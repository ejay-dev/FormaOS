import { Resend } from "resend";
import { brand } from '@/config/brand';
import { consoleShim } from '@/lib/monitoring/console-shim';

let resendClient: Resend | null = null;

export function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    consoleShim.error("[Resend] Missing RESEND_API_KEY.");
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

// The fallback sending address only applies when RESEND_FROM_EMAIL is unset.
// Its domain must be verified in Resend or every send fails.
export function getFromEmail() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  const fromName = process.env.RESEND_FROM_NAME?.trim() || brand.email.senderName;

  if (configured) {
    if (configured.includes("<")) return configured;
    return `${fromName} <${configured}>`;
  }

  return `${fromName} <${brand.email.senderEmail}>`;
}
