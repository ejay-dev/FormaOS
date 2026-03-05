import { NextResponse } from "next/server";
import { ensureDebugAccess } from "@/app/api/debug/_guard";
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/debug/log');

export async function POST(request: Request) {
  const guard = await ensureDebugAccess();
  if (guard) return guard;

  try {
    const payload = await request.json().catch(() => null);
    log.error({ err: payload }, "[debug/log] client debug:");
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err: err }, "[debug/log] failed to log client debug:");
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
