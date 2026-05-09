/**
 * POST /api/trust-packet/verify (High-19)
 *
 * Public, rate-limited endpoint that lets a recipient confirm a trust
 * packet was issued by FormaOS and not modified in transit. Accepts the
 * packet body (without the signature wrapper) plus the signature value
 * and returns `{ verified: true|false }`.
 *
 * The signing key is server-side only; this endpoint is the verification
 * entry point. We deliberately do not expose JWKS yet because the
 * current scheme is HMAC-SHA256 (no public key); a future RS256/EdDSA
 * upgrade will publish JWKS at /.well-known/formaos-trust.jwks for
 * offline verification.
 */

import { NextResponse } from 'next/server';

import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/rate-limiter';
import { verifyTrustPacketSignature } from '@/lib/trust/runtime-claims';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const identifier = await getClientIdentifier();
  // GENERAL is the closest fit — public verification is read-mostly, no
  // AUTH-class secrets, and we want a generous bucket so vendor due
  // diligence tools can verify a packet without rate-limit friction.
  const rl = await checkRateLimit(RATE_LIMITS.GENERAL, identifier);
  if (!rl.success) {
    return NextResponse.json(
      { verified: false, error: 'rate_limited' },
      { status: 429, headers: createRateLimitHeaders(rl) },
    );
  }

  let body: { packet?: unknown; signature?: unknown } | null = null;
  try {
    body = (await request.json()) as { packet?: unknown; signature?: unknown };
  } catch {
    return NextResponse.json(
      { verified: false, error: 'invalid_json' },
      { status: 400 },
    );
  }

  const packet = body?.packet;
  const signature =
    typeof body?.signature === 'string' ? body.signature : null;

  if (!packet || !signature) {
    return NextResponse.json(
      { verified: false, error: 'packet_and_signature_required' },
      { status: 400 },
    );
  }

  // The signature was computed over `packetData` BEFORE the
  // `signature` wrapper was attached; callers must omit the wrapper
  // when posting back. This keeps the canonical form deterministic.
  const verified = verifyTrustPacketSignature(packet, signature);

  return NextResponse.json({
    verified,
    algorithm: 'hmac-sha256',
    notes: verified
      ? 'Signature matches. The packet was issued by FormaOS and has not been modified.'
      : 'Signature does not match. The packet may have been modified or the signature is incorrect.',
  });
}
