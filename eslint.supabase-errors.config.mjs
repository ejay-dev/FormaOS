// Audit 2026-08-02: dedicated config for `formaos/no-unchecked-supabase-error`.
//
// Same shape and rationale as eslint.tenant-isolation.config.mjs — the rule is
// off in the main eslint.config.mjs because there are ~284 pre-existing call
// sites, which would blow past CI's `--max-warnings` ceiling. The ratchet in
// scripts/check-unchecked-supabase-error-ratchet.mjs holds the line so no NEW
// unchecked write can land while the backlog is worked down.
//
// Test files are excluded: they routinely fire-and-forget seed writes where a
// failure surfaces as a failing assertion anyway.

import tsParser from '@typescript-eslint/parser';
import formaos from './lib/eslint/formaos-design-rules.mjs';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'node_modules/**',
      '.next/**',
      'e2e/**',
      '__tests__/**',
      'tests/**',
      'selenium-tests/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { formaos },
    rules: {
      'formaos/no-unchecked-supabase-error': 'warn',
    },
  },
];
