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
      [`${route} is authorized or safely redirected`]: (res) =>
        [200, 204, 302, 307, 308, 401, 403].includes(res.status),
    });
    sleep(0.3);
  }
}
