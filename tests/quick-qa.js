#!/usr/bin/env node
/**
 * Quick Quality Assurance Test Runner
 * Fast subset of tests for development workflow
 *
 * Audit 2026-08-03 — this file had been written to disk with every newline
 * escaped as a literal backslash-n, so the whole 3KB program was a single
 * physical line beginning with `#!`. Node strips the shebang from position 0
 * up to the first real newline (here: EOF), executed an empty module, printed
 * nothing and exited 0. `npm run test:qa:quick` — and `npm run test:qa:full`,
 * which chains it — were silent no-ops. The body below is the recovered
 * source (verified as the exact inverse of the escaping), plus fixes for the
 * paths that reported success without running anything:
 *   1. `main().catch(console.error)` swallowed every crash and exited 0.
 *   2. `npm test -- --passWithNoTests` made "jest matched zero test files"
 *      count as a pass.
 *   3. The accessibility step pointed at tests/accessibility/accessibility-
 *      audit.js, which does not exist (the file is a11y-audit.js), so the
 *      step always took the "not found, skipping" branch and never ran.
 */

const { execSync } = require('child_process');

const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  reset: '\x1b[0m',
};

function print(status, message) {
  const color = colors[status] || colors.reset;
  console.log(`${color}[${status.toUpperCase()}]${colors.reset} ${message}`);
}

async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

function runCommand(command, description, env) {
  print('blue', `Running ${description}...`);
  try {
    execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      env: { ...process.env, ...(env || {}) },
    });
    print('green', `✅ ${description} passed`);
    return true;
  } catch (error) {
    print('red', `❌ ${description} failed`);
    if (error.stdout) print('yellow', error.stdout.substring(0, 200) + '...');
    if (error.stderr) print('yellow', error.stderr.substring(0, 200) + '...');
    return false;
  }
}

async function main() {
  print('blue', '🧪 Quick QA Test Suite');
  print('blue', '=====================');

  const startTime = Date.now();
  let passed = 0;
  let total = 0;

  // 1. TypeScript Check
  total++;
  if (runCommand('npm run type-check', 'TypeScript compilation')) {
    passed++;
  }

  // 2. Linting
  total++;
  if (runCommand('npm run lint', 'ESLint analysis')) {
    passed++;
  }

  // 3. Unit Tests
  // --passWithNoTests removed 2026-08-03: it turned "jest matched no test
  // files" (a broken config, or a testPathIgnorePatterns entry that
  // swallowed the whole suite) into a green run.
  total++;
  if (runCommand('npm test -- --silent', 'Unit tests')) {
    passed++;
  }

  // 4. A/B Testing Validation
  total++;
  if (runCommand('npm run ab-test:validate', 'A/B test validation')) {
    passed++;
  }

  // 5. Server Check (if running)
  const serverRunning = await checkServer();
  if (serverRunning) {
    print('green', '✅ Development server detected');

    // 6. Quick Accessibility Check — reuses the already-running server so
    // the step stays "quick". `npm run test:a11y` exits non-zero on axe
    // violations, unlike tests/accessibility/a11y-audit.js which ends in
    // `.catch(console.error)` and always exits 0.
    total++;
    if (
      runCommand('npm run test:a11y', 'Quick accessibility check', {
        PLAYWRIGHT_REUSE_SERVER: 'true',
      })
    ) {
      passed++;
    }
  } else {
    print('yellow', '⚠️ Development server not running, skipping server-dependent tests');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  print('blue', '\n📊 Quick Test Summary:');
  print('blue', `   Duration: ${duration}s`);
  print('blue', `   Passed: ${passed}/${total} tests`);
  print('blue', `   Success Rate: ${successRate}%`);

  if (passed === total) {
    print('green', '\n🎉 All quick tests passed!');
    process.exit(0);
  } else {
    print('red', `\n❌ ${total - passed} test(s) failed`);
    print('yellow', "   Run 'npm run test:qa:full' for detailed analysis");
    process.exit(1);
  }
}

main().catch((error) => {
  // Previously `main().catch(console.error)`: a crash in the runner logged a
  // stack trace and still exited 0, so CI read it as a pass.
  print('red', `❌ Quick QA runner crashed: ${error && error.message}`);
  console.error(error);
  process.exit(1);
});
