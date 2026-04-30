import { notFound } from 'next/navigation';

// =============================================================================
// PUBLIC FORM SUBMIT — TEMPORARILY DISABLED
// =============================================================================
//
// The legacy implementation here read from the `forms` table and wrote to
// `form_responses`, bypassing the canonical `org_forms` / `org_form_submissions`
// schema and the `lib/forms/submission-engine.ts` validation pipeline (rate
// limiting, captcha/honeypot, schema-driven validation, max-submission caps,
// audit logging).
//
// Combined with a JSON-key mismatch in the forms RLS policy
// (`requires_auth` in SQL vs `requireAuthentication` in code), the public
// submit pathway effectively never enforced the form's "require auth" toggle.
//
// Until the canonical public submit page is rebuilt on the new platform, this
// route returns a 404 so external links no longer resolve to a partially
// validated submission surface.
//
// Tracked under audit P1 #5 / #6 in docs/deep-codebase-audit.md.
// =============================================================================

export const dynamic = 'force-dynamic';

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  // Resolve params to satisfy Next.js' typed-params contract even though the
  // value isn't used yet — the eventual rebuild will read it.
  await params;
  return notFound();
}
