// Dedicated ESLint config for the tenant-isolation punch list.
//
// Audit 2026-05-26: the `formaos/no-admin-client-with-org-filter` rule
// surfaces every file still on createSupabaseAdminClient + .eq(org_id|
// organization_id) — the legacy pattern that can leak rows across
// tenants when FORCE RLS is enabled. It is intentionally OFF in the
// default eslint.config.mjs because there are ~500 historical
// occurrences and the CI ceiling (--max-warnings 25) would explode.
//
// Use this config on-demand via:
//
//   npm run lint:tenant-isolation
//
// The output is the migration punch list: every line is a file that
// needs review (migrate → org-scoped client, OR add an
// `eslint-disable-next-line` with a justifying comment if cross-tenant
// access is intentional).

import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import formaosDesign from './lib/eslint/formaos-design-rules.mjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      'coverage/**/*',
      'test-results/**/*',
      'playwright-report/**/*',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      formaos: formaosDesign,
    },
    rules: {
      'formaos/no-admin-client-with-org-filter': 'warn',
    },
  },
];
