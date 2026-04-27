/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const authCookie = __ENV.FORMAOS_AUTH_COOKIE || __ENV.AUTH_COOKIE;

export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2500'],
    checks: ['rate>0.98'],
  },
};

function authHeaders() {
  if (!authCookie) {
    throw new Error('Set FORMAOS_AUTH_COOKIE or AUTH_COOKIE for export load tests.');
  }

  return {
    Cookie: authCookie,
    Accept: 'application/json,text/csv,application/pdf',
  };
}

export default function exportTraffic() {
  const response = http.get(
    `${baseUrl}/api/reports/export?type=trust&format=json&mode=sync`,
    {
      headers: authHeaders(),
      tags: { surface: 'exports', route: '/api/reports/export' },
      timeout: '20s',
    },
  );

  check(response, {
    'report export does not 5xx': (res) => res.status < 500,
    'report export returns a safe terminal status': (res) =>
      [200, 401, 403, 429].includes(res.status),
  });

  sleep(1);
}
