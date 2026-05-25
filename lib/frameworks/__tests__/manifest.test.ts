/** @jest-environment node */
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

import {
  computeContentSha256,
  computeFileSha256,
} from '@/lib/frameworks/manifest';

// We cannot trivially mock the manifest path used by
// verifyFrameworkPackFile because it resolves against process.cwd(). The
// behaviour-level test in scripts/check-framework-packs-integrity.mjs
// covers end-to-end CI assertion. Here we focus on the pure helpers.

describe('computeContentSha256', () => {
  it('matches openssl sha256 for fixed input', () => {
    // Known good: echo -n "hello" | shasum -a 256
    const known =
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
    expect(computeContentSha256('hello')).toBe(known);
  });

  it('produces identical digest for buffer and string with same content', () => {
    const text = 'framework-packs/integrity sample';
    expect(computeContentSha256(text)).toBe(
      computeContentSha256(Buffer.from(text)),
    );
  });

  it('produces different digests for different content', () => {
    expect(computeContentSha256('a')).not.toBe(computeContentSha256('b'));
  });
});

describe('computeFileSha256', () => {
  it('hashes a real file on disk', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'fp-manifest-'));
    try {
      const filePath = path.join(dir, 'sample.json');
      const payload = JSON.stringify({ hello: 'world' });
      await fs.writeFile(filePath, payload, 'utf8');
      const computed = await computeFileSha256(filePath);
      expect(computed).toBe(computeContentSha256(payload));
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('returns different hashes when bytes change', async () => {
    const dir = await fs.mkdtemp(path.join(tmpdir(), 'fp-manifest-'));
    try {
      const a = path.join(dir, 'a.json');
      const b = path.join(dir, 'b.json');
      await fs.writeFile(a, randomBytes(64));
      await fs.writeFile(b, randomBytes(64));
      const ha = await computeFileSha256(a);
      const hb = await computeFileSha256(b);
      expect(ha).not.toBe(hb);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
