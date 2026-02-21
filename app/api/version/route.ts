import { NextResponse } from 'next/server';

const BUILT_AT = new Date().toISOString();

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      commitSha:
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.GIT_COMMIT_SHA ??
        'unknown',
      commitRef:
        process.env.VERCEL_GIT_COMMIT_REF ??
        process.env.GIT_COMMIT_REF ??
        'unknown',
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? 'unknown',
      builtAt: BUILT_AT,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
