import { scrubPiiFromEvent } from '@/lib/sentry/scrub-pii';
import type { ErrorEvent } from '@sentry/nextjs';

function makeEvent(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return { ...overrides } as ErrorEvent;
}

describe('scrubPiiFromEvent', () => {
  it('scrubs email from event message', () => {
    const event = makeEvent({ message: 'Error for user@example.com' });
    const result = scrubPiiFromEvent(event);
    expect(result.message).toBe('Error for [email-redacted]');
  });

  it('scrubs Bearer token from message', () => {
    const event = makeEvent({ message: 'Auth: Bearer abc123' });
    const result = scrubPiiFromEvent(event);
    expect(result.message).not.toContain('abc123');
  });

  it('scrubs JWT from message', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature';
    const event = makeEvent({ message: `Token: ${jwt}` });
    const result = scrubPiiFromEvent(event);
    expect(result.message).not.toContain('eyJ');
  });

  it('scrubs exception values', () => {
    const event = makeEvent({
      exception: {
        values: [{ value: 'Failed for admin@corp.com', type: 'Error' }],
      },
    });
    const result = scrubPiiFromEvent(event);
    expect(result.exception!.values![0].value).toBe(
      'Failed for [email-redacted]',
    );
  });

  it('strips user context to id only', () => {
    const event = makeEvent({
      user: { id: 'u1', email: 'test@test.com', username: 'admin' },
    });
    const result = scrubPiiFromEvent(event);
    expect(result.user).toEqual({ id: 'u1' });
  });

  it('scrubs object request data with sensitive keys', () => {
    const event = makeEvent({
      request: {
        url: '/api/login',
        data: { password: 'secret123', name: 'John' },
      },
    });
    const result = scrubPiiFromEvent(event);
    const data = result.request!.data as Record<string, unknown>;
    expect(data.password).toBe('[redacted]');
    expect(data.name).toBe('John');
  });

  it('scrubs JSON string request data', () => {
    const event = makeEvent({
      request: {
        url: '/api',
        data: JSON.stringify({ apiKey: 'key123', value: 'ok' }),
      },
    });
    const result = scrubPiiFromEvent(event);
    const parsed = JSON.parse(result.request!.data as string);
    expect(parsed.apiKey).toBe('[redacted]');
    expect(parsed.value).toBe('ok');
  });

  it('scrubs non-JSON string request data', () => {
    const event = makeEvent({
      request: {
        url: '/api',
        data: 'email is user@example.com',
      },
    });
    const result = scrubPiiFromEvent(event);
    expect(result.request!.data).toBe('email is [email-redacted]');
  });

  it('scrubs breadcrumb messages', () => {
    const event = makeEvent({
      breadcrumbs: [
        { message: 'Loaded user@example.com profile', timestamp: 1 },
        { timestamp: 2 },
      ],
    });
    const result = scrubPiiFromEvent(event);
    expect(result.breadcrumbs![0].message).toBe(
      'Loaded [email-redacted] profile',
    );
    expect(result.breadcrumbs![1].message).toBeUndefined();
  });

  it('handles nested sensitive objects', () => {
    const event = makeEvent({
      request: {
        url: '/api',
        data: { credentials: { secret: 'abc', token: 'xyz' } },
      },
    });
    const result = scrubPiiFromEvent(event);
    const data = result.request!.data as Record<string, any>;
    expect(data.credentials.secret).toBe('[redacted]');
    expect(data.credentials.token).toBe('[redacted]');
  });

  it('handles event with no scrubbing needed', () => {
    const event = makeEvent({ message: 'Simple error' });
    const result = scrubPiiFromEvent(event);
    expect(result.message).toBe('Simple error');
  });

  it('handles event with no message or exception', () => {
    const event = makeEvent({});
    const result = scrubPiiFromEvent(event);
    expect(result).toBeDefined();
  });
});
