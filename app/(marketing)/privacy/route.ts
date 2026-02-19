import { NextResponse } from 'next/server';

const CANONICAL_PRIVACY_URL = 'https://www.formaos.com.au/legal/privacy';

function redirectToCanonicalPrivacy() {
  return new NextResponse(null, {
    status: 301,
    headers: {
      Location: CANONICAL_PRIVACY_URL,
    },
  });
}

export function GET() {
  return redirectToCanonicalPrivacy();
}

export function HEAD() {
  return redirectToCanonicalPrivacy();
}
