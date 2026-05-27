import 'server-only';

import { trace, context, SpanStatusCode, type Span } from '@opentelemetry/api';

// Audit 2026-05-27 — withSpan helper for domain-level OpenTelemetry
// spans. Wraps a function with an explicit span so Supabase queries,
// Stripe API calls, Rekor submissions etc. show up under domain
// names rather than generic HTTP rows.
//
// HTTP + undici auto-instrumentation gives us spans for every outgoing
// fetch — but they're named after the URL, which is hard to filter on
// when debugging "all Stripe latency for org X". The withSpan() pattern:
//
//   await withSpan('stripe.subscriptions.update', { 'org_id': orgId }, async () => {
//     return stripe.subscriptions.update(...);
//   });
//
// produces a parent span with the right name + attributes, and the
// auto-instrumented HTTP span hangs off it as a child.
//
// Errors are recorded on the span as the standard OTel exception
// shape so trace explorers (Sentry, Honeycomb, etc.) show the failure
// inline.

const TRACER_NAME = 'formaos';

type SpanAttributes = Record<string, string | number | boolean | undefined | null>;
type CleanedAttributes = Record<string, string | number | boolean>;

function cleanAttributes(attrs: SpanAttributes | undefined): CleanedAttributes {
  if (!attrs) return {};
  const cleaned: CleanedAttributes = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    cleaned[k] = v;
  }
  return cleaned;
}

/**
 * Run an async function inside a named OpenTelemetry span. The span
 * inherits the active context, so HTTP/undici spans triggered inside
 * fn become children of it. Exceptions are recorded + the span is
 * marked ERROR before being re-thrown.
 *
 * Span name convention: domain.operation, lowercase, dot-separated.
 *   - "audit.write"
 *   - "audit.anchor.submit"
 *   - "stripe.subscriptions.update"
 *   - "supabase.rpc.audit_log_append_v3"
 *
 * Attribute convention: lowercase, dot-separated, no PII. Org IDs are
 * fine (they're UUIDs, not identifying). User emails / tokens are NOT.
 */
export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes | undefined,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startActiveSpan(
    name,
    { attributes: cleanAttributes(attributes) },
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err instanceof Error ? err.message : 'unknown error',
        });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}

/**
 * Sync variant for code paths that don't need async. Same semantics.
 */
export function withSpanSync<T>(
  name: string,
  attributes: SpanAttributes | undefined,
  fn: (span: Span) => T,
): T {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startActiveSpan(
    name,
    { attributes: cleanAttributes(attributes) },
    (span) => {
      try {
        const result = fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err instanceof Error ? err.message : 'unknown error',
        });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}

/**
 * Add structured attributes to the currently active span (if any).
 * No-op when no span is active so call sites can opt-in safely without
 * checking whether tracing is on.
 */
export function annotateActiveSpan(attributes: SpanAttributes): void {
  const span = trace.getSpan(context.active());
  if (!span) return;
  const cleaned = cleanAttributes(attributes);
  for (const [k, v] of Object.entries(cleaned)) {
    span.setAttribute(k, v);
  }
}
