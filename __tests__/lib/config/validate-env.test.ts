jest.mock('@/lib/env-validation', () => ({
  validateAllEnvVars: jest.fn(() => ({
    valid: true,
    missing: [],
    errors: [],
  })),
  getEnvValidationError: jest.fn(() => null),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  healthLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  validateEnvironment,
  logEnvironmentStatus,
  requireValidEnvironment,
} from '@/lib/config/validate-env';

const {
  validateAllEnvVars,
  getEnvValidationError,
} = require('@/lib/env-validation');
const { healthLogger } = require('@/lib/observability/structured-logger');

describe('validateEnvironment', () => {
  it('returns valid result when all vars present', () => {
    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('returns invalid result with missing vars', () => {
    validateAllEnvVars.mockReturnValue({
      valid: false,
      missing: ['DATABASE_URL'],
      errors: ['DATABASE_URL is required'],
    });
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('DATABASE_URL');
    expect(result.warnings).toContain('DATABASE_URL is required');
  });
});

describe('logEnvironmentStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateAllEnvVars.mockReturnValue({
      valid: true,
      missing: [],
      errors: [],
    });
  });

  it('logs success when valid', () => {
    logEnvironmentStatus();
    expect(healthLogger.info).toHaveBeenCalledWith(
      'environment_validation_passed',
    );
  });

  it('logs error when invalid', () => {
    validateAllEnvVars.mockReturnValue({
      valid: false,
      missing: ['DB_URL'],
      errors: [],
    });
    logEnvironmentStatus();
    expect(healthLogger.error).toHaveBeenCalledWith(
      'environment_validation_failed',
      expect.any(Object),
      expect.objectContaining({ missing: ['DB_URL'] }),
    );
  });

  it('logs warnings when present', () => {
    validateAllEnvVars.mockReturnValue({
      valid: true,
      missing: [],
      errors: ['Consider setting SENTRY_DSN'],
    });
    logEnvironmentStatus();
    expect(healthLogger.warn).toHaveBeenCalledWith(
      'environment_validation_warnings',
      expect.objectContaining({
        warnings: ['Consider setting SENTRY_DSN'],
      }),
    );
  });
});

describe('requireValidEnvironment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnvValidationError.mockReturnValue(null);
  });

  it('does not throw when env is valid', () => {
    expect(() => requireValidEnvironment()).not.toThrow();
  });

  it('throws when env is invalid', () => {
    getEnvValidationError.mockReturnValue('Missing DATABASE_URL');
    expect(() => requireValidEnvironment()).toThrow(
      'Environment validation failed',
    );
  });
});
