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
    "git grep -nE \"from ['\\\"]@/lib/billing['\\\"]|require\\(['\\\"]@/lib/billing['\\\"]\\)\" -- '*.ts' '*.tsx' '*.js' '*.jsx' || true"
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
