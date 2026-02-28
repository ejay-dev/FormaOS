/** @jest-environment node */

import { execFileSync } from 'child_process';
import path from 'path';

describe('marketing enterprise copy audit', () => {
  it('passes strict copy budgets for hero sections', () => {
    const scriptPath = path.join(
      process.cwd(),
      'tests/marketing/marketing-enterprise-audit.mjs',
    );

    expect(() => {
      execFileSync('node', [scriptPath, '--strict'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });
    }).not.toThrow();
  });
});
