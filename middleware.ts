import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — generates a CSP nonce per request.
 *
 * Next.js 16 reads the nonce from the `x-nonce` response header automatically
 * and injects it into framework-emitted <script> tags.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.sentry.io https://*.posthog.com https://js.stripe.com https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://vercel.com",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://*.posthog.com https://api.stripe.com https://vitals.vercel-insights.com",
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.svg, robots.txt, sitemap.xml
     * - API routes that return JSON (no HTML to protect)
     */
    {
      source:
        '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml|api/).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
};
