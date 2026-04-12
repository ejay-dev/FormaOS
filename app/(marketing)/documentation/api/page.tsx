import type { Metadata } from 'next';
import { API_KEY_SCOPES } from '@/lib/api-keys/scopes';
import { V1_OPENAPI_ROUTES, generateOpenApiSpec } from '@/lib/api-keys/openapi';
import { RELAY_EVENT_LABELS } from '@/lib/integrations/webhook-relay';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'API Documentation - FormaOS REST API Reference',
  description:
    'Complete reference for the FormaOS v1 REST API. Bearer authentication, scoped API keys, rate limits, cursor pagination, webhooks, and OpenAPI 3.1 spec.',
  alternates: { canonical: `${siteUrl}/documentation/api` },
  openGraph: {
    title: 'API Documentation - FormaOS REST API Reference',
    description:
      'Complete reference for the FormaOS v1 REST API. Bearer authentication, scoped API keys, rate limits, cursor pagination, webhooks, and OpenAPI 3.1 spec.',
    type: 'website',
    url: `${siteUrl}/documentation/api`,
    locale: 'en_AU',
    siteName: 'FormaOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Documentation - FormaOS REST API Reference',
    description:
      'FormaOS v1 REST API: bearer auth, scoped keys, rate limits, webhooks, and OpenAPI 3.1 spec.',
  },
};

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  'https://app.formaos.com';

const curlExample = `curl -X GET "${baseUrl}/api/v1/organizations" \\
  -H "Authorization: Bearer fos_xxxx.yyyy" \\
  -H "Content-Type: application/json"`;

const jsExample = `const response = await fetch("${baseUrl}/api/v1/tasks", {
  headers: {
    Authorization: "Bearer fos_xxxx.yyyy",
  },
});

const payload = await response.json();`;

const pythonExample = `import requests

response = requests.get(
    "${baseUrl}/api/v1/reports",
    headers={"Authorization": "Bearer fos_xxxx.yyyy"},
    timeout=30,
)

print(response.json())`;

export default function ApiDocumentationPage() {
  const spec = generateOpenApiSpec(baseUrl);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 text-slate-100">
      <header className="max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
          FormaOS API
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">
          Compliance data, automation events, and delivery primitives in one
          surface.
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-300">
          The v1 API supports bearer API keys and authenticated sessions, scoped
          per organization, with rate limits, cursor pagination, and signed
          webhooks.
        </p>
      </header>

      <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 lg:grid-cols-3">
        <div>
          <h2 className="text-lg font-black">Authentication</h2>
          <p className="mt-3 text-sm text-slate-300">
            Use{' '}
            <code className="rounded bg-black/30 px-1 py-0.5">
              Authorization: Bearer fos_...
            </code>
            . If no API key is provided, session authentication is used as a
            fallback.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-black">Rate Limits</h2>
          <p className="mt-3 text-sm text-slate-300">
            Every response includes <code>X-RateLimit-Limit</code>,{' '}
            <code>X-RateLimit-Remaining</code>, and{' '}
            <code>X-RateLimit-Reset</code>.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-black">Envelope</h2>
          <p className="mt-3 text-sm text-slate-300">
            All list endpoints return{' '}
            <code>{`{ data, meta: { cursor, hasMore, total } }`}</code>.
          </p>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-2xl font-black">Endpoint Reference</h2>
            <div className="mt-6 space-y-4">
              {V1_OPENAPI_ROUTES.map((route) => (
                <div
                  key={`${route.method}:${route.path}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                      {route.method}
                    </span>
                    <code className="text-sm text-slate-100">{route.path}</code>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{route.summary}</p>
                  {route.scopes?.length ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Scopes: {route.scopes.join(', ')}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-2xl font-black">Webhook Events</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {Object.entries(RELAY_EVENT_LABELS).map(([event, label]) => (
                <div
                  key={event}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="font-semibold text-slate-100">{label}</p>
                  <code className="mt-2 block text-xs text-cyan-200">
                    {event}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-2xl font-black">Scopes</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {API_KEY_SCOPES.map((scope) => (
                <span
                  key={scope}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-2xl font-black">Examples</h2>
            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  cURL
                </p>
                <pre className="overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-200">
                  {curlExample}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  JavaScript
                </p>
                <pre className="overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-200">
                  {jsExample}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Python
                </p>
                <pre className="overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-200">
                  {pythonExample}
                </pre>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
            <h2 className="text-2xl font-black">OpenAPI 3.1</h2>
            <p className="mt-3 text-sm text-slate-300">
              The spec below is generated from route metadata and can be used to
              bootstrap SDKs.
            </p>
            <pre className="mt-4 max-h-[28rem] overflow-auto rounded-2xl bg-black/30 p-4 text-[11px] text-slate-200">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </div>

          <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-6">
            <h2 className="text-2xl font-black">Error Codes</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>
                <code>400</code> Invalid request body, query params, or scope
                mismatch.
              </li>
              <li>
                <code>401</code> Missing or invalid API key / session.
              </li>
              <li>
                <code>403</code> Organization isolation or admin guard failure.
              </li>
              <li>
                <code>429</code> Rate limit exceeded for API key or session.
              </li>
              <li>
                <code>500</code> Internal processing failure or downstream
                dependency error.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
