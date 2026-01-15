/**
 * k6 Performance Testing Script for FormaOS
 * Tests various performance scenarios with detailed metrics
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const loginDuration = new Trend('login_duration');
const dashboardLoadTime = new Trend('dashboard_load_time');
const apiResponseTime = new Trend('api_response_time');
const errorRate = new Rate('error_rate');
const successfulLogins = new Counter('successful_logins');

// Test configuration
export const options = {
  scenarios: {
    // Spike test - sudden load increase
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 100,
      stages: [
        { target: 10, duration: '10s' }, // Ramp up to 10 rps
        { target: 100, duration: '5s' }, // Spike to 100 rps
        { target: 10, duration: '10s' }, // Drop back to 10 rps
        { target: 0, duration: '5s' }, // Ramp down
      ],
    },

    // Stress test - gradually increasing load
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { target: 10, duration: '2m' }, // Ramp up to 10 users
        { target: 50, duration: '5m' }, // Ramp up to 50 users
        { target: 100, duration: '5m' }, // Ramp up to 100 users
        { target: 200, duration: '5m' }, // Ramp up to 200 users
        { target: 0, duration: '2m' }, // Ramp down
      ],
    },

    // Soak test - sustained load
    soak_test: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    login_duration: ['p(95)<1000'], // 95% of logins under 1s
    dashboard_load_time: ['p(95)<3000'], // 95% of dashboard loads under 3s
    api_response_time: ['p(95)<1000'], // 95% of API calls under 1s
    error_rate: ['rate<0.05'], // Error rate under 5%
  },
};

// Test data
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

const testUsers = [
  { email: 'loadtest1@formaos.com', password: 'TestPass123!' },
  { email: 'loadtest2@formaos.com', password: 'TestPass123!' },
  { email: 'loadtest3@formaos.com', password: 'TestPass123!' },
  { email: 'loadtest4@formaos.com', password: 'TestPass123!' },
  { email: 'loadtest5@formaos.com', password: 'TestPass123!' },
];

/**
 * Main test function
 */
export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  group('User Journey', () => {
    // Homepage visit
    group('Homepage Load', () => {
      const homepageResponse = http.get(BASE_URL);
      check(homepageResponse, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage loads in < 2s': (r) => r.timings.duration < 2000,
      });
    });

    sleep(1);

    // User authentication
    group('Authentication', () => {
      const loginStart = Date.now();

      const loginResponse = http.post(
        `${API_URL}/auth/signin`,
        {
          email: user.email,
          password: user.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const loginEnd = Date.now();
      const loginTime = loginEnd - loginStart;
      loginDuration.add(loginTime);

      const loginSuccess = check(loginResponse, {
        'login status is 200': (r) => r.status === 200,
        'login has auth token': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.access_token !== undefined;
          } catch {
            return false;
          }
        },
        'login completes in < 1s': (r) => loginTime < 1000,
      });

      if (loginSuccess) {
        successfulLogins.add(1);

        // Extract auth token for subsequent requests
        let authToken = '';
        try {
          const body = JSON.parse(loginResponse.body);
          authToken = body.access_token;
        } catch (error) {
          console.log('Failed to parse login response');
          errorRate.add(1);
          return;
        }

        sleep(1);

        // Dashboard access
        group('Dashboard Access', () => {
          const dashboardStart = Date.now();

          const dashboardResponse = http.get(`${BASE_URL}/app`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          const dashboardEnd = Date.now();
          const dashboardTime = dashboardEnd - dashboardStart;
          dashboardLoadTime.add(dashboardTime);

          check(dashboardResponse, {
            'dashboard status is 200': (r) => r.status === 200,
            'dashboard loads in < 3s': (r) => dashboardTime < 3000,
            'dashboard contains navigation': (r) =>
              r.body.includes('nav') || r.body.includes('Navigation'),
          });
        });

        sleep(2);

        // API endpoints testing
        group('API Performance', () => {
          const apiEndpoints = [
            '/api/policies',
            '/api/tasks',
            '/api/team',
            '/api/notifications',
          ];

          apiEndpoints.forEach((endpoint) => {
            const apiStart = Date.now();

            const apiResponse = http.get(`${BASE_URL}${endpoint}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });

            const apiEnd = Date.now();
            const apiTime = apiEnd - apiStart;
            apiResponseTime.add(apiTime);

            const endpointName = endpoint.replace('/api/', '');
            check(apiResponse, {
              [`${endpointName} status is 200`]: (r) => r.status === 200,
              [`${endpointName} responds in < 1s`]: (r) => apiTime < 1000,
            });

            if (apiResponse.status >= 400) {
              errorRate.add(1);
            }

            sleep(0.5);
          });
        });

        sleep(1);

        // Data modification testing
        group('Data Operations', () => {
          // Create policy
          const createPolicyResponse = http.post(
            `${API_URL}/policies`,
            {
              title: `Load Test Policy ${Date.now()}`,
              description: 'Policy created during load testing',
              category: 'general',
              frequency: 'monthly',
            },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          check(createPolicyResponse, {
            'create policy status is 200 or 201': (r) =>
              [200, 201].includes(r.status),
          });

          sleep(1);

          // Create task
          const createTaskResponse = http.post(
            `${API_URL}/tasks`,
            {
              title: `Load Test Task ${Date.now()}`,
              description: 'Task created during load testing',
              priority: 'medium',
              dueDate: '2026-02-15',
            },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          check(createTaskResponse, {
            'create task status is 200 or 201': (r) =>
              [200, 201].includes(r.status),
          });
        });
      } else {
        errorRate.add(1);
        console.log(`Login failed for user: ${user.email}`);
      }
    });
  });

  sleep(1);
}

/**
 * Generate test report
 */
export function handleSummary(data) {
  return {
    'tests/load/reports/k6-performance-report.html': htmlReport(data),
    'tests/load/reports/k6-performance-summary.txt': textSummary(data, {
      indent: ' ',
      enableColors: true,
    }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

/**
 * Setup function - runs once before all VUs
 */
export function setup() {
  console.log('🚀 Starting k6 performance tests...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test users: ${testUsers.length}`);

  // Verify application is running
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(
      'Application health check failed - ensure the app is running',
    );
  }

  console.log('✅ Application health check passed');
  return { timestamp: Date.now() };
}

/**
 * Teardown function - runs once after all VUs complete
 */
export function teardown(data) {
  const duration = (Date.now() - data.timestamp) / 1000;
  console.log(`\n📊 Load test completed in ${duration}s`);
  console.log('📄 Reports generated in tests/load/reports/');
}
