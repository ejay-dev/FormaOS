import { randomUUID } from 'crypto';

export function createCorrelationId(): string {
  return randomUUID();
}
