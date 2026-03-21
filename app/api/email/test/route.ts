import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireFounderAccess } from '@/app/app/admin/access';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  rateLimitApi,
  createRateLimitHeaders,
} from '@/lib/security/rate-limiter';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/email/test');
import { logAdminAction } from '@/lib/admin/audit';

type EmailTestPayload = {
  to?: string;
  subject?: string;
  message?: string;
  ctaText?: string;
  ctaHref?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMetricCard(label: string, value: string, tone: string) {
  return `
    <div style="flex:1 1 0;min-width:160px;border:1px solid rgba(148,163,184,0.18);border-radius:18px;padding:18px 16px;background:${tone};">
      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(label)}</div>
      <div style="margin-top:10px;font-size:24px;font-weight:800;color:#f8fafc;">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderEmailTestHtml(payload: {
  subject: string;
  message: string;
  ctaText?: string;
  ctaHref?: string;
}) {
  const safeSubject = escapeHtml(payload.subject);
  const safeMessage = escapeHtml(payload.message).replaceAll('\n', '<br />');
  const currentYear = new Date().getFullYear();
  const cta =
    payload.ctaText && payload.ctaHref
      ? `
        <div style="margin-top:28px;">
          <a
            href="${escapeHtml(payload.ctaHref)}"
            target="_blank"
            rel="noopener"
            style="display:inline-block;border-radius:14px;background:linear-gradient(135deg,#22c55e 0%,#06b6d4 100%);padding:14px 22px;color:#042f2e;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:0.01em;"
          >${escapeHtml(payload.ctaText)}</a>
        </div>
        <div style="margin-top:14px;font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-word;">
          Secure link: ${escapeHtml(payload.ctaHref)}
        </div>
      `
      : '';

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${safeSubject}</title>
    </head>
    <body style="margin:0;padding:0;background:#020617;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#e2e8f0;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        ${safeSubject} from FormaOS
      </div>
      <div style="background:
        radial-gradient(circle at top left,#0f766e 0%,rgba(15,118,110,0) 36%),
        radial-gradient(circle at top right,#2563eb 0%,rgba(37,99,235,0) 34%),
        linear-gradient(180deg,#020617 0%,#0f172a 100%);
        padding:28px 16px 48px;">
        <div style="max-width:680px;margin:0 auto;">
          <div style="padding:18px 22px 14px;border:1px solid rgba(148,163,184,0.12);border-radius:28px 28px 0 0;background:rgba(15,23,42,0.78);backdrop-filter:blur(16px);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="height:42px;width:42px;border-radius:14px;background:linear-gradient(135deg,#22c55e 0%,#38bdf8 100%);box-shadow:0 14px 30px rgba(34,197,94,0.28);"></div>
                <div>
                  <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#67e8f9;">Compliance Operating System</div>
                  <div style="margin-top:4px;font-size:22px;font-weight:900;color:#f8fafc;">FormaOS</div>
                </div>
              </div>
              <div style="border:1px solid rgba(103,232,249,0.22);border-radius:999px;padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a5f3fc;background:rgba(6,182,212,0.1);">
                Live system check
              </div>
            </div>
          </div>

          <div style="border:1px solid rgba(148,163,184,0.12);border-top:0;border-radius:0 0 28px 28px;background:rgba(15,23,42,0.9);overflow:hidden;box-shadow:0 28px 80px rgba(2,6,23,0.45);">
            <div style="padding:32px 28px 18px;">
              <div style="display:inline-flex;align-items:center;gap:8px;border-radius:999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.18);padding:7px 12px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#86efac;">
                Delivery verified
              </div>

              <h1 style="margin:18px 0 10px;font-size:34px;line-height:1.1;font-weight:900;color:#f8fafc;">
                ${safeSubject}
              </h1>

              <p style="margin:0;font-size:16px;line-height:1.75;color:#cbd5e1;">
                ${safeMessage}
              </p>

              ${cta}
            </div>

            <div style="padding:20px 28px 0;">
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                ${renderMetricCard('Status', 'Operational', 'linear-gradient(180deg,rgba(15,118,110,0.22) 0%,rgba(15,23,42,0.88) 100%)')}
                ${renderMetricCard('Surface', 'Auth + Billing + Workflows', 'linear-gradient(180deg,rgba(37,99,235,0.22) 0%,rgba(15,23,42,0.88) 100%)')}
                ${renderMetricCard('Confidence', 'Enterprise-ready', 'linear-gradient(180deg,rgba(234,179,8,0.18) 0%,rgba(15,23,42,0.88) 100%)')}
              </div>
            </div>

            <div style="padding:24px 28px 28px;">
              <div style="border:1px solid rgba(148,163,184,0.12);border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.02) 100%);padding:20px 18px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#67e8f9;">
                  Why this matters
                </div>
                <div style="margin-top:12px;font-size:14px;line-height:1.75;color:#cbd5e1;">
                  This message was sent from the founder-only FormaOS test endpoint using the live email provider configuration. It confirms outbound delivery, branded formatting, and production-safe rendering across the email pipeline.
                </div>
              </div>
            </div>
          </div>

          <div style="padding:18px 8px 0;text-align:center;font-size:12px;line-height:1.7;color:#94a3b8;">
            FormaOS helps regulated teams operate compliance with fewer manual gaps.
            <br />
            &copy; ${currentYear} FormaOS. Built for audits, onboarding, controls, evidence, and resilient operations.
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

async function readPayload(request: Request): Promise<EmailTestPayload> {
  const url = new URL(request.url);
  const queryPayload: EmailTestPayload = {
    to: url.searchParams.get('to') ?? undefined,
    subject: url.searchParams.get('subject') ?? undefined,
    message: url.searchParams.get('message') ?? undefined,
    ctaText: url.searchParams.get('ctaText') ?? undefined,
    ctaHref: url.searchParams.get('ctaHref') ?? undefined,
  };

  try {
    const body = (await request.json()) as EmailTestPayload | null;
    return { ...queryPayload, ...(body ?? {}) };
  } catch {
    return queryPayload;
  }
}

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  // Security: Only founders can use this test endpoint
  let founderId: string | undefined;
  try {
    const { user } = await requireFounderAccess();
    founderId = user.id;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  // Rate limiting: 5 emails per 10 minutes
  const rateLimitResult = await rateLimitApi(request, founderId);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) },
    );
  }

  const payload = await readPayload(request);
  const toParam = payload.to;
  const subject = payload.subject || 'FormaOS Email Test';
  const message =
    payload.message ||
    'This is a test email from the FormaOS test endpoint.';
  const ctaText = payload.ctaText;
  const ctaHref = payload.ctaHref;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Formaos.team@gmail.com';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing RESEND_API_KEY' },
      { status: 500 },
    );
  }
  if (!toParam) {
    return NextResponse.json(
      { error: 'Missing required query param: to' },
      { status: 400 },
    );
  }
  const to = toParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: renderEmailTestHtml({ subject, message, ctaText, ctaHref }),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the admin action for audit trail
    if (founderId) {
      await logAdminAction({
        actorUserId: founderId,
        action: 'email_test_sent',
        targetType: 'system',
        targetId: 'email-test',
        metadata: { to: to.join(', '), subject },
      }).catch((e) => log.error({ err: e }, 'Failed to log admin action:'));
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
