import { requireFounderAccess } from "@/app/app/admin/access";
import { NextResponse } from "next/server";

// In-memory feature store (could be database-backed)
const FEATURES = [
  {
    key: "audit_export",
    name: "Audit Export",
    description: "Export audit logs as CSV",
    enabled: true,
  },
  {
    key: "certifications",
    name: "Certifications",
    description: "Display security certifications",
    enabled: true,
  },
  {
    key: "framework_evaluations",
    name: "Framework Evaluations",
    description: "Enable framework evaluation workflows",
    enabled: true,
  },
  {
    key: "reports",
    name: "Reports",
    description: "Generate custom reports",
    enabled: true,
  },
  {
    key: "limits",
    name: "Resource Limits",
    description: "Enforce resource limits",
    enabled: true,
    global_limit: 1000,
  },
];

export async function GET() {
  try {
    await requireFounderAccess();

    const features = FEATURES.map((f) => ({
      ...f,
      current_usage: Math.floor(Math.random() * (f.global_limit ?? 100)),
    }));

    return NextResponse.json({ features });
  } catch (error) {
    console.error("/api/admin/features error:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}
