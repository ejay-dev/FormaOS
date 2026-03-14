import 'server-only';

import { randomBytes } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { V1AuthContext } from '@/lib/api-keys/middleware';

export function getActorId(context: V1AuthContext): string {
  return context.userId ?? context.apiKeyId ?? 'system';
}

export function getStringParam(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const value = searchParams.get(key)?.trim();
  return value ? value : null;
}

export function getBooleanParam(
  searchParams: URLSearchParams,
  key: string,
): boolean | null {
  const raw = searchParams.get(key)?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return null;
}

export function getArrayParam(
  searchParams: URLSearchParams,
  key: string,
): string[] {
  const raw = searchParams.get(key)?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeLikeQuery(value: string): string {
  return value.replace(/[%_]/g, '').trim();
}

export function buildIlikePattern(value: string): string {
  return `%${sanitizeLikeQuery(value)}%`;
}

export async function countRows(
  table: string,
  build: (
    query: ReturnType<ReturnType<typeof createSupabaseAdminClient>['from']>,
  ) => ReturnType<ReturnType<typeof createSupabaseAdminClient>['from']>,
): Promise<number> {
  const admin = createSupabaseAdminClient();
  const base = admin.from(table).select('id', { count: 'exact', head: true });
  const query = build(base as never);
  const { count } = await query;
  return count ?? 0;
}

export function createInvitationToken() {
  return randomBytes(32).toString('hex');
}
