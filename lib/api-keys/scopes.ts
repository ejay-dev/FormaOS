export const API_KEY_SCOPES = [
  // Operational scopes (granular)
  'tasks:read',
  'tasks:write',
  'tasks:delete',
  'evidence:read',
  'evidence:write',
  'compliance:read',
  'compliance:write',
  'forms:read',
  'forms:write',
  'audit:read',
  'webhooks:manage',
  'api_keys:manage',
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
  'search:write',
  'ai:read',
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

/**
 * Broader scopes that subsume the rights of narrower ones. A key
 * granted `compliance:write` should also satisfy `forms:write` and
 * `tasks:write`, since those used to all be lumped under "anything
 * that mutates a compliance artefact." This keeps existing API
 * consumers working while audit-v4-014 introduces the narrower
 * scopes — without it, any tightening would break every customer
 * key that was scoped before the split.
 */
const SCOPE_IMPLICATIONS: Partial<Record<ApiKeyScope, ApiKeyScope[]>> = {
  'compliance:write': [
    'compliance:read',
    'forms:read',
    'forms:write',
    'tasks:read',
    'tasks:write',
    'tasks:delete',
    'evidence:read',
    'evidence:write',
  ],
  'compliance:read': ['forms:read', 'tasks:read', 'evidence:read'],
  'tasks:write': ['tasks:read'],
  'forms:write': ['forms:read'],
  'evidence:write': ['evidence:read'],
  'reports:write': ['reports:read'],
  'search:write': ['search:read'],
  'members:write': ['members:read'],
  'notifications:write': ['notifications:read'],
  'integrations:write': ['integrations:read'],
};

function expandGrantedScopes(
  grantedScopes: readonly string[],
): Set<ApiKeyScope> {
  const expanded = new Set<ApiKeyScope>();
  for (const granted of grantedScopes) {
    if (!isApiKeyScope(granted)) continue;
    expanded.add(granted);
    for (const implied of SCOPE_IMPLICATIONS[granted] ?? []) {
      expanded.add(implied);
    }
  }
  return expanded;
}

export function hasRequiredScopes(
  grantedScopes: readonly string[],
  requiredScopes: readonly ApiKeyScope[],
): boolean {
  if (requiredScopes.length === 0) return true;
  const granted = expandGrantedScopes(grantedScopes);
  return requiredScopes.every((scope) => granted.has(scope));
}
