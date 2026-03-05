/**
 * CORS helpers for FormaOS public REST API v1 (/api/v1/*)
 *
 * Usage in route handlers:
 *   import { corsHeaders, optionsResponse } from '@/lib/api/cors';
 *
 *   // Preflight
 *   export async function OPTIONS() { return optionsResponse(); }
 *
 *   // Normal response — spread corsHeaders into NextResponse
 *   return NextResponse.json(data, { headers: corsHeaders });
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const;

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}
