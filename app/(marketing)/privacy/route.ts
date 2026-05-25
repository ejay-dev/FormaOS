import { NextResponse, type NextRequest } from 'next/server';

// 2026-05-24: was hardcoded to production absolute URL, which broke the
// GDPR compliance test (page.goto('http://localhost:3000/privacy') was
// being 301-ed to www.formaos.com.au and Lighthouse/Playwright would
// either time out or fetch the wrong page). Use a same-origin redirect
// — the canonical link tag on /legal/privacy already advertises the
// production URL for SEO.
function redirectToPrivacy(request: NextRequest) {
  const target = new URL('/legal/privacy', request.nextUrl);
  return NextResponse.redirect(target, 301);
}

export function GET(request: NextRequest) {
  return redirectToPrivacy(request);
}

export function HEAD(request: NextRequest) {
  return redirectToPrivacy(request);
}
