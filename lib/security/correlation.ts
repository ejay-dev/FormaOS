import { randomUUID } from "crypto";

export function createCorrelationId(): string {
  try {
    return randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
