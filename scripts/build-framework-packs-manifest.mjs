#!/usr/bin/env node
/**
 * Regenerate framework-packs/manifest.json — a SHA-256 hash per
 * file under framework-packs/ (excluding manifest.json itself).
 *
 * Run when adding/editing a pack: `npm run framework-packs:rehash`.
 * CI uses scripts/check-framework-packs-integrity.mjs to verify the
 * committed manifest matches the actual file hashes.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.resolve(__dirname, '..', 'framework-packs');
const MANIFEST = path.join(PACKS_DIR, 'manifest.json');

const entries = readdirSync(PACKS_DIR)
  .filter((name) => name !== 'manifest.json')
  .filter((name) => /\.(json|ya?ml)$/i.test(name))
  .sort();

const manifest = {};
for (const name of entries) {
  const full = path.join(PACKS_DIR, name);
  const data = readFileSync(full);
  manifest[name] = createHash('sha256').update(data).digest('hex');
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `[framework-packs] manifest.json rebuilt — ${entries.length} files hashed.`,
);
