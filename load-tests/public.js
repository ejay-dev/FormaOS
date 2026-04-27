/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const routes = ['/', '/pricing', '/contact', '/security', '/trust'];

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

export default function publicTraffic() {
  for (const route of routes) {
    const response = http.get(`${baseUrl}${route}`, {
      tags: { surface: 'public', route },
    });
    check(response, {
      [`${route} returns a non-5xx response`]: (res) => res.status < 500,
      [`${route} has body`]: (res) => res.body && res.body.length > 100,
    });
    sleep(0.2);
  }
}
