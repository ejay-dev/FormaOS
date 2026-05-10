#!/usr/bin/env node

/**
 * Security Monitoring Verification Script
 *
 * Validates that FormaOS security monitoring infrastructure is properly
 * configured and all required modules are present and structurally sound.
 *
 * Checks:
 *   1. Security module file presence (detection rules, event logger, etc.)
 *   2. Security monitoring feature flags configuration
 *   3. Sentry PII scrubbing module presence
 *   4. Health endpoint route files exist
 *   5. Rate limiting module presence
 *   6. CSRF protection module presence
 *   7. Session security module presence
 *   8. Structured logging with redaction
 *   9. Admin audit endpoint presence
 *  10. Security-related environment variable documentation
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const results = [];

function check(id, title, fn) {
  try {
    const result = fn();
    results.push({ id, title, ...result });
  } catch (error) {
    results.push({
      id,
      title,
      level: 'fail',
      summary: `Unexpected error: ${error.message}`,
    });
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function fileContains(relativePath, pattern) {
  try {
    const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    if (typeof pattern === 'string') return content.includes(pattern);
    return pattern.test(content);
  } catch {
    return false;
  }
}

// ── Check 1: Core security modules ──────────────────────────────────────────

check('security_modules', 'Core Security Modules', () => {
  const required = [
    'lib/security/detection-rules.ts',
    'lib/security/event-logger.ts',
    'lib/security/monitoring-flags.ts',
    'lib/security/rate-limiter.ts',
    'lib/security/csrf.ts',
    'lib/security/session-rotator.ts',
    'lib/security/session-security.ts',
    'lib/security/mfa-enforcement.ts',
    'lib/security/password-security.ts',
  ];
  const missing = required.filter((f) => !fileExists(f));
  if (missing.length > 0) {
    return {
      level: 'fail',
      summary: `${missing.length} core security module(s) missing.`,
      details: missing,
    };
  }
  return {
    level: 'pass',
    summary: `All ${required.length} core security modules present.`,
    details: required,
  };
});

// ── Check 2: Detection rules coverage ───────────────────────────────────────

check('detection_rules', 'Threat Detection Rules', () => {
  const file = 'lib/security/detection-rules.ts';
  if (!fileExists(file)) {
    return { level: 'fail', summary: 'detection-rules.ts missing.' };
  }
  const detectors = [
    'detectBruteForce',
    'detectImpossibleTravel',
    'detectNewDevice',
    'detectSessionAnomaly',
    'detectPrivilegeEscalation',
    'detectRateLimitViolation',
  ];
  const missing = detectors.filter((d) => !fileContains(file, d));
  if (missing.length > 0) {
    return {
      level: 'warn',
      summary: `${missing.length} expected detector(s) not found.`,
      details: missing,
    };
  }
  return {
    level: 'pass',
    summary: `All ${detectors.length} threat detectors present.`,
    details: detectors,
  };
});

// ── Check 3: Monitoring feature flags ───────────────────────────────────────

check('monitoring_flags', 'Security Monitoring Feature Flags', () => {
  const file = 'lib/security/monitoring-flags.ts';
  if (!fileExists(file)) {
    return { level: 'fail', summary: 'monitoring-flags.ts missing.' };
  }
  const flags = [
    'isSecurityMonitoringEnabled',
    'isSecurityDashboardEnabled',
    'isClientSecurityTrackingEnabled',
  ];
  const missing = flags.filter((f) => !fileContains(file, f));
  if (missing.length > 0) {
    return {
      level: 'warn',
      summary: `${missing.length} monitoring flag(s) not found.`,
      details: missing,
    };
  }
  return {
    level: 'pass',
    summary: `All ${flags.length} monitoring feature flags present.`,
    details: flags,
  };
});

// ── Check 4: Sentry PII scrubbing ──────────────────────────────────────────

check('sentry_pii', 'Sentry PII Scrubbing', () => {
  const scrubFile = 'lib/sentry/scrub-pii.ts';
  const serverConfig = 'sentry.server.config.ts';
  const issues = [];
  if (!fileExists(scrubFile)) issues.push('lib/sentry/scrub-pii.ts missing');
  if (!fileExists(serverConfig))
    issues.push('sentry.server.config.ts missing');
  else if (!fileContains(serverConfig, 'beforeSend'))
    issues.push('sentry.server.config.ts lacks beforeSend PII hook');
  if (issues.length > 0) {
    return { level: 'warn', summary: issues.join('; '), details: issues };
  }
  return {
    level: 'pass',
    summary: 'Sentry configured with PII scrubbing.',
    details: [scrubFile, serverConfig],
  };
});

// ── Check 5: Health endpoints ───────────────────────────────────────────────

check('health_endpoints', 'Health Check Endpoints', () => {
  const endpoints = [
    'app/api/health/route.ts',
    'app/api/health/detailed/route.ts',
  ];
  const missing = endpoints.filter((f) => !fileExists(f));
  if (missing.length > 0) {
    return {
      level: 'fail',
      summary: `${missing.length} health endpoint(s) missing.`,
      details: missing,
    };
  }
  const detailedHasAuth = fileContains(
    'app/api/health/detailed/route.ts',
    'HEALTH_DETAILED',
  );
  if (!detailedHasAuth) {
    return {
      level: 'warn',
      summary:
        'Health endpoints present but /detailed may lack token protection.',
      details: endpoints,
    };
  }
  return {
    level: 'pass',
    summary: 'Health endpoints present with token protection.',
    details: endpoints,
  };
});

// ── Check 6: Structured logging with redaction ──────────────────────────────

check('structured_logging', 'Structured Logging with Redaction', () => {
  const file = 'lib/monitoring/server-logger.ts';
  if (!fileExists(file)) {
    return { level: 'warn', summary: 'server-logger.ts not found.' };
  }
  const hasRedaction = fileContains(file, 'redact');
  if (!hasRedaction) {
    return {
      level: 'warn',
      summary: 'Logger present but redaction config not detected.',
    };
  }
  return {
    level: 'pass',
    summary: 'Structured logger with field redaction configured.',
    details: [file],
  };
});

// ── Check 7: Observability (OpenTelemetry) ──────────────────────────────────

check('observability', 'OpenTelemetry / Observability', () => {
  const otelFile = 'lib/observability/opentelemetry.ts';
  const monitorFile = 'lib/observability/enterprise-monitor.ts';
  const present = [];
  if (fileExists(otelFile)) present.push(otelFile);
  if (fileExists(monitorFile)) present.push(monitorFile);
  if (present.length === 0) {
    return { level: 'warn', summary: 'No observability modules found.' };
  }
  return {
    level: 'pass',
    summary: `${present.length} observability module(s) present.`,
    details: present,
  };
});

// ── Check 8: Admin audit endpoint ───────────────────────────────────────────

check('admin_audit', 'Admin Security Audit Endpoint', () => {
  const file = 'app/api/admin/audit/run/route.ts';
  if (!fileExists(file)) {
    return { level: 'warn', summary: 'Admin audit endpoint not found.' };
  }
  return {
    level: 'pass',
    summary: 'Admin audit endpoint present.',
    details: [file],
  };
});

// ── Check 9: Security env docs ──────────────────────────────────────────────

check('security_env_docs', 'Security Environment Documentation', () => {
  const envExample = '.env.example';
  if (!fileExists(envExample)) {
    return { level: 'warn', summary: '.env.example not found.' };
  }
  const securityVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'HEALTH_DETAILED_FOUNDER_TOKEN',
  ];
  const missing = securityVars.filter(
    (v) => !fileContains(envExample, v),
  );
  if (missing.length > 0) {
    return {
      level: 'warn',
      summary: `${missing.length} security env var(s) undocumented in .env.example.`,
      details: missing,
    };
  }
  return {
    level: 'pass',
    summary: 'All critical security env vars documented.',
    details: securityVars,
  };
});

// ── Check 10: API key middleware ─────────────────────────────────────────────

check('api_key_middleware', 'API Key Authentication Middleware', () => {
  const file = 'lib/api-keys/middleware.ts';
  if (!fileExists(file)) {
    return { level: 'warn', summary: 'API key middleware not found.' };
  }
  return {
    level: 'pass',
    summary: 'API key authentication middleware present.',
    details: [file],
  };
});

// ── Report ──────────────────────────────────────────────────────────────────

const passCount = results.filter((r) => r.level === 'pass').length;
const warnCount = results.filter((r) => r.level === 'warn').length;
const failCount = results.filter((r) => r.level === 'fail').length;

console.log('Security Monitoring Verification Report');
console.log(`Generated: ${new Date().toISOString()}\n`);

for (const r of results) {
  const tag = r.level === 'pass' ? '[PASS]' : r.level === 'warn' ? '[WARN]' : '[FAIL]';
  console.log(`${tag} ${r.title}: ${r.summary}`);
  if (r.details && r.details.length > 0) {
    for (const d of r.details) {
      console.log(`  - ${d}`);
    }
  }
}

console.log(`\nSummary: pass=${passCount}, warn=${warnCount}, fail=${failCount}`);

// Write JSON artifact
const artifactDir = path.join(ROOT, 'artifacts');
if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(
  path.join(artifactDir, 'security-monitoring-report.json'),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), results, summary: { pass: passCount, warn: warnCount, fail: failCount } },
    null,
    2,
  ),
);

process.exit(failCount > 0 ? 1 : 0);
