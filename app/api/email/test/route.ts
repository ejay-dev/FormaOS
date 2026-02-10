import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireFounderAccess } from '@/app/app/admin/access';
import {
  rateLimitApi,
  createRateLimitHeaders,
} from '@/lib/security/rate-limiter';
import { logAdminAction } from '@/lib/admin/audit';

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const toParam = url.searchParams.get('to');
  const subject = url.searchParams.get('subject') || 'FormaOS Email Test';
  const message =
    url.searchParams.get('message') ||
    'This is a test email from the FormaOS test endpoint.';
  const ctaText = url.searchParams.get('ctaText');
  const ctaHref = url.searchParams.get('ctaHref');

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'no-reply@formaos.com.au';

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
      html: `<!DOCTYPE html>
      <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
        <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <div style="padding:20px 24px;border-bottom:1px solid #f0f2f5;display:flex;align-items:center;gap:12px;">
              <span style="width:28px;height:28px;border-radius:6px;background:#2563eb;display:inline-block;"></span>
              <span style="font-size:16px;font-weight:700;color:#111827;">FormaOS</span>
            </div>
            <div style="padding:28px 24px;">
              <h1 style="font-size:20px;margin:0 0 12px;">${subject}</h1>
              <p style="margin:0 0 16px;color:#374151;line-height:1.6;">${message}</p>
              ${
                ctaText && ctaHref
                  ? `<div style="margin:24px 0;">
                <a href="${ctaHref}" target="_blank" rel="noopener" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">${ctaText}</a>
              </div>`
                  : ''
              }
              <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">If the button doesn’t work, copy and paste this link:</p>
              ${ctaHref ? `<p style="margin:6px 0 0;font-size:12px;color:#6b7280;word-break:break-all;">${ctaHref}</p>` : ''}
            </div>
          </div>
          <div style="text-align:center;margin-top:12px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} FormaOS. All rights reserved.</div>
        </div>
      </body>
      </html>`,
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
      }).catch((e) => console.error('Failed to log admin action:', e));
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
