import type { ErrorEvent } from '@sentry/nextjs';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const AUTH_TOKEN_REGEX =
  /\b(Bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]*)\b/g;
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apikey', 'api_key'];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.includes(key.toLowerCase().replace(/[-_]/g, ''));
}

function scrubString(value: string): string {
  return value
    .replace(EMAIL_REGEX, '[email-redacted]')
    .replace(AUTH_TOKEN_REGEX, '[auth-token-redacted]');
}

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      result[key] = '[redacted]';
    } else if (typeof value === 'string') {
      result[key] = scrubString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = scrubObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Sentry beforeSend hook that strips PII from error reports.
 * - Removes email addresses from error messages
 * - Removes Bearer/JWT tokens
 * - Scrubs sensitive fields (password, token, secret, apiKey) from request bodies
 * - Strips user context down to only `id`
 */
export function scrubPiiFromEvent(event: ErrorEvent): ErrorEvent {
  // Scrub error messages
  if (event.message) {
    event.message = scrubString(event.message);
  }

  // Scrub exception values
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.value) {
        exception.value = scrubString(exception.value);
      }
    }
  }

  // Scrub user context — keep only id
  if (event.user) {
    event.user = { id: event.user.id };
  }

  // Scrub request body
  if (event.request?.data) {
    if (typeof event.request.data === 'string') {
      try {
        const parsed = JSON.parse(event.request.data);
        event.request.data = JSON.stringify(scrubObject(parsed));
      } catch {
        event.request.data = scrubString(event.request.data as string);
      }
    } else if (typeof event.request.data === 'object') {
      event.request.data = scrubObject(
        event.request.data as Record<string, unknown>,
      );
    }
  }

  // Scrub breadcrumb messages
  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      if (breadcrumb.message) {
        breadcrumb.message = scrubString(breadcrumb.message);
      }
    }
  }

  return event;
}
