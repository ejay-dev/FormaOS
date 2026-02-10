#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Skip root checks on Vercel - environment is pre-validated
if (process.env.VERCEL === '1') {
  process.exit(0);
}

const cwd = process.cwd();
const requiredPaths = [
  {
    label: 'package.json',
    exists: fs.existsSync(path.join(cwd, 'package.json')),
  },
  { label: 'app/', exists: fs.existsSync(path.join(cwd, 'app')) },
];

const nextConfigCandidates = [
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'next.config.cjs',
];

const hasNextConfig = nextConfigCandidates.some((candidate) =>
  fs.existsSync(path.join(cwd, candidate)),
);

const missing = requiredPaths
  .filter((entry) => !entry.exists)
  .map((entry) => entry.label);
if (!hasNextConfig) {
  missing.push('next.config.*');
}

if (missing.length > 0) {
  const fallbackRoot = path.join(os.homedir(), 'formaos');
  const rootHint = fs.existsSync(fallbackRoot)
    ? `Try: cd ${fallbackRoot}`
    : 'Please cd into the project root and try again.';

  console.error('\nFormaOS root guard: not in the project root.');
  console.error(`Current directory: ${cwd}`);
  console.error(`Missing: ${missing.join(', ')}`);
  console.error(rootHint);
  console.error(
    '\nIf you are in the right folder, ensure the repo is fully checked out.',
  );
  process.exit(1);
}
