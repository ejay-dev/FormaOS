/**
 * k6 Performance Testing Script for FormaOS — v4-031 rewrite.
 *
 * The previous version POSTed to /api/policies, /api/tasks, /api/team,
 * /api/notifications and signed in via /api/auth/signin. None of those
 * paths exist under that shape: mutating endpoints live under
 * /api/v1/* and require Bearer fos_… API keys, not session cookies.
 * The harness reported `error_rate` at 100% silently because the
 * assertion was `[200,201].includes(status)` and never blocked the
 * run.
 *
 * This rewrite exercises only public read endpoints that actually
 * exist (parity with load-tests/public.js): marketing pages and the
 * /api/health surface. Mutating-path load coverage belongs in
 * load-tests/dashboard.js + load-tests/exports.js (authenticated via
 * FORMAOS_AUTH_COOKIE), not here.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const homepageDuration = new Trend('homepage_duration');
const healthDuration = new Trend('health_duration');
const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    smoke: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { target: 5, duration: '30s' },
        { target: 10, duration: '1m' },
        { target: 0, duration: '15s' },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    homepage_duration: ['p(95)<2000'],
    health_duration: ['p(95)<1000'],
    error_rate: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const PUBLIC_PAGES = ['/', '/pricing', '/security', '/customer-stories'];

export default function () {
  group('Marketing pages', () => {
    const path = PUBLIC_PAGES[Math.floor(Math.random() * PUBLIC_PAGES.length)];
    const res = http.get(`${BASE_URL}${path}`, {
      tags: { type: 'marketing', path },
    });
    homepageDuration.add(res.timings.duration);
    const ok = check(res, {
      'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
    });
    errorRate.add(!ok);
  });

  sleep(1);

  group('Health endpoint', () => {
    const res = http.get(`${BASE_URL}/api/health`, { tags: { type: 'health' } });
    healthDuration.add(res.timings.duration);
    const ok = check(res, {
      'health status is 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  sleep(1);
}
