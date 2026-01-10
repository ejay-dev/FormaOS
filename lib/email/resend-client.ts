import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not defined in environment variables");
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

export function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
}
