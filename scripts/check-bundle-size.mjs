#!/usr/bin/env node

// Sprint 2 (2026-05-23): real assertion for the Bundle size CI step
// that previously was just `ls -la .next/static/chunks/ | head -10`.
//
// Caps the largest first-load chunk at MAX_CHUNK_BYTES and the total
// first-load chunk weight at MAX_TOTAL_BYTES. Both are deliberately
// generous over current actuals so this is a *safety net*, not a
// release-blocker masquerading as a SLO. Tighten over time.

import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');

// Current actuals on 2026-05-23: largest chunk 453 KB, total ~7.5 MB across
// 350 route+shared chunks. Caps set ~33% above current so a real regression
// trips, business-as-usual growth doesn't. Ratchet down as the team trims.
const MAX_CHUNK_BYTES = Number(process.env.MAX_CHUNK_BYTES ?? 600_000);
const MAX_TOTAL_BYTES = Number(process.env.MAX_TOTAL_BYTES ?? 10_000_000);

function fmtKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

let chunks;
try {
  chunks = readdirSync(chunksDir)
    .filter((file) => /\.(js|css)$/.test(file))
    .map((file) => {
      const full = path.join(chunksDir, file);
      const { size } = statSync(full);
      return { file, size };
    })
    .sort((a, b) => b.size - a.size);
} catch (error) {
  console.error(`Could not read ${chunksDir}: ${error.message}`);
  console.error('Did the build run before this script?');
  process.exit(2);
}

if (chunks.length === 0) {
  console.error(`No chunks found in ${chunksDir} — bundle analysis aborted.`);
  process.exit(2);
}

const failures = [];
const largest = chunks[0];
const total = chunks.reduce((sum, c) => sum + c.size, 0);

console.log(`Bundle size report — ${chunks.length} top-level chunks`);
console.log(`  Largest: ${largest.file} (${fmtKb(largest.size)})`);
console.log(`  Total:   ${fmtKb(total)}`);
console.log(`  Caps:    max chunk ${fmtKb(MAX_CHUNK_BYTES)}, total ${fmtKb(MAX_TOTAL_BYTES)}`);
console.log('  Top 5:');
for (const chunk of chunks.slice(0, 5)) {
  console.log(`    ${fmtKb(chunk.size).padStart(10)}  ${chunk.file}`);
}

if (largest.size > MAX_CHUNK_BYTES) {
  failures.push(
    `Largest chunk ${largest.file} is ${fmtKb(largest.size)}, over cap ${fmtKb(MAX_CHUNK_BYTES)}.`,
  );
}

if (total > MAX_TOTAL_BYTES) {
  failures.push(
    `Total first-load weight ${fmtKb(total)} is over cap ${fmtKb(MAX_TOTAL_BYTES)}.`,
  );
}

if (failures.length > 0) {
  for (const message of failures) console.error(`FAIL ${message}`);
  console.error(
    'If a real-product growth pushed us past the cap, raise MAX_CHUNK_BYTES / MAX_TOTAL_BYTES in scripts/check-bundle-size.mjs with a one-line justification. If the chunk is bloat, ship a fix.',
  );
  process.exit(1);
}

console.log('Bundle size within caps.');
