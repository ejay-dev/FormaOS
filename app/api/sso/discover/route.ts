import { NextResponse } from 'next/server';
import { discoverOrgSsoByEmail } from '@/lib/sso/org-sso';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createSignedFlowToken(orgId: string, email: string): string {
  const secret = process.env.SSO_FLOW_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('SSO_FLOW_TOKEN_SECRET or NEXTAUTH_SECRET must be set');
  }
  
  const payload = {
    orgId,
    email: email.toLowerCase(),
    timestamp: Date.now(),
    // Add expiration (5 minutes)
    exp: Date.now() + 5 * 60 * 1000,
  };
  
  const payloadStr = JSON.stringify(payload);
  const signature = createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');
  
  // Return signed token: base64(payload).signature
  return `${Buffer.from(payloadStr).toString('base64')}.${signature}`;
}

/**
 * Verify and decode a signed SSO flow token
 * Returns the orgId if valid, null if invalid or expired
 */
export function verifyFlowToken(token: string): { orgId: string; email: string } | null {
  try {
    const secret = process.env.SSO_FLOW_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;
    
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr);
    
    // Verify signature
    const expectedSignature = createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    // Check expiration
    if (Date.now() > payload.exp) return null;
    
    return {
      orgId: payload.orgId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

// GET /api/sso/discover?email=user@company.com
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const result = await discoverOrgSsoByEmail(email);
  if (!result.ok || !result.orgId) {
    return NextResponse.json({ ok: false, error: result.error ?? 'not_found' }, { status: 404 });
  }

  // Return only SSO availability status, not the raw orgId
  // To prevent organization enumeration attacks
  return NextResponse.json({
    ok: true,
    ssoAvailable: true,
    enforceSso: Boolean(result.enforceSso),
    // Generate a cryptographically signed flow token
    // The orgId can be verified and extracted server-side during the SSO flow
    flowToken: createSignedFlowToken(result.orgId, email),
  });
}

