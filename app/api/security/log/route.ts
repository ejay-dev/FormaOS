import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  logSecurityEvent,
  SecurityEventTypes,
} from '@/lib/security/session-security';
import { extractClientIP } from '@/lib/security/session-security';

const allowedEvents = new Set(Object.values(SecurityEventTypes));
const invalidMetadataPattern =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const invalidCharsPattern = /(\-\-|;|\||&|\$\(|`)/g;

const sanitizeMetadata = (meta: unknown) => {
  if (!meta || typeof meta !== 'object') return {};
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim().slice(0, 500);
    if (invalidMetadataPattern.test(trimmed)) continue;
    if (invalidCharsPattern.test(trimmed)) continue;
    sanitized[key] = trimmed;
  }
  return sanitized;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType =
      typeof body?.eventType === 'string' ? body.eventType : '';

    if (!allowedEvents.has(eventType)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_payload' },
        { status: 400 },
      );
    }

    const metadata = sanitizeMetadata(body?.metadata);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const unauthAllowed = eventType === SecurityEventTypes.LOGIN_FAILURE;
    if (!user && !unauthAllowed) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const ipAddress = extractClientIP(request.headers);
    const userAgent = request.headers.get('user-agent') ?? undefined;

    await logSecurityEvent({
      eventType,
      userId: user?.id,
      ipAddress,
      userAgent,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[security/log] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'log_failed' },
      { status: 500 },
    );
  }
}
