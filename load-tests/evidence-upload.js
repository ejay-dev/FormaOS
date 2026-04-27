/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const authCookie = __ENV.FORMAOS_AUTH_COOKIE || __ENV.AUTH_COOKIE;
const allowMutations = __ENV.ALLOW_MUTATING_LOAD_TESTS === 'true';
const entityId = __ENV.EVIDENCE_ENTITY_ID;
const entityType = __ENV.EVIDENCE_ENTITY_TYPE || 'obligation';

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<3000'],
    checks: ['rate>0.98'],
  },
};

function guard() {
  if (!allowMutations) {
    throw new Error(
      'Set ALLOW_MUTATING_LOAD_TESTS=true before running evidence upload load tests.',
    );
  }
  if (!authCookie) {
    throw new Error('Set FORMAOS_AUTH_COOKIE or AUTH_COOKIE for evidence upload load tests.');
  }
  if (!entityId) {
    throw new Error('Set EVIDENCE_ENTITY_ID to a safe seeded entity before upload tests.');
  }
}

export default function evidenceUploadTraffic() {
  guard();

  const body = {
    entityId,
    entityType,
    files: http.file(
      `FormaOS k6 evidence upload ${Date.now()}`,
      `k6-evidence-${Date.now()}.txt`,
      'text/plain',
    ),
  };

  const response = http.post(`${baseUrl}/api/v1/evidence/upload`, body, {
    headers: {
      Cookie: authCookie,
    },
    tags: { surface: 'evidence-upload', route: '/api/v1/evidence/upload' },
    timeout: '20s',
  });

  check(response, {
    'evidence upload does not 5xx': (res) => res.status < 500,
    'evidence upload reaches expected terminal status': (res) =>
      [200, 201, 400, 401, 403, 429].includes(res.status),
  });

  sleep(1);
}
