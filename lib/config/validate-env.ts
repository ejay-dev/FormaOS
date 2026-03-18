import {
  getEnvValidationError,
  validateAllEnvVars,
} from '@/lib/env-validation';
import { healthLogger } from '@/lib/observability/structured-logger';

type EnvValidationResult = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

export function validateEnvironment(): EnvValidationResult {
  const result = validateAllEnvVars();
  return {
    valid: result.valid,
    missing: result.missing,
    warnings: result.errors,
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    healthLogger.error(
      'environment_validation_failed',
      {
        code: 'ENVIRONMENT_VALIDATION_FAILED',
        message: 'Required environment variables are missing.',
      },
      {
        missing: result.missing,
      },
    );
  } else {
    healthLogger.info('environment_validation_passed');
  }

  if (result.warnings.length > 0) {
    healthLogger.warn('environment_validation_warnings', {
      warnings: result.warnings,
    });
  }
}

/**
 * Throws an error if environment is not valid
 * Use this in critical paths where the app cannot function without proper config
 */
export function requireValidEnvironment(): void {
  const error = getEnvValidationError();

  if (error) {
    throw new Error(`Environment validation failed:\n${error}`);
  }
}
