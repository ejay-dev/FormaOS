#!/usr/bin/env node

import SwaggerParser from '@apidevtools/swagger-parser';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const openApiPath = path.join(process.cwd(), 'openapi.json');
const reportPath = path.join(process.cwd(), 'artifacts', 'qa', 'api-contracts.json');
const baseUrl = (process.env.API_CONTRACT_BASE_URL || '').replace(/\/$/, '');
const allowedMethods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
]);

const failures = [];
const warnings = [];
const liveResults = [];

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN ${message}`);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function operations(openapi) {
  const items = [];
  for (const [route, pathItem] of Object.entries(openapi.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem || {})) {
      if (!allowedMethods.has(method)) continue;
      items.push({ route, method, operation });
    }
  }
  return items;
}

function assertStaticContracts(openapi) {
  if (!String(openapi.openapi || '').startsWith('3.')) {
    fail(`openapi.json must be OpenAPI 3.x, found ${openapi.openapi || 'missing'}`);
  }

  for (const { route, method, operation } of operations(openapi)) {
    const label = `${method.toUpperCase()} ${route}`;
    if (!operation.operationId) fail(`${label} is missing operationId`);
    if (!operation.summary) warn(`${label} is missing summary`);
    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      fail(`${label} has no response contract`);
      continue;
    }

    const successResponse = Object.keys(operation.responses).find((status) =>
      /^2\d\d$/.test(status),
    );
    if (!successResponse) warn(`${label} has no 2xx response contract`);

    for (const [status, response] of Object.entries(operation.responses)) {
      if (!/^\d{3}$|^default$/.test(status)) {
        fail(`${label} has invalid response status key: ${status}`);
      }
      if (!response || typeof response !== 'object') {
        fail(`${label} response ${status} must be an object`);
      }
    }
  }

  pass(`Validated ${operations(openapi).length} OpenAPI operations`);
}

function pathToUrl(route) {
  return `${baseUrl}${route.replace(/\{[^}]+\}/g, 'contract-probe-id')}`;
}

// Sprint 2 (2026-05-23): the spec covered 30 paths while app/api/v1/ ships
// 81 route handlers. Validating only what's in the spec falsely "passed"
// while half the v1 surface was undocumented (compliance/*, analytics/*,
// care-plans/*, evidence/upload, frameworks/activate, etc.). Walk the
// filesystem and fail on any route handler not represented in openapi.json.

const v1Root = path.join(process.cwd(), 'app', 'api', 'v1');

function walkRouteHandlers(dir) {
  const handlers = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      handlers.push(...walkRouteHandlers(full));
    } else if (entry === 'route.ts' || entry === 'route.tsx') {
      handlers.push(full);
    }
  }
  return handlers;
}

function handlerPathToOpenApiRoute(handlerPath) {
  // .../app/api/v1/foo/[id]/route.ts → /api/v1/foo/{id}
  const relative = path
    .relative(path.join(process.cwd(), 'app'), handlerPath)
    .replace(/\\/g, '/')
    .replace(/\/route\.tsx?$/, '');
  return (
    '/' +
    relative
      .split('/')
      .map((segment) => segment.replace(/^\[(.+)\]$/, '{$1}'))
      .join('/')
  );
}

function loadKnownUndocumented() {
  const file = path.join(
    process.cwd(),
    'scripts',
    'api-contracts-known-undocumented.json',
  );
  try {
    const json = JSON.parse(readFileSync(file, 'utf8'));
    return new Set(Array.isArray(json.routes) ? json.routes : []);
  } catch {
    return new Set();
  }
}

function assertFilesystemCoverage(openapi) {
  let handlers;
  try {
    handlers = walkRouteHandlers(v1Root);
  } catch (error) {
    warn(`Could not scan ${v1Root}: ${error.message}`);
    return;
  }

  const specRoutes = new Set(Object.keys(openapi.paths || {}));
  const known = loadKnownUndocumented();
  const newUndocumented = [];
  const documentedFromList = [];
  const undocumentedTotal = [];

  for (const handler of handlers) {
    const route = handlerPathToOpenApiRoute(handler);
    if (specRoutes.has(route)) continue;
    undocumentedTotal.push(route);
    if (!known.has(route)) newUndocumented.push(route);
  }

  for (const route of known) {
    if (specRoutes.has(route)) documentedFromList.push(route);
  }

  // Ratchet enforcement: a new route MUST be in openapi.json. A previously-
  // listed route that's now documented MUST be removed from the JSON so the
  // backlog actually shrinks. Both conditions fail the gate.
  for (const route of newUndocumented.sort()) {
    fail(
      `${route} is a NEW undocumented route handler. Add it to openapi.json (preferred) or, for genuine exceptions, append to scripts/api-contracts-known-undocumented.json.`,
    );
  }
  for (const route of documentedFromList.sort()) {
    fail(
      `${route} is now in openapi.json but still listed in scripts/api-contracts-known-undocumented.json — remove it from the JSON so the backlog ratchets down.`,
    );
  }

  pass(
    `Filesystem coverage: ${handlers.length} v1 route handler(s), ${undocumentedTotal.length} undocumented (${known.size} grandfathered, ${newUndocumented.length} new).`,
  );
}

async function assertLiveContracts(openapi) {
  if (!baseUrl) {
    warn('Skipping live API probes because API_CONTRACT_BASE_URL is not set');
    return;
  }

  const probeTargets = operations(openapi)
    .filter(({ method }) => method === 'get')
    .filter(({ route }) => !route.includes('{'))
    .slice(0, Number(process.env.API_CONTRACT_LIVE_LIMIT || 12));

  for (const { route, method } of probeTargets) {
    const url = pathToUrl(route);
    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          Accept: 'application/json',
          'User-Agent': 'formaos-api-contract-probe',
        },
      });
      liveResults.push({ route, method, status: response.status });
      if (response.status >= 500) {
        fail(`${method.toUpperCase()} ${route} returned ${response.status}`);
      } else {
        pass(`${method.toUpperCase()} ${route} returned ${response.status}`);
      }
    } catch (error) {
      fail(`${method.toUpperCase()} ${route} probe failed: ${error.message}`);
    }
  }
}

const openapi = JSON.parse(readFileSync(openApiPath, 'utf8'));
await SwaggerParser.validate(openapi);
assertStaticContracts(openapi);
assertFilesystemCoverage(openapi);
await assertLiveContracts(openapi);

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl: baseUrl || null,
      failures,
      warnings,
      liveResults,
    },
    null,
    2,
  )}\n`,
);

if (failures.length > 0) {
  console.error(`API contract checks failed with ${failures.length} failure(s)`);
  process.exit(1);
}

console.log(`API contract checks passed. Report written to ${reportPath}`);
