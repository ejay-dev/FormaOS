import { test, expect } from '@playwright/test';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

async function followRedirects(request: any, startUrl: string, maxHops = 5) {
  const chain: string[] = [];
  const seen = new Map<string, number>();
  let current = startUrl;

  for (let hop = 0; hop < maxHops; hop += 1) {
    chain.push(current);
    const response = await request.get(current, { maxRedirects: 0 });
    const status = response.status();

    if (!REDIRECT_STATUSES.has(status)) {
      return { chain, finalStatus: status };
    }

    const location = response.headers().location;
    if (!location) {
      return { chain, finalStatus: status };
    }

    const next = new URL(location, current).toString();
    const count = (seen.get(next) ?? 0) + 1;
    seen.set(next, count);

    if (count > 2) {
      return { chain: [...chain, next], finalStatus: status, loopDetected: true };
    }

    current = next;
  }

  return { chain, finalStatus: 0, loopDetected: true };
}

test.describe('Redirect loop guard', () => {
  test('should not loop for /app or /auth/signin', async ({ request, baseURL }) => {
    const appUrl = new URL('/app', baseURL!).toString();
    const signinUrl = new URL('/auth/signin', baseURL!).toString();

    const appResult = await followRedirects(request, appUrl);
    expect(appResult.loopDetected, `Redirect loop for /app: ${appResult.chain.join(' -> ')}`).toBeFalsy();

    const signinResult = await followRedirects(request, signinUrl);
    expect(signinResult.loopDetected, `Redirect loop for /auth/signin: ${signinResult.chain.join(' -> ')}`).toBeFalsy();
  });
});
