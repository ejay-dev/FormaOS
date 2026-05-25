#!/usr/bin/env node
/**
 * CI guard: fail if framework-packs/manifest.json is out of sync
 * with the actual file hashes. Run after any change to
 * framework-packs/ so a contributor who edits a pack without
 * rehashing the manifest gets a fast-failing CI signal.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.resolve(__dirname, '..', 'framework-packs');
const MANIFEST = path.join(PACKS_DIR, 'manifest.json');

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
} catch (err) {
  console.error(
    `[check-framework-packs-integrity] cannot read ${MANIFEST}: ${err.message}`,
  );
  process.exit(1);
}

if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
  console.error(
    `[check-framework-packs-integrity] manifest must be a JSON object`,
  );
  process.exit(1);
}

const files = readdirSync(PACKS_DIR)
  .filter((name) => name !== 'manifest.json')
  .filter((name) => /\.(json|ya?ml)$/i.test(name))
  .sort();

const violations = [];
const manifestKeys = new Set(Object.keys(manifest));

for (const name of files) {
  const full = path.join(PACKS_DIR, name);
  const actual = createHash('sha256')
    .update(readFileSync(full))
    .digest('hex');
  const expected = manifest[name];
  manifestKeys.delete(name);
  if (!expected) {
    violations.push(`${name}: not in manifest (compute=${actual.slice(0, 12)}…)`);
    continue;
  }
  if (expected !== actual) {
    violations.push(
      `${name}: hash mismatch (manifest=${expected.slice(0, 12)}…, actual=${actual.slice(0, 12)}…)`,
    );
  }
}

for (const stale of manifestKeys) {
  violations.push(`${stale}: in manifest but file is gone`);
}

if (violations.length > 0) {
  console.error('\n[check-framework-packs-integrity] FAIL:\n');
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    '\nFix: run `npm run framework-packs:rehash` and commit the updated manifest.\n',
  );
  process.exit(1);
}

console.log(
  `[check-framework-packs-integrity] OK: ${files.length} packs verified against manifest.`,
);
