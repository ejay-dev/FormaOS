import { NextResponse } from "next/server";
import { ensureDebugAccess } from "@/app/api/debug/_guard";

export async function POST(request: Request) {
  const guard = await ensureDebugAccess();
  if (guard) return guard;

  try {
    const payload = await request.json().catch(() => null);
    console.error("[debug/log] client debug:", payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[debug/log] failed to log client debug:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
