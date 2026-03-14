import type { ApiKeyScope } from './scopes';

export interface ApiKey {
  id: string;
  org_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  scopes: ApiKeyScope[];
  rate_limit: number;
  last_used: string | null;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiKeyUsageLog {
  id: string;
  api_key_id: string;
  org_id: string;
  scope: string | null;
  method: string;
  path: string;
  status_code: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ApiKeyValidationResult {
  ok: boolean;
  apiKey?: ApiKey;
  remaining?: number;
  resetAt?: number;
  error?: string;
  status?: number;
}

