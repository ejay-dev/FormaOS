#!/usr/bin/env node

import SwaggerParser from '@apidevtools/swagger-parser';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
