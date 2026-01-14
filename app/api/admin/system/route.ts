import { requireFounderAccess } from "@/app/app/admin/access";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireFounderAccess();

    const status = {
      api_uptime: 99.94,
      error_rate: 0.08,
      build_version: "v1.0.0",
      build_timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      database_latency_ms: 18,
      active_jobs: 42,
      failed_jobs: 2,
      last_health_check: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("/api/admin/system error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system status" },
      { status: 500 }
    );
  }
}
