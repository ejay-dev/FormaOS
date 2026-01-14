import { requireFounderAccess } from "@/app/app/admin/access";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireFounderAccess();

    // Mock security events
    const events = [
      {
        id: "1",
        event_type: "login",
        severity: "low" as const,
        user_email: "user@example.com",
        description: "Successful login from 192.168.1.1",
        timestamp: new Date().toISOString(),
        ip_address: "192.168.1.1",
      },
      {
        id: "2",
        event_type: "role_change",
        severity: "medium" as const,
        user_email: "admin@example.com",
        organization_id: "org_123",
        description: "User promoted to admin role",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip_address: "203.0.113.1",
      },
      {
        id: "3",
        event_type: "login_failed",
        severity: "high" as const,
        user_email: "unknown@example.com",
        description: "Failed login attempt (invalid credentials)",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        ip_address: "198.51.100.1",
      },
    ];

    return NextResponse.json({ events });
  } catch (error) {
    console.error("/api/admin/security error:", error);
    return NextResponse.json(
      { error: "Failed to fetch security events" },
      { status: 500 }
    );
  }
}
