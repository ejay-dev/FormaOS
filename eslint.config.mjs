import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unusedImports from 'eslint-plugin-unused-imports';
import formaosDesign from './lib/eslint/formaos-design-rules.mjs';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      '.next/**/*',
      'out/**/*',
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      '.vercel/**/*',
      'test-results/**/*',
      'playwright-report/**/*',
      'QA_UPGRADES/**/*.txt',
      'coverage/**/*',
      // External subproject — has its own lint config
      'gitnexus/**/*',
      // CI-only artifacts and legacy test outputs (avoid warning-count blowups)
      'tests/visual/backstop_data/**/*',
      'tests/accessibility/reports/**/*',
      'selenium-tests/**/*',
      '**/*.min.js',
      'run-*.js',
      'test-*.js',
      'node_wire_verification_test.js',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports,
      formaos: formaosDesign,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'prefer-const': 'warn',
      'no-console': 'off',

      // Design system enforcement
      'formaos/no-hardcoded-colors': 'warn',

      // Tenant isolation: this rule warns when admin client + org filter
      // pattern is detected (Audit 2026-05-26). Disabled in the default
      // config because there are ~512 historical occurrences across
      // un-migrated files; turning it on would blow past the
      // --max-warnings 25 CI ceiling.
      //
      // Run on-demand via `npm run lint:tenant-isolation` to see the
      // migration punch list. As more files are migrated to
      // createSupabaseOrgClient, the count drops; once below 25 we can
      // flip this rule back to 'warn' in the default config.
      'formaos/no-admin-client-with-org-filter': 'off',

      // Accessibility rules (WCAG 2.2 AA)
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'warn',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': ['warn', {
        assert: 'either',
        controlComponents: ['Input', 'Select', 'Textarea', 'Switch'],
        depth: 3,
      }],
      'jsx-a11y/no-access-key': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'warn',

      // Audit 2026-05-26 — banned imports.
      //
      // `@/lib/logger` was misleadingly named: it inserts into
      // `org_audit_log`, not a structured logger. Renamed to
      // `@/lib/audit/legacy-log-activity` to make intent obvious.
      //
      // For *real* structured logging use `@/lib/monitoring/server-logger`
      // (pino + PII redaction). For audit events use
      // `@/app/app/actions/audit` (the server-action wrapper that
      // verifies session→org match) or `@/lib/audit/log-activity` (the
      // lib-level core).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/logger',
              message:
                'Renamed: use @/lib/audit/legacy-log-activity (audit writer) — or for real structured logging, @/lib/monitoring/server-logger.',
            },
            {
              // P0-2 (2026-05-26): the non-hash-chained audit writer was
              // deleted after the last caller migrated to
              // @/lib/audit/log-audit-event. Block resurrection here so a
              // new caller can't bring it back via grep + git restore.
              name: '@/lib/audit-trail',
              message:
                'Removed: use @/lib/audit/log-audit-event (hash-chained writer) via the @/app/app/actions/audit server-action wrapper.',
            },
          ],
        },
      ],
    },
  },
  // Marketing pages and components use bespoke styling; do not gate commits on
  // tokenization warnings here (keeps warning counts below CI thresholds).
  {
    files: [
      'app/(marketing)/**/*.{js,jsx,ts,tsx}',
      'components/marketing/**/*.{js,jsx,ts,tsx}',
      'components/motion/**/*.{js,jsx,ts,tsx}',
      'components/blog/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      'formaos/no-hardcoded-colors': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  // Tests and tooling scripts should not block merges on unused vars warnings.
  {
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{js,jsx,ts,tsx}',
      'e2e/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // P0-10 (2026-05-26) — ban Math.random in security-sensitive directories.
  // crypto.randomUUID / randomInt / randomBytes have proper unpredictability
  // and are cheap enough that there is no reason to prefer Math.random
  // anywhere a value influences auth, rate limits, session markers, or
  // sampling decisions inside security flows.
  {
    files: ['lib/security/**/*.{ts,tsx}', 'lib/api-keys/**/*.{ts,tsx}'],
    rules: {
      'formaos/no-math-random': 'error',
    },
  },
];

export default eslintConfig;
