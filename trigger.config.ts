import { defineConfig } from '@trigger.dev/sdk';

export default defineConfig({
  runtime: 'node',
  project: process.env.TRIGGER_PROJECT_REF?.trim() || 'proj_local_placeholder',
  dirs: ['trigger'],
  tsconfig: 'tsconfig.json',
  maxDuration: 300,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsoleLogging: true,
});
