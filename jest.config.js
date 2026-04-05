const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/gitnexus/',
    '<rootDir>/.gitnexus/',
    '<rootDir>/tests/cta.spec.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/gitnexus/', '<rootDir>/.gitnexus/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    // Components excluded from unit-test coverage — covered via Playwright E2E + BackstopJS visual tests
    '!components/**',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.stories.tsx',
    '!**/*.config.ts',
    '!**/types/**',
  ],
  // Coverage thresholds – ratcheted to current actuals (2026-03-19).
  // Ratcheted to 40% statements after comprehensive test expansion.
  coverageThreshold: {
    global: {
      branches: 34,
      functions: 43,
      lines: 40,
      statements: 40,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@exodus|isomorphic-dompurify)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
