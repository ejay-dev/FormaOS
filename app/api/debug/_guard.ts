import { NextResponse } from "next/server";
import { requireFounderAccess } from "@/app/app/admin/access";

export async function ensureDebugAccess() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await requireFounderAccess();
    return null;
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
