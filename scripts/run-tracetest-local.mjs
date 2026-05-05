#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const composeFile = 'docker-compose.tracetest.yml';
const testFile = 'tracetest/formaos-health.yaml';
const tracetestBaseUrl =
  process.env.TRACETEST_BASE_URL || 'http://host.docker.internal:3000';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      TRACETEST_BASE_URL: tracetestBaseUrl,
    },
    ...options,
  });
}

function hasCommand(command, args = ['--version']) {
  const result = spawnSync(command, args, { stdio: 'ignore' });
  return result.status === 0;
}

function runTracetest(args) {
  if (hasCommand('tracetest')) {
    return run('tracetest', ['--server-url', 'http://localhost:11633', ...args]);
  }

  return run('docker', [
    'run',
    '--rm',
    '--network',
    'formaos_default',
    '-e',
    `TRACETEST_BASE_URL=${tracetestBaseUrl}`,
    '-v',
    `${process.cwd()}:/work`,
    '-w',
    '/work',
    '--entrypoint',
    '/app/tracetest',
    'kubeshop/tracetest:v1.7.1',
    '--server-url',
    'http://tracetest:11633',
    ...args,
  ]);
}

if (!hasCommand('docker')) {
  console.error(
    'Docker is required to run self-hosted Tracetest locally, but docker was not found on PATH.',
  );
  console.error(
    'Install Docker, start the FormaOS app on localhost:3000, then run npm run tracetest:local.',
  );
  process.exit(1);
}

const up = run('docker', ['compose', '-f', composeFile, 'up', '-d']);
if (up.status !== 0) process.exit(up.status ?? 1);

const test = runTracetest([
  'run',
  'test',
  '--file',
  testFile,
]);

process.exit(test.status ?? 1);
