import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { consoleShim } from '@/lib/monitoring/console-shim';

/**
 * Framework-pack integrity manifest.
 *
 * Compliance controls in framework-packs/*.json are the source of
 * truth for SOC2/ISO/HIPAA/etc. evaluation. Anyone with merge access
 * (or a compromised dependency that writes to framework-packs/) can
 * silently downgrade a control definition. The manifest tracks
 * SHA-256 per file; loadFrameworkPack verifies before parse.
 *
 * Workflow:
 *   1. Developer edits framework-packs/<slug>.json
 *   2. Developer runs `npm run framework-packs:rehash`
 *   3. Both file + manifest committed together
 *   4. CI script (scripts/check-framework-packs-integrity.mjs) fails
 *      if manifest is out of sync with file hashes
 *   5. Runtime: loader rejects unmanaged or mismatched files
 *
 * The manifest file itself lives at framework-packs/manifest.json
 * and is intentionally world-readable — its only purpose is integrity
 * verification, not confidentiality.
 */

export const MANIFEST_PATH = path.resolve(
  process.cwd(),
  'framework-packs',
  'manifest.json',
);

export const FRAMEWORK_PACKS_DIR = path.resolve(
  process.cwd(),
  'framework-packs',
);

export type FrameworkPackManifest = Record<string, string>;

export async function computeFileSha256(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

export function computeContentSha256(contents: Buffer | string): string {
  return createHash('sha256')
    .update(typeof contents === 'string' ? Buffer.from(contents) : contents)
    .digest('hex');
}

export async function readManifest(): Promise<FrameworkPackManifest> {
  const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('framework-packs/manifest.json must be a JSON object');
  }
  // Coerce to string-valued map. Reject any non-string value early.
  const out: FrameworkPackManifest = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      throw new Error(
        `framework-packs/manifest.json: value for "${key}" must be a SHA-256 string`,
      );
    }
    out[key] = value;
  }
  return out;
}

/**
 * Verify a framework-pack file against the manifest. Returns the
 * verified content as a string when ok, throws otherwise.
 *
 * Behaviour when the manifest is EMPTY:
 *  - In production / CI: throw. Empty manifest is a misconfiguration
 *    and must be regenerated before deploying.
 *  - In development: warn once via console.warn and pass. Lets new
 *    files be created locally before the developer runs the
 *    rehash script.
 *
 * The "is the manifest empty?" check is per-call so a manifest that
 * gains its first entry mid-process behaves correctly.
 */
let devEmptyManifestWarned = false;

export async function verifyFrameworkPackFile(
  filePath: string,
): Promise<string> {
  const absolute = path.resolve(filePath);
  const relative = path.relative(FRAMEWORK_PACKS_DIR, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `verifyFrameworkPackFile: ${filePath} is outside framework-packs/`,
    );
  }

  const contents = await fs.readFile(absolute, 'utf8');
  const actual = computeContentSha256(contents);

  const manifest = await readManifest();
  const manifestEmpty = Object.keys(manifest).length === 0;
  const expected = manifest[relative];

  if (manifestEmpty) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `framework-packs/manifest.json is empty — refusing to load ${relative} in production. ` +
          `Run "npm run framework-packs:rehash" and commit the manifest.`,
      );
    }
    if (!devEmptyManifestWarned) {
      devEmptyManifestWarned = true;
      consoleShim.warn(
        '[framework-packs] manifest.json is empty — skipping integrity check (dev only).',
      );
    }
    return contents;
  }

  if (!expected) {
    throw new Error(
      `${relative} is not listed in framework-packs/manifest.json — ` +
        `add it via "npm run framework-packs:rehash" and commit.`,
    );
  }

  if (expected !== actual) {
    throw new Error(
      `Framework pack integrity check failed for ${relative}. ` +
        `Expected ${expected.slice(0, 12)}…, got ${actual.slice(0, 12)}…. ` +
        `If the change is legitimate, run "npm run framework-packs:rehash" and commit.`,
    );
  }

  return contents;
}
