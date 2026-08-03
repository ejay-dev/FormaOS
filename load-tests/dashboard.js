/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const authCookie = __ENV.FORMAOS_AUTH_COOKIE || __ENV.AUTH_COOKIE;

export const options = {
  vus: Number(__ENV.VUS || 3),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.98'],
  },
};

function authHeaders() {
  if (!authCookie) {
    throw new Error(
      'Set FORMAOS_AUTH_COOKIE or AUTH_COOKIE for authenticated app load tests.',
    );
  }

  return {
    Cookie: authCookie,
    Accept: 'text/html,application/json',
  };
}

// A 401/403, or a redirect into the auth surface, means the cookie never
// authenticated. Previously those were accepted as "safely redirected", so
// an expired cookie produced a 100% check rate and p(95) timings that only
// measured the signed-out redirect path.
function isAuthFailure(res) {
  if (res.status === 401 || res.status === 403) return true;
  if (res.status >= 300 && res.status < 400) {
    const location = String(res.headers.Location || res.headers.location || '');
    return (
      location.includes('/auth/') ||
      location.includes('/signin') ||
      location.includes('/login')
    );
  }
  return false;
}

// Fail the whole run up front rather than reporting green against an
// unauthenticated redirect loop.
export function setup() {
  const probe = http.get(`${baseUrl}/api/onboarding-state`, {
    headers: authHeaders(),
    tags: { surface: 'authenticated-app', route: 'setup-probe' },
  });

  if (isAuthFailure(probe)) {
    throw new Error(
      `FORMAOS_AUTH_COOKIE is not authenticated: GET /api/onboarding-state returned ${probe.status}. ` +
        'Refresh the cookie before running the authenticated dashboard load test.',
    );
  }

  return { verifiedAt: Date.now() };
}

export default function dashboardTraffic() {
  const headers = authHeaders();
  const routes = [
    '/app',
    '/app/reports',
    '/api/onboarding-state',
    '/api/v1/evidence',
  ];

  for (const route of routes) {
    const response = http.get(`${baseUrl}${route}`, {
      headers,
      tags: { surface: 'authenticated-app', route },
    });
    check(response, {
      [`${route} does not 5xx`]: (res) => res.status < 500,
      [`${route} stays authenticated`]: (res) => !isAuthFailure(res),
      [`${route} serves the authenticated surface`]: (res) =>
        [200, 204, 429].includes(res.status) ||
        (res.status >= 300 && res.status < 400 && !isAuthFailure(res)),
    });
    sleep(0.3);
  }
}
