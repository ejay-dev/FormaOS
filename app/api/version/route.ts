import { NextResponse } from 'next/server';

const BUILT_AT = new Date().toISOString();

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      version: '1.0.0',
      status: 'ok',
      builtAt: BUILT_AT,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
