#!/usr/bin/env node

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STRICT_MODE = process.env.SECURITY_BASELINE_STRICT === "1";
const REPORT_PATH = "artifacts/security-baseline-report.json";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const stderr = error instanceof Error && "stderr" in error ? String(error.stderr ?? "") : "";
    throw new Error(`Command failed: ${cmd}\n${stderr}`);
  }
}

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function parseMajor(version) {
  if (!version) return null;
  const match = String(version).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function parseJson(path) {
  const raw = safeRead(path);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getCommittedNodeRuntimePolicy() {
  const packageJson = parseJson("package.json");
  const packageNode = packageJson?.engines?.node ?? null;
  const packageMajor = parseMajor(packageNode);
  if (packageMajor !== null) {
    return {
      source: "package.json#engines.node",
      version: String(packageNode),
      major: packageMajor,
    };
  }

  const nvmrc = safeRead(".nvmrc")?.trim() ?? null;
  const nvmrcMajor = parseMajor(nvmrc);
  if (nvmrcMajor !== null) {
    return {
      source: ".nvmrc",
      version: nvmrc,
      major: nvmrcMajor,
    };
  }

  const nodeVersion = safeRead(".node-version")?.trim() ?? null;
  const nodeVersionMajor = parseMajor(nodeVersion);
  if (nodeVersionMajor !== null) {
    return {
      source: ".node-version",
      version: nodeVersion,
      major: nodeVersionMajor,
    };
  }

  const vercelProject = parseJson(".vercel/project.json");
  const vercelNode = vercelProject?.settings?.nodeVersion ?? null;
  const vercelMajor = parseMajor(vercelNode);
  if (vercelMajor !== null) {
    return {
      source: ".vercel/project.json",
      version: String(vercelNode),
      major: vercelMajor,
    };
  }

  return null;
}

function createCheck(id, title, level, summary, details = [], recommendation = null) {
  return { id, title, level, summary, details, recommendation };
}

function getTrackedEnvFiles() {
  const out = run("git ls-files '.env*'");
  const files = out ? out.split("\n").filter(Boolean) : [];
  return files.sort();
}

function auditTrackedEnvFiles() {
  const trackedEnvFiles = getTrackedEnvFiles();
  const allowList = new Set([".env.example", ".env.automation.example"]);
  const unexpected = trackedEnvFiles.filter((file) => !allowList.has(file));

  if (unexpected.length > 0) {
    return createCheck(
      "tracked_env_files",
      "Tracked .env Files",
      "warn",
      `Found ${unexpected.length} tracked env file(s) outside template allowlist.`,
      unexpected,
      "Keep only templates tracked; keep real env files untracked and in secret managers."
    );
  }

  return createCheck(
    "tracked_env_files",
    "Tracked .env Files",
    "pass",
    "Only approved env templates are tracked.",
    trackedEnvFiles
  );
}

function extractWorkflowNodeMajors(workflowText) {
  const explicitMajors = [];
  const envVersionMatch = workflowText.match(/^\s*NODE_VERSION:\s*['"]?([0-9][0-9A-Za-z.\-xX]*)['"]?/m);
  const envMajor = parseMajor(envVersionMatch?.[1] ?? null);

  const lines = workflowText.split("\n");
  for (const line of lines) {
    if (!line.includes("node-version:")) continue;
    if (line.includes("${{") && line.includes("env.NODE_VERSION")) {
      if (envMajor !== null) explicitMajors.push(envMajor);
      continue;
    }
    const match = line.match(/node-version:\s*['"]?([0-9][0-9A-Za-z.\-xX]*)['"]?/);
    const major = parseMajor(match?.[1] ?? null);
    if (major !== null) explicitMajors.push(major);
  }

  return Array.from(new Set(explicitMajors));
}

function auditNodeRuntimeDrift() {
  const runtimePolicy = getCommittedNodeRuntimePolicy();

  if (!runtimePolicy) {
    return createCheck(
      "node_runtime_drift",
      "Node Runtime Drift",
      "warn",
      "Unable to read a committed Node runtime policy from package.json, .nvmrc, .node-version, or .vercel/project.json.",
      [],
      "Commit one explicit runtime version policy, preferably package.json#engines.node, and align CI to it."
    );
  }

  const workflowDir = ".github/workflows";
  let files = [];
  try {
    files = readdirSync(workflowDir).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
  } catch {
    files = [];
  }

  const mismatches = [];
  const inspected = [];

  for (const file of files) {
    const path = join(workflowDir, file);
    const text = safeRead(path);
    if (!text) continue;
    const majors = extractWorkflowNodeMajors(text);
    if (majors.length === 0) continue;
    inspected.push(`${file}: ${majors.join(",")}`);
    for (const major of majors) {
      if (major !== runtimePolicy.major) {
        mismatches.push(
          `${file} uses Node ${major}, runtime policy ${runtimePolicy.source} expects ${runtimePolicy.version}`
        );
      }
    }
  }

  if (mismatches.length > 0) {
    return createCheck(
      "node_runtime_drift",
      "Node Runtime Drift",
      "warn",
      `Detected ${mismatches.length} workflow/runtime mismatch(es) against ${runtimePolicy.source} (${runtimePolicy.version}).`,
      mismatches,
      "Align CI and deployment runtime to one committed Node major version before enforcing strict mode."
    );
  }

  return createCheck(
    "node_runtime_drift",
    "Node Runtime Drift",
    "pass",
    `CI workflow node majors align with ${runtimePolicy.source} (${runtimePolicy.version}).`,
    inspected
  );
}

function auditLegacyStripeImports() {
  const grepOut = run(
    "git grep -nE \"from ['\\\"]@/lib/billing['\\\"]|require\\(['\\\"]@/lib/billing['\\\"]\\)\" -- '*.ts' '*.tsx' '*.js' '*.jsx' ':!__tests__/**' ':!tests/**' ':!e2e/**' || true"
  );
  const matches = grepOut
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const hasLegacyModule = safeRead("lib/billing.ts") !== null;

  if (matches.length > 0) {
    return createCheck(
      "legacy_stripe_imports",
      "Legacy Stripe Imports",
      "warn",
      `Found ${matches.length} import(s) using legacy billing module path.`,
      matches,
      "Prefer '@/lib/billing/stripe' for active billing flow and keep legacy module isolated."
    );
  }

  const details = hasLegacyModule ? ["lib/billing.ts exists (currently no direct imports detected)."] : [];
  return createCheck(
    "legacy_stripe_imports",
    "Legacy Stripe Imports",
    "pass",
    "No direct imports of '@/lib/billing' detected in source files.",
    details
  );
}

function hasGuardPattern(contents) {
  const guardPatterns = [
    "requireFounderAccess",
    "auth.getUser(",
    "authorization",
    "x-health-token",
    "HEALTH_CHECK_TOKEN",
    "Bearer ",
  ];
  return guardPatterns.some((pattern) => contents.includes(pattern));
}

// ---------------------------------------------------------------
// Sprint 2 (2026-05-23): four new checks. The script previously
// audited only 4 things despite the "Security Baseline" name. These
// are static, fast, and low-noise — they catch foot-guns the audit
// found, not speculative future regressions.
// ---------------------------------------------------------------

function auditSecurityHeaders() {
  const candidates = ['next.config.ts', 'next.config.js', 'next.config.mjs'];
  const text = candidates.map(safeRead).find(Boolean) ?? '';
  const proxyText = safeRead('proxy.ts') ?? safeRead('middleware.ts') ?? '';
  const all = `${text}\n${proxyText}`;
  const missing = [];
  if (!/strict-transport-security/i.test(all)) missing.push('Strict-Transport-Security (HSTS)');
  if (!/content-security-policy/i.test(all)) missing.push('Content-Security-Policy');
  if (!/x-frame-options/i.test(all)) missing.push('X-Frame-Options');
  if (!/permissions-policy/i.test(all)) missing.push('Permissions-Policy');

  if (missing.length > 0) {
    return createCheck(
      'security_headers',
      'Security Headers',
      'warn',
      `Missing header(s) from next.config + proxy/middleware: ${missing.join(', ')}.`,
      missing,
      'Confirm headers are emitted at the edge; if intentionally omitted document why.',
    );
  }
  return createCheck(
    'security_headers',
    'Security Headers',
    'pass',
    'HSTS, CSP, X-Frame-Options, and Permissions-Policy all referenced in config/proxy.',
  );
}

function auditAdminMfaGate() {
  // Audit 2026-08-02: the previous version returned 'pass' whenever
  // NEITHER layout matched the gate signature — i.e. deleting MFA
  // enforcement from both /app and /admin turned a would-be warning into
  // a green gate under SECURITY_BASELINE_STRICT=1. Absence of the gate is
  // now the loudest failure, not the quietest.
  //
  // Importing the module is not enough either: the layout has to act on
  // it, so a redirect to the challenge path is required as well.
  const GATE_IMPORT = /requireMfa|mfa-gate|ensureMfa|verifyMfa|evaluateMfaGate/i;
  const GATE_ENFORCEMENT = /MFA_CHALLENGE_PATH|\/auth\/mfa-challenge/;

  const layouts = [
    { path: 'app/admin/layout.tsx', label: '/admin/*' },
    { path: 'app/app/layout.tsx', label: '/app/*' },
  ].map((layout) => {
    const contents = safeRead(layout.path);
    return {
      ...layout,
      exists: contents !== null,
      imported: GATE_IMPORT.test(contents ?? ''),
      enforced: GATE_ENFORCEMENT.test(contents ?? ''),
    };
  });

  const ungated = layouts.filter(
    (layout) => !layout.exists || !layout.imported || !layout.enforced,
  );

  if (ungated.length > 0) {
    const details = ungated.map((layout) => {
      if (!layout.exists) return `${layout.path} is missing`;
      if (!layout.imported)
        return `${layout.path} does not reference an MFA gate`;
      return `${layout.path} references an MFA gate but never redirects to the challenge`;
    });
    return createCheck(
      'admin_mfa_gate',
      'Admin MFA Gate',
      'warn',
      `MFA enforcement missing on ${ungated.map((l) => l.label).join(' and ')} — ${
        ungated.length === layouts.length
          ? 'no layout enforces MFA at all'
          : 'these surfaces can be reached password-only'
      }.`,
      details,
      'Gate every privileged layout with evaluateMfaGate (or equivalent) and redirect to MFA_CHALLENGE_PATH when the challenge has not been cleared.',
    );
  }

  return createCheck(
    'admin_mfa_gate',
    'Admin MFA Gate',
    'pass',
    'Both /admin/* and /app/* layouts evaluate an MFA gate and redirect to the challenge.',
    layouts.map((layout) => layout.path),
  );
}

function auditCsrfDefault() {
  const proxyText = safeRead('proxy.ts') ?? safeRead('middleware.ts') ?? '';
  if (!proxyText) {
    return createCheck(
      'csrf_default',
      'CSRF Default-On',
      'warn',
      'No proxy.ts or middleware.ts found; cannot verify CSRF default.',
    );
  }
  // Heuristic: presence of validateCsrfOrigin OR a CSRF token check, AND
  // absence of an obvious always-off flag.
  const enforced = /validateCsrfOrigin|csrfToken|csrf_check/i.test(proxyText);
  const disabled = /csrf\s*:\s*false|disableCsrf\s*=\s*true|CSRF_DISABLED/i.test(proxyText);
  if (!enforced || disabled) {
    return createCheck(
      'csrf_default',
      'CSRF Default-On',
      'warn',
      `CSRF posture suspicious — enforced=${enforced}, disabled-flag=${disabled}.`,
      [],
      'Confirm validateCsrfOrigin (or equivalent) runs for all state-changing requests.',
    );
  }
  return createCheck(
    'csrf_default',
    'CSRF Default-On',
    'pass',
    'CSRF check referenced in proxy/middleware with no obvious always-off flag.',
  );
}

function auditOrgsSyncDriftGate() {
  // The check-orgs-sync.mjs gate must be invoked by at least one CI workflow.
  // It catches the v3-010 / v4-024-class drift the 2026-05-23 audit surfaced
  // (91 rows missing from `orgs` despite "consolidate" migration).
  const workflowDir = '.github/workflows';
  let files = [];
  try {
    files = readdirSync(workflowDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  } catch {
    files = [];
  }
  const referenced = files.some((f) =>
    (safeRead(join(workflowDir, f)) ?? '').includes('check-orgs-sync'),
  );
  if (!referenced) {
    return createCheck(
      'orgs_sync_gate',
      'Orgs Sync CI Gate',
      'warn',
      'scripts/check-orgs-sync.mjs exists but no CI workflow references it.',
      [],
      'Wire `node scripts/check-orgs-sync.mjs` into qa-pipeline.yml so drift fails the build.',
    );
  }
  return createCheck(
    'orgs_sync_gate',
    'Orgs Sync CI Gate',
    'pass',
    'check-orgs-sync.mjs is wired into at least one CI workflow.',
  );
}

function auditDetailedHealthExposure() {
  const path = "app/api/health/detailed/route.ts";
  const contents = safeRead(path);
  if (!contents) {
    return createCheck(
      "detailed_health_exposure",
      "Detailed Health Exposure",
      "pass",
      "No detailed health route found."
    );
  }

  const exposesSystemDetails =
    contents.includes("process.memoryUsage") ||
    contents.includes("nodeVersion") ||
    contents.includes("platform");
  const guarded = hasGuardPattern(contents);

  if (exposesSystemDetails && !guarded) {
    return createCheck(
      "detailed_health_exposure",
      "Detailed Health Exposure",
      "warn",
      "Detailed health endpoint appears public and includes internal system metadata.",
      [path],
      "Gate this endpoint behind an auth/token check before enabling strict mode."
    );
  }

  return createCheck(
    "detailed_health_exposure",
    "Detailed Health Exposure",
    "pass",
    "Detailed health endpoint is present with no obvious unauthenticated system-detail exposure signal."
  );
}

function summarize(checks) {
  const summary = { pass: 0, warn: 0, fail: 0 };
  for (const check of checks) {
    summary[check.level] += 1;
  }
  return summary;
}

function writeReport(report) {
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function printReport(report) {
  console.log("Security Baseline (Phase A) Report");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Mode: ${STRICT_MODE ? "STRICT" : "AUDIT_ONLY"}`);
  console.log("");

  for (const check of report.checks) {
    console.log(`[${check.level.toUpperCase()}] ${check.title}: ${check.summary}`);
    if (check.details.length > 0) {
      for (const detail of check.details) {
        console.log(`  - ${detail}`);
      }
    }
    if (check.recommendation) {
      console.log(`  Recommendation: ${check.recommendation}`);
    }
    console.log("");
  }

  console.log(
    `Summary: pass=${report.summary.pass}, warn=${report.summary.warn}, fail=${report.summary.fail}`
  );
  console.log(`Report path: ${REPORT_PATH}`);
}

function main() {
  const checks = [
    auditTrackedEnvFiles(),
    auditNodeRuntimeDrift(),
    auditLegacyStripeImports(),
    auditDetailedHealthExposure(),
    auditSecurityHeaders(),
    auditAdminMfaGate(),
    auditCsrfDefault(),
    auditOrgsSyncDriftGate(),
  ];
  const summary = summarize(checks);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: STRICT_MODE ? "strict" : "audit_only",
    checks,
    summary,
  };

  writeReport(report);
  printReport(report);

  const shouldFail =
    STRICT_MODE && (summary.fail > 0 || summary.warn > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();
