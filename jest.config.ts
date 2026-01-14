import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/roles.ts',
    'app/app/dashboard-wrapper.tsx',
    'app/app/page.tsx',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
};

export default config;
