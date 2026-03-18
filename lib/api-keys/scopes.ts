export const API_KEY_SCOPES = [
  'tasks:read',
  'tasks:write',
  'evidence:read',
  'evidence:write',
  'compliance:read',
  'audit:read',
  'webhooks:manage',
  'members:read',
  'members:write',
  'reports:read',
  'reports:write',
  'frameworks:read',
  'organizations:read',
  'certificates:read',
  'controls:read',
  'notifications:read',
  'notifications:write',
  'integrations:read',
  'integrations:write',
  'search:read',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const READ_ONLY_API_KEY_SCOPES = API_KEY_SCOPES.filter((scope) =>
  scope.endsWith(':read'),
) as ApiKeyScope[];

export function isApiKeyScope(value: string): value is ApiKeyScope {
  return (API_KEY_SCOPES as readonly string[]).includes(value);
}

export function normalizeApiKeyScopes(scopes: Iterable<string>): ApiKeyScope[] {
  return Array.from(new Set(Array.from(scopes).filter(isApiKeyScope))).sort();
}

export function hasRequiredScopes(
  grantedScopes: readonly string[],
  requiredScopes: readonly ApiKeyScope[],
): boolean {
  const granted = new Set(grantedScopes);
  return requiredScopes.every((scope) => granted.has(scope));
}

