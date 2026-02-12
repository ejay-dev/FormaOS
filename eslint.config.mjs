import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
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
      formaos: formaosDesign,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'prefer-const': 'warn',
      'no-console': 'off',

      // Design system enforcement
      'formaos/no-hardcoded-colors': 'warn',

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
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-access-key': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'warn',
    },
  },
  // Marketing pages are allowed to use bespoke styling; do not gate commits on
  // tokenization warnings here (keeps warning counts below CI thresholds).
  {
    files: ['app/(marketing)/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'formaos/no-hardcoded-colors': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
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
];

export default eslintConfig;
