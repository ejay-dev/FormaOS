/**
 * Artillery.js processor for authentication and session management
 */

const crypto = require('crypto');

/**
 * Set test user data for authentication
 */
function setTestUser(context, events, done) {
  // Use existing CSV data or generate random user
  if (!context.vars.email) {
    const userId = Math.floor(Math.random() * 20) + 1;
    context.vars.email = `loadtest${userId}@formaos.com`;
    context.vars.password = 'TestPass123!';
    context.vars.orgId = `org-loadtest-${userId}`;
  }

  return done();
}

/**
 * Set authenticated user context with mock token
 */
function setAuthenticatedUser(context, events, done) {
  // Simulate authenticated state for scenarios that don't test auth flow
  context.vars.authToken = `mock_token_${crypto.randomBytes(16).toString('hex')}`;
  context.vars.userId = `user-${Math.floor(Math.random() * 1000)}`;

  if (!context.vars.orgId) {
    context.vars.orgId = `org-loadtest-${Math.floor(Math.random() * 20) + 1}`;
  }

  return done();
}

/**
 * Generate random policy data
 */
function generatePolicyData(context, events, done) {
  const categories = [
    'security',
    'compliance',
    'hr',
    'finance',
    'legal',
    'operations',
  ];
  const frequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'];
  const priorities = ['low', 'medium', 'high', 'critical'];

  context.vars.policyCategory =
    categories[Math.floor(Math.random() * categories.length)];
  context.vars.policyFrequency =
    frequencies[Math.floor(Math.random() * frequencies.length)];
  context.vars.policyPriority =
    priorities[Math.floor(Math.random() * priorities.length)];
  context.vars.timestamp = Date.now();

  return done();
}

/**
 * Generate random task data
 */
function generateTaskData(context, events, done) {
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  context.vars.taskPriority =
    priorities[Math.floor(Math.random() * priorities.length)];
  context.vars.taskStatus =
    statuses[Math.floor(Math.random() * statuses.length)];
  context.vars.timestamp = Date.now();

  // Random future date
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 90));
  context.vars.dueDate = futureDate.toISOString().split('T')[0];

  return done();
}

/**
 * Log response metrics
 */
function logResponseMetrics(context, events, done) {
  events.on('response', (data) => {
    const { statusCode, body } = data;

    // Log slow responses
    if (data.timings && data.timings.response > 2000) {
      console.log(
        `⚠️ Slow response: ${data.url} took ${data.timings.response}ms`,
      );
    }

    // Log error responses
    if (statusCode >= 400) {
      console.log(`❌ Error response: ${data.url} returned ${statusCode}`);
    }
  });

  return done();
}

/**
 * Performance thresholds validation
 */
function validatePerformance(context, events, done) {
  events.on('response', (data) => {
    const { url, timings, statusCode } = data;

    // Define performance thresholds
    const thresholds = {
      '/api/auth/signin': 1000, // Auth should be fast
      '/app': 2000, // Dashboard load
      '/api/policies': 1500, // API endpoints
      '/api/tasks': 1500,
      '/api/notifications': 500, // Real-time endpoints should be very fast
      '/api/activity-feed': 800,
    };

    // Check if URL matches any threshold pattern
    for (const [pattern, threshold] of Object.entries(thresholds)) {
      if (url.includes(pattern) && timings && timings.response > threshold) {
        events.emit(
          'counter',
          `performance.threshold_exceeded.${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`,
          1,
        );
        console.log(
          `🚨 Performance threshold exceeded: ${url} took ${timings.response}ms (threshold: ${threshold}ms)`,
        );
      }
    }

    // Track success/failure rates
    if (statusCode >= 200 && statusCode < 300) {
      events.emit('counter', 'responses.success', 1);
    } else if (statusCode >= 400) {
      events.emit('counter', 'responses.error', 1);
    }
  });

  return done();
}

module.exports = {
  setTestUser,
  setAuthenticatedUser,
  generatePolicyData,
  generateTaskData,
  logResponseMetrics,
  validatePerformance,
};
