'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/lib/security/rate-limiter';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeValue(value: FormDataEntryValue | null, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

// LEAD_FORM rate limit: 5 submissions per 10 minutes per IP
const LEAD_FORM_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  keyPrefix: 'rl:lead-form',
} as const;

export async function submitMarketingLead(formData: FormData) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const identifier = await getClientIdentifier();
  const rl = await checkRateLimit(LEAD_FORM_RATE_LIMIT, identifier);
  if (!rl.success) {
    redirect('/contact?error=rate_limit');
  }

  // ── Input extraction with field-level length caps ─────────────────────────
  const name = safeValue(formData.get('name'), 200);
  const email = safeValue(formData.get('email'), 254); // RFC 5321 max
  const organization = safeValue(formData.get('organization'), 200);
  const industry = safeValue(formData.get('industry'), 100);
  const message = safeValue(formData.get('message'), 2000);

  // ── Honeypot: reject submissions that fill the bot trap field ─────────────
  const honeypot = safeValue(formData.get('_honey'), 10);
  if (honeypot.length > 0) {
    // Silent success - don't tell bots they were caught
    redirect('/contact?success=1');
  }

  // ── Required field validation ─────────────────────────────────────────────
  if (!name || !email || !organization || !message) {
    redirect('/contact?error=1');
  }

  // ── Email format validation ───────────────────────────────────────────────
  if (!EMAIL_REGEX.test(email)) {
    redirect('/contact?error=invalid_email');
  }

  // ── Persist lead ──────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('marketing_leads').insert({
    name,
    email,
    organization,
    industry: industry || null,
    message,
  });

  if (error) {
    redirect('/contact?error=1');
  }

  redirect('/contact?success=1');
}
