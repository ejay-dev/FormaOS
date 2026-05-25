import { headers } from 'next/headers';

/**
 * Audit 2026-05-26 — nonce-aware JSON-LD emitter.
 *
 * Marketing pages emit JSON-LD via `<script type="application/ld+json">`
 * tags rendered through `dangerouslySetInnerHTML`. Previously this
 * forced the marketing CSP to include `'unsafe-inline'` in
 * `script-src`. With proxy.ts now injecting a request-scoped
 * `x-nonce` header for all routes, this server component reads the
 * nonce and applies it to the JSON-LD script so the CSP can drop
 * `'unsafe-inline'`.
 *
 * Renders nothing if `data` is empty/falsy.
 */
export async function JsonLd({
  data,
}: {
  data: unknown | unknown[];
}): Promise<React.ReactElement | null> {
  if (!data) return null;
  if (Array.isArray(data) && data.length === 0) return null;

  // headers() is async-only in App Router server components since
  // Next 15 — `await` is required even though TS sometimes infers
  // the synchronous overload.
  const h = await headers();
  const nonce = h.get('x-nonce') ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
